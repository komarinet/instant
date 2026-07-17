const VER_3DBG_ZONBI = "0.1.3"; // 木のまばら配置、スクロールの上下逆転(引き撃ち表現)、首の表示と背景の溝修正

window.BGZonbiManager = {
    isActive: false,
    sceneGroup: null,
    scrollSpeed: 600, 
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

        bgManager.camera.position.set(0, 180, 250); 
        bgManager.camera.rotation.x = -Math.PI / 3.5; 

        bgManager.scene.fog = new THREE.FogExp2(0x0a140a, 0.002);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        this.sceneGroup.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xaaffaa, 1.2); 
        dirLight.position.set(0, 200, 100);
        this.sceneGroup.add(dirLight);

        // ★修正：溝をなくすため、通常のリピートとフィルタで滑らかにつなぐ
        let tsutiTex = null;
        if (window.advManager && window.advManager.assets['tsuti.webp']) {
            tsutiTex = new THREE.CanvasTexture(window.advManager.assets['tsuti.webp']);
            tsutiTex.needsUpdate = true;
            tsutiTex.wrapS = THREE.RepeatWrapping;
            tsutiTex.wrapT = THREE.RepeatWrapping;
            tsutiTex.minFilter = THREE.LinearFilter;
            tsutiTex.magFilter = THREE.LinearFilter;
            tsutiTex.repeat.set(4, 4);
        }
        const groundGeo = new THREE.PlaneGeometry(4000, 4000);
        const groundMat = new THREE.MeshStandardMaterial({
            map: tsutiTex,
            roughness: 0.9,
            metalness: 0.1
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.set(0, 2, -800);
        this.sceneGroup.add(this.ground);

        let treeTex = null;
        if (window.advManager && window.advManager.assets['tree.webp']) {
            treeTex = new THREE.CanvasTexture(window.advManager.assets['tree.webp']);
            treeTex.needsUpdate = true;
        }
        const treeMat = new THREE.MeshBasicMaterial({
            map: treeTex,
            transparent: true,
            alphaTest: 0.5, 
            side: THREE.DoubleSide
        });

        this.trees = [];
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

            // ★修正：よけずにフィールド全体にまばらに配置する
            let tx = (Math.random() - 0.5) * 1000;
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
        
        // ★修正：確実に明るく描画されるようにLambertに変更し、白く照らす
        this.neckMat = new THREE.MeshLambertMaterial({
            map: this.uroTex,
            color: 0xffffff
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

        if (this.bgManager.trenchGroup) this.bgManager.trenchGroup.visible = false;
        if (this.bgManager.coreGroup) this.bgManager.coreGroup.visible = false;
        if (this.bgManager.ground && this.bgManager.ground !== this.ground) this.bgManager.ground.visible = false;

        this.timeCounter += delta * 0.05;

        // ★修正：自機が逃げる（後退する）表現のため、スクロール方向を下から上へ（手前から奥へ）加算する
        if (this.ground && this.ground.material.map) {
            this.ground.material.map.offset.y += (this.scrollSpeed / 1000) * delta;
        }

        // ★修正：木も手前から奥へスクロールして消えていくようにする
        this.trees.forEach(t => {
            t.position.z -= this.scrollSpeed * delta; 
            if (t.position.z < -2000) { // 奥に消えたら手前に再配置
                t.position.z += 2300;
                t.position.x = (Math.random() - 0.5) * 1000; // まばらに再配置
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

            // ★修正：画面にハッキリと太く映るようにZ座標とY座標を手前に調整
            const target3dX = ((h.x / sW) - 0.5) * 400;
            const target3dZ = ((h.y / sH) - 0.5) * 200 + 50; 
            const target3dY = 20; 

            const startX = ((index - 3.5) * 60); 
            const startZ = -300; 
            const startY = 100; 

            const waveOffset1 = Math.sin(this.timeCounter * 2.0 + index * 4.0) * 80;
            const waveOffset2 = Math.cos(this.timeCounter * 2.5 + index * 2.0) * 60;

            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(startX, startY, startZ),
                new THREE.Vector3(startX + waveOffset1, (startY + target3dY) / 2 + 30, (startZ + target3dZ) / 2),
                new THREE.Vector3(target3dX + waveOffset2, target3dY + 20, target3dZ - 50),
                new THREE.Vector3(target3dX, target3dY, target3dZ)
            ]);

            // ★修正：首をさらに太く(radius: 15.0)して迫力を出す
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 15.0, 8, false);
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
