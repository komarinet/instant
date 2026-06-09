const VER_3DBG_MIND = "0.1.0"; // 新設：精神世界専用の3D背景マネージャー

window.BGMindManager = {
    isActive: false,
    sceneGroup: null,
    scrollSpeed: 400, // 鳥居が迫ってくる速度
    toriis: [],
    
    init: function(bgManager) {
        this.bgManager = bgManager;
        if (!bgManager || !bgManager.scene) return;

        this.sceneGroup = new THREE.Group();
        bgManager.scene.add(this.sceneGroup);
        
        // 精神世界っぽい赤黒い霧に変更
        this.origFog = bgManager.scene.fog;
        bgManager.scene.fog = new THREE.FogExp2(0x1a0505, 0.002);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.sceneGroup.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffaaaa, 1.0);
        dirLight.position.set(0, 100, 100);
        this.sceneGroup.add(dirLight);

        // 海の作成 (sea.webp)
        let seaTex = null;
        if (window.advManager && window.advManager.assets['sea.webp']) {
            seaTex = new THREE.CanvasTexture(window.advManager.assets['sea.webp']);
            seaTex.wrapS = THREE.RepeatWrapping;
            seaTex.wrapT = THREE.RepeatWrapping;
            seaTex.repeat.set(10, 10);
        }
        const seaGeo = new THREE.PlaneGeometry(3000, 3000);
        const seaMat = new THREE.MeshStandardMaterial({ 
            map: seaTex, color: 0x330000, roughness: 0.1, metalness: 0.5 
        });
        this.sea = new THREE.Mesh(seaGeo, seaMat);
        this.sea.rotation.x = -Math.PI / 2;
        this.sea.position.y = -30;
        this.sceneGroup.add(this.sea);

        // 鳥居の作成 (torii.webp)
        let toriiTex = null;
        if (window.advManager && window.advManager.assets['torii.webp']) {
            toriiTex = new THREE.CanvasTexture(window.advManager.assets['torii.webp']);
        }
        const toriiMat = new THREE.MeshStandardMaterial({ map: toriiTex, color: 0xaa0000 });
        
        const createTorii = () => {
            const group = new THREE.Group();
            const pillarGeo = new THREE.CylinderGeometry(4, 4, 100, 16);
            const leftP = new THREE.Mesh(pillarGeo, toriiMat);
            leftP.position.set(-60, 20, 0);
            const rightP = new THREE.Mesh(pillarGeo, toriiMat);
            rightP.position.set(60, 20, 0);
            
            const topGeo = new THREE.BoxGeometry(160, 8, 8);
            const topBar = new THREE.Mesh(topGeo, toriiMat);
            topBar.position.set(0, 65, 0);
            
            const subGeo = new THREE.BoxGeometry(140, 6, 6);
            const subBar = new THREE.Mesh(subGeo, toriiMat);
            subBar.position.set(0, 50, 0);
            
            group.add(leftP); group.add(rightP); group.add(topBar); group.add(subBar);
            return group;
        };

        // 鳥居を等間隔で奥へズラッと並べる
        for (let i = 0; i < 20; i++) {
            let t = createTorii();
            t.position.z = -i * 150 + 100; 
            this.sceneGroup.add(t);
            this.toriis.push(t);
        }

        this.isActive = true;
    },

    update: function(delta) {
        if (!this.isActive) return;
        
        if (this.sea && this.sea.material.map) {
            this.sea.material.map.offset.y -= (this.scrollSpeed / 1000) * delta;
        }

        this.toriis.forEach(t => {
            t.position.z += this.scrollSpeed * delta;
            // 手前を通り過ぎたら一番奥へループさせる
            if (t.position.z > 200) {
                t.position.z -= 150 * 20; 
            }
        });
    },

    dispose: function() {
        if (this.sceneGroup && this.bgManager) {
            this.bgManager.scene.remove(this.sceneGroup);
            this.bgManager.scene.fog = this.origFog;
        }
        this.isActive = false;
    }
};
