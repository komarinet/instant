const VER_3DBG_MIND = "0.3.4"; // ワームホールが霧に隠れないように修正

window.BGMindManager = {
    isActive: false,
    sceneGroup: null,
    scrollSpeed: 800, 
    toriis: [],
    wormhole: null,
    
    init: function(bgManager) {
        this.bgManager = bgManager;
        if (!bgManager || !bgManager.scene) return;
        
        if (this.isActive) this.dispose();

        this.sceneGroup = new THREE.Group();
        bgManager.scene.add(this.sceneGroup);
        
        this.origCamY = bgManager.camera.position.y;
        this.origCamRotX = bgManager.camera.rotation.x;
        this.origFog = bgManager.scene.fog;

        bgManager.camera.position.y = 15; 
        bgManager.camera.rotation.x = -0.1; 
        
        bgManager.scene.fog = new THREE.FogExp2(0x2a0a2a, 0.001); 
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.sceneGroup.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffccff, 1.5);
        dirLight.position.set(0, 100, 100);
        this.sceneGroup.add(dirLight);

        // ★修正：ワームホールを霧(fog)の影響を受けないようにし、少し手前に配置
        const whCanvas = document.createElement('canvas');
        whCanvas.width = 1024; whCanvas.height = 1024;
        const wCtx = whCanvas.getContext('2d');
        const cx = 512, cy = 512;
        
        const grd = wCtx.createRadialGradient(cx, cy, 50, cx, cy, 512);
        grd.addColorStop(0, 'rgba(200, 0, 255, 1)');
        grd.addColorStop(0.3, 'rgba(100, 0, 200, 0.8)');
        grd.addColorStop(0.8, 'rgba(30, 0, 80, 0.3)');
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        wCtx.fillStyle = grd;
        wCtx.fillRect(0, 0, 1024, 1024);
        
        wCtx.lineWidth = 15;
        wCtx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
            wCtx.beginPath();
            for (let j = 0; j < 60; j++) {
                let r = j * 8.5;
                let theta = i * (Math.PI * 2 / 8) + (j * 0.1);
                let x = cx + r * Math.cos(theta);
                let y = cy + r * Math.sin(theta);
                if (j === 0) wCtx.moveTo(x, y);
                else wCtx.lineTo(x, y);
            }
            wCtx.strokeStyle = `rgba(255, 150, 255, ${0.8 - (i % 2) * 0.3})`;
            wCtx.stroke();
        }
        
        const whTex = new THREE.CanvasTexture(whCanvas);
        whTex.needsUpdate = true;
        // fog: false を追加して奥でもくっきり見えるようにする
        const whMat = new THREE.MeshBasicMaterial({ 
            map: whTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        });
        this.wormhole = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), whMat);
        this.wormhole.position.set(0, 500, -1500); 
        this.sceneGroup.add(this.wormhole);

        let seaTex = null;
        if (window.advManager && window.advManager.assets['sea.webp']) {
            seaTex = new THREE.CanvasTexture(window.advManager.assets['sea.webp']);
            seaTex.needsUpdate = true; 
            seaTex.wrapS = THREE.RepeatWrapping;
            seaTex.wrapT = THREE.RepeatWrapping;
            seaTex.repeat.set(20, 20);
        }
        const seaGeo = new THREE.PlaneGeometry(4000, 4000);
        const seaMat = new THREE.MeshStandardMaterial({ 
            map: seaTex, color: 0xffffff, roughness: 0.2, metalness: 0.8 
        });
        this.sea = new THREE.Mesh(seaGeo, seaMat);
        this.sea.rotation.x = -Math.PI / 2;
        this.sea.position.y = -10; 
        this.sceneGroup.add(this.sea);

        let toriiTex = null;
        if (window.advManager && window.advManager.assets['torii.webp']) {
            toriiTex = new THREE.CanvasTexture(window.advManager.assets['torii.webp']);
            toriiTex.needsUpdate = true;
        }
        const toriiMat = new THREE.MeshStandardMaterial({ map: toriiTex, color: 0xaa0000 });
        
        const createTorii = () => {
            const group = new THREE.Group();
            const pillarGeo = new THREE.CylinderGeometry(3, 3, 80, 16);
            const leftP = new THREE.Mesh(pillarGeo, toriiMat);
            leftP.position.set(-40, 30, 0);
            const rightP = new THREE.Mesh(pillarGeo, toriiMat);
            rightP.position.set(40, 30, 0);
            
            const topGeo = new THREE.BoxGeometry(110, 6, 6);
            const topBar = new THREE.Mesh(topGeo, toriiMat);
            topBar.position.set(0, 67, 0);
            
            const subGeo = new THREE.BoxGeometry(95, 4, 4);
            const subBar = new THREE.Mesh(subGeo, toriiMat);
            subBar.position.set(0, 55, 0);
            
            group.add(leftP); group.add(rightP); group.add(topBar); group.add(subBar);
            return group;
        };

        this.toriis = [];
        for (let i = 0; i < 15; i++) {
            let t = createTorii();
            t.position.z = -i * 200 + 100; 
            this.sceneGroup.add(t);
            this.toriis.push(t);
        }

        this.isActive = true;
    },

    update: function(delta) {
        if (!this.isActive) return;

        if (window.currentStage !== 4 || (window.stgManager && window.stgManager.stgId !== 'mind')) {
            this.dispose();
            return;
        }
        
        if (this.wormhole) {
            this.wormhole.rotation.z -= 0.2 * delta;
        }

        if (this.sea && this.sea.material.map) {
            this.sea.material.map.offset.y -= (this.scrollSpeed / 1500) * delta;
        }

        this.toriis.forEach(t => {
            t.position.z += this.scrollSpeed * delta;
            if (t.position.z > 200) {
                t.position.z -= 200 * 15; 
            }
        });
    },

    dispose: function() {
        if (!this.isActive) return;
        if (this.sceneGroup && this.bgManager) {
            this.bgManager.scene.remove(this.sceneGroup);
            this.bgManager.camera.position.y = this.origCamY;
            this.bgManager.camera.rotation.x = this.origCamRotX;
            this.bgManager.scene.fog = this.origFog;
        }
        this.isActive = false;
    }
};
