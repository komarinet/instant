const VER_3DBG_ZONBI = "0.1.0"; // 椎名最終ステージ：斜め上視点、交差樹木、ウネウネ動く8本の首（yamauroテクスチャ）を完全実装

window.BGZonbiManager = {
    isActive: false,
    sceneGroup: null,
    scrollSpeed: 1.95, // 椎名ステージ3の山スクロールに近いスピード感
    bgScrollY: 0,
    trees: [],
    necks: [], // 3Dの首チューブの配列
    numNecks: 8,
    timeCounter: 0,

    init: function(bgManager) {
        this.bgManager = bgManager;
        if (!bgManager || !bgManager.scene) return;

        if (this.isActive) this.dispose();

        this.sceneGroup = new THREE.Group();
        bgManager.scene.add(this.sceneGroup);

        // ★超重要：真上（真下向き）より少しだけ下がる、やや斜め上からの目線にカメラを調整
        this.origCamY = bgManager.camera.position.y;
        this.origCamRotX = bgManager.camera.rotation.x;
        this.origFog = bgManager.scene.fog;

        bgManager.camera.position.set(0, 140, 40); // 少し手前に引き、高さを上げる
        bgManager.camera.rotation.x = -Math.PI / 2.3; // 真下より少し前方を向かせる

        // 深緑～黒の禍々しい山の霧を設定
        bgManager.scene.fog = new THREE.FogExp2(0x0a140a, 0.0015);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.sceneGroup.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xaaffaa, 1.0); // わずかに緑がかった月光
        dirLight.position.set(0, 200, 100);
        this.sceneGroup.add(dirLight);

        // 地面（tsuti.webp）の設定
        let tsutiTex = null;
        if (window.advManager && window.advManager.assets['tsuti.webp']) {
            tsutiTex = new THREE.CanvasTexture(window.advManager.assets['tsuti.webp']);
            tsutiTex.needsUpdate = true;
            tsutiTex.wrapS = THREE.RepeatWrapping;
            tsutiTex.wrapT = THREE.RepeatWrapping;
            tsutiTex.repeat.set(2, 4);
        }
        const groundGeo = new THREE.PlaneGeometry(600, 1200);
        const groundMat = new THREE.MeshStandardMaterial({
            map: tsutiTex,
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.set(0, 0, -200);
        this.sceneGroup.add(this.ground);

        // 木（tree.webp）を4枚交差させて立てるビルボード拡張オブジェクトの生成
        let treeTex = null;
        if (window.advManager && window.advManager.assets['tree.webp']) {
            treeTex = new THREE.CanvasTexture(window.advManager.assets['tree.webp']);
            treeTex.needsUpdate = true;
        }
        // 透過設定をONにしたマテリアル
        const treeMat = new THREE.MeshBasicMaterial({
            map: treeTex,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        this.trees = [];
        // フィールドに30本の交差樹木をランダムに初期配置
        for (let i = 0; i < 30; i++) {
            const treeGroup = new THREE.Group();
            const treeW = 40;
            const treeH = 90;
            const planeGeo = new THREE.PlaneGeometry(treeW, treeH);

            // 4枚のプレーンを45度ずつずらして交差（十字＋対角線）させ、どこから見ても立体的な木にする
            for (let j = 0; j < 4; j++) {
                const p = new THREE.Mesh(planeGeo, treeMat);
                p.rotation.y = (Math.PI / 4) * j;
                p.position.y = treeH / 2; // 根元を地面(y=0)に合わせる
                treeGroup.add(p);
            }

            treeGroup.position.set(
                (Math.random() - 0.5) * 450,
                0,
                -Math.random() * 1000 + 200
            );
            this.sceneGroup.add(treeGroup);
            this.trees.push(treeGroup);
        }

        // オロチの首用の蛇皮テクスチャ（yamauro.webp）の設定
        this.uroTex = null;
        if (window.advManager && window.advManager.assets['yamauro.webp']) {
            this.uroTex = new THREE.CanvasTexture(window.advManager.assets['yamauro.webp']);
            this.uroTex.needsUpdate = true;
            this.uroTex.wrapS = THREE.RepeatWrapping;
            this.uroTex.wrapT = THREE.RepeatWrapping;
            this.uroTex.repeat.set(1, 10);
        }
        this.neckMat = new THREE.MeshStandardMaterial({
            map: this.uroTex,
            color: 0x444444,
            roughness: 0.3,
            metalness: 0.7
        });

        // 8本の首のメッシュ枠を確保（最初は非表示、ボス戦開始でうねり出す）
        this.necks = [];
        this.isActive = true;
        this.timeCounter = 0;
    },

    update: function(delta) {
        if (!this.isActive) return;

        // ステージが切り替わったらクリーンアップ
        if (window.currentStage !== 6 || (window.stgManager && window.stgManager.stgId !== 'zonbi')) {
            this.dispose();
            return;
        }

        this.timeCounter += delta * 0.05;

        // 地面のシームレススクロール（上下反転引き継ぎループ風にマッピングのオフセットを回す）
        if (this.ground && this.ground.material.map) {
            this.ground.material.map.offset.y -= (this.scrollSpeed * 0.002) * delta;
        }

        // 木々を手前にスクロールさせ、画面外に出たら奥に再配置（わらわら感を維持）
        this.trees.forEach(t => {
            t.position.z += this.scrollSpeed * 2.5 * delta;
            if (t.position.z > 200) {
                t.position.z = -1000;
                t.position.x = (Math.random() - 0.5) * 450;
            }
        });

        // STGManager側でボスが湧いている場合、8本の首を3D空間にリアルタイム生成・ウネウネ更新
        if (window.stgManager && window.stgManager.bossSpawned && window.stgManager.enemies.length > 0) {
            this.updateOrochiNecks(delta);
        } else {
            // ボスがいない、または撃破されたら首をクリア
            this.clearNecks();
        }
    },

    updateOrochiNecks: function(delta) {
        // 一度古い首チューブをシーンから削除して再構築（ウネウネを動的なパスで表現するため）
        this.clearNecks();

        const stg = window.stgManager;
        // 2Dの敵リストからヤマタノオロチの頭（ヘッドパーツ）を最大8個抽出
        const heads = stg.enemies.filter(e => e.type === 'orochi_head');

        heads.forEach((h, index) => {
            // 2Dのキャンバス座標から3D空間のXY座標へ擬似変換マッピング
            const canvas = document.getElementById('gameCanvas');
            const dpr = window.devicePixelRatio || 1;
            const sW = canvas.width / dpr;
            const sH = canvas.height / dpr;

            // 画面の比率から3D空間の位置を概算
            const target3dX = ((h.x / sW) - 0.5) * 350;
            const target3dZ = ((h.y / sH) - 0.5) * 400 - 300;
            const target3dY = 40; // 頭の高さ

            // 画面最奥上部（天から生える根元）から、各2Dボスの頭部位置までを繋ぐウネウネ曲線を定義
            const startX = ((index - 3.5) * 40); // 根元を等間隔に分散
            const startZ = -700;
            const startY = 150; // 空高くから生やす

            // 不規則なうねりを演出するための正弦波ノイズ
            const waveOffset1 = Math.sin(this.timeCounter + index * 4.0) * 40;
            const waveOffset2 = Math.cos(this.timeCounter * 1.5 + index * 2.0) * 30;

            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(startX, startY, startZ),
                new THREE.Vector3(startX + waveOffset1, (startY + target3dY) / 2 + 30, (startZ + target3dZ) / 2),
                new THREE.Vector3(target3dX + waveOffset2, target3dY + 20, target3dZ - 50),
                new THREE.Vector3(target3dX, target3dY, target3dZ)
            ]);

            // チューブ状の立体を生成（半径4.5、分割数20）
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 4.5, 8, false);
            const tubeMesh = new THREE.Mesh(tubeGeo, this.neckMat);
            
            this.sceneGroup.add(tubeMesh);
            this.necks.push(tubeMesh);
        });
    },

    clearNecks: function() {
        this.necks.forEach(mesh => {
            if (this.sceneGroup) this.sceneGroup.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
        });
        this.necks = [];
    },

    dispose: function() {
        if (!this.isActive) return;
        this.clearNecks();
        if (this.sceneGroup && this.bgManager) {
            this.bgManager.scene.remove(this.sceneGroup);
            // カメラとフォグを元の状態に戻す
            this.bgManager.camera.position.set(0, 60, 0);
            this.bgManager.camera.rotation.x = this.origCamRotX;
            this.bgManager.scene.fog = this.origFog;
        }
        this.isActive = false;
    }
};
