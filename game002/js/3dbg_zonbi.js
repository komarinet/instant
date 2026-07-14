const VER_3DBG_ZONBI = "0.1.1"; // カメラ角度の修正、木の増量、変な壁の強制非表示、背景のシームレス化

window.BGZonbiManager = {
    isActive: false,
    sceneGroup: null,
    scrollSpeed: 1.95, 
    bgScrollY: 0,
    trees: [],
    necks: [], 
    numNecks: 8,
    timeCounter: 0,

    init: function(bgManager) {
        this.bgManager = bgManager;
        if (!bgManager || !bgManager.scene) return;

        if (this.isActive) this.dispose();

        this.sceneGroup = new THREE.Group();
        bgManager.scene.add(this.sceneGroup);

        this.origCamY = bgManager.camera.position.y;
        this.origCamRotX = bgManager.camera.rotation.x;
        this.origFog = bgManager.scene.fog;

        // ★修正：カメラを少し下げて斜め45度にし、立体感がしっかり出るように調整
        bgManager.camera.position.set(0, 180, 250); 
        bgManager.camera.rotation.x = -Math.PI / 3.5; 

        bgManager.scene.fog = new THREE.FogExp2(0x0a140a, 0.002);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.sceneGroup.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xaaffaa, 1.2); 
        dirLight.position.set(0, 200, 100);
        this.sceneGroup.add(dirLight);

        // ★修正：地面の溝（つなぎ目）を消すため、鏡像ループ(Mirrored)に変更して巨大化
        let tsutiTex = null;
        if (window.advManager && window.advManager.assets['tsuti.webp']) {
            tsutiTex = new THREE.CanvasTexture(window.advManager.assets['tsuti.webp']);
            tsutiTex.needsUpdate = true;
            tsutiTex.wrapS = THREE.MirroredRepeatWrapping;
            tsutiTex.wrapT = THREE.MirroredRepeatWrapping;
            tsutiTex.repeat.set(10, 10);
        }
        const groundGeo = new THREE.PlaneGeometry(4000, 4000);
        const groundMat = new THREE.MeshStandardMaterial({
            map: tsutiTex,
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        // 変な壁（トレンチ）を隠すために少しだけ高さを上げる
        this.ground.position.set(0, 2, -800);
        this.sceneGroup.add(this.ground);

        // 木の設定
        let treeTex = null;
        if (window.advManager && window.advManager.assets['tree.webp']) {
            treeTex = new THREE.CanvasTexture(window.advManager.assets['tree.webp']);
            treeTex.needsUpdate = true;
        }
        // ★修正：木の透過部分を完全に切り抜く alphaTest を追加して綺麗に交差させる
        const treeMat = new THREE.MeshBasicMaterial({
            map: treeTex,
            transparent: true,
            alphaTest: 0.5, 
            side: THREE.DoubleSide
        });

        this.trees = [];
        // ★修正：木の数を80本に大幅増量し、中央の道を開けて両サイドに森を作る
        for (let i = 0; i < 80; i++) {
            const treeGroup = new THREE.Group();
            const treeW = 60;
            const treeH = 140;
            const planeGeo = new THREE.PlaneGeometry(treeW, treeH);

            for (let j = 0; j < 4; j++) {
                const p = new THREE.Mesh(planeGeo, treeMat);
                p.rotation.y = (Math.PI / 4) * j;
                p.position.y = treeH / 2; 
                treeGroup.add(p);
            }

            // 中央のプレイヤーが通る道を少しあける
            let tx = (Math.random() - 0.5) * 1000;
            if (tx > -120 && tx < 120) tx += (tx > 0 ? 150 : -150);

            treeGroup.position.set(tx, 0, -Math.random() * 2000 + 200);
            this.sceneGroup.add(treeGroup);
            this.trees.push(treeGroup);
        }

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
            color: 0x666666,
            roughness: 0.4,
            metalness: 0.5
        });

        this.necks = [];
        this.isActive = true;
        this.timeCounter = 0;
    },

    update: function(delta) {
        if (!this.isActive) return;

        if (window.currentStage !== 6 || (window.stgManager && window.stgManager.stgId !== 'zonbi')) {
            this.dispose();
            return;
        }

        // ★追加修正：両サイドの「変な壁（トレンチ）」を毎フレーム強制的に非表示にする
        if (this.bgManager.trenchGroup) this.bgManager.trenchGroup.visible = false;
        if (this.bgManager.coreGroup) this.bgManager.coreGroup.visible = false;
        if (this.bgManager.ground && this.bgManager.ground !== this.ground) this.bgManager.ground.visible = false;

        this.timeCounter += delta * 0.05;

        if (this.ground && this.ground.material.map) {
            this.ground.material.map.offset.y -= (this.scrollSpeed * 0.002) * delta;
        }

        this.trees.forEach(t => {
            t.position.z += this.scrollSpeed * 2.5 * delta;
            if (t.position.z > 300) {
                t.position.z = -1800;
                let tx = (Math.random() - 0.5) * 1000;
                if (tx > -120 && tx < 120) tx += (tx > 0 ? 150 : -150);
                t.position.x = tx;
            }
        });

        if (window.stgManager && window.stgManager.bossSpawned && window.stgManager.enemies.length > 0) {
            this.updateOrochiNecks(delta);
        } else {
            this.clearNecks();
        }
    },

    updateOrochiNecks: function(delta) {
        this.clearNecks();

        const stg = window.stgManager;
        const heads = stg.enemies.filter(e => e.type === 'orochi_head');

        heads.forEach((h, index) => {
            const canvas = document.getElementById('gameCanvas');
            const dpr = window.devicePixelRatio || 1;
            const sW = canvas.width / dpr;
            const sH = canvas.height / dpr;

            const target3dX = ((h.x / sW) - 0.5) * 350;
            const target3dZ = ((h.y / sH) - 0.5) * 400 - 150;
            const target3dY = 40; 

            const startX = ((index - 3.5) * 40); 
            const startZ = -700;
            const startY = 150; 

            const waveOffset1 = Math.sin(this.timeCounter + index * 4.0) * 40;
            const waveOffset2 = Math.cos(this.timeCounter * 1.5 + index * 2.0) * 30;

            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(startX, startY, startZ),
                new THREE.Vector3(startX + waveOffset1, (startY + target3dY) / 2 + 30, (startZ + target3dZ) / 2),
                new THREE.Vector3(target3dX + waveOffset2, target3dY + 20, target3dZ - 50),
                new THREE.Vector3(target3dX, target3dY, target3dZ)
            ]);

            const tubeGeo = new THREE.TubeGeometry(curve, 20, 6.0, 8, false);
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
            this.bgManager.camera.position.set(0, 60, 0);
            this.bgManager.camera.rotation.x = this.origCamRotX;
            this.bgManager.scene.fog = this.origFog;
        }
        this.isActive = false;
    }
};
