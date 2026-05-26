const VER_3DBG = "0.7.5"; // バージョン更新（シナリオデータ側で'stage1' 'stage2'として定義されている本物の stgId 識別子とのマッピングのズレを完全解消。3D背景の描画復旧と2Dステージ時のCPU超軽量スキップを完璧に両立）

class BGManager3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.isActive = false;
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.ground = null;
        this.buildings = [];
        this.clouds = []; 
        this.candles = []; 
        
        this.starField = null;
        this.moon = null;
        this.moonLight = null; 

        this.trenchGroup = null;
        this.trenchFloorLeft = null;  
        this.trenchFloorRight = null; 
        this.trenchLeftWall = null;
        this.trenchRightWall = null;
        this.coreGroup = null;
        this.coreBg = null;
        this.coreReactor = null;
        this.isCoreTransitioning = false; 
        
        this.textures = {
            sideatlas: null,
            topatlas: null,
            ground: null,
            ground2: null, 
            candle: null,
            moon: null,
            trenchFloor: null, 
            trenchWall: null, 
            coreBg: null, 
            coreReactor: null
        };
        this.textureAtlasSize = {
            side: { cols: 3, rows: 2, count: 5 }, 
            top: { cols: 4, rows: 3, count: 12 } 
        };

        this.currentStage = 0;
        this.stageTimer = 0;
        this.lastTime = performance.now();

        this.scrollSpeed = -1.2; 
        this.cloudScrollSpeed = -0.5; 
        this.trenchScrollSpeed = -1.5; 

        // 初期化時にフォールバックへ落ちないよう初期値を設定
        this.stageKey = 'stage1'; 

        window._bgManagerInstance = this; 
    }

    preload(textureConfigs, callback) {
        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);

        textureConfigs.forEach(cfg => {
            loader.load(`img/${cfg.src}`, (texture) => {
                this.textures[cfg.key] = texture;
            }, undefined, (err) => {
                console.error(`[BGManager3D] テクスチャ読み込み失敗: img/${cfg.src}`, err);
            });
        });

        manager.onLoad = () => {
            callback();
        };
        manager.onError = (url) => {
            console.error(`[BGManager3D] プリロード中にエラー発生: ${url}`);
        };
    }

    init() {
        if (!this.canvas) return;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.003);

        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000);
        this.camera.position.set(0, 45, 140); 
        this.camera.lookAt(0, 20, -50); 

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(1); 

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight.position.set(0, 100, 50);
        this.scene.add(dirLight);

        if (window.BG3DObjects) {
            window.BG3DObjects.createGround(this);
            window.BG3DObjects.createBuildings(this);
            window.BG3DObjects.createClouds(this);
            window.BG3DObjects.createCandles(this);
            window.BG3DObjects.createSpace(this);
            window.BG3DObjects.createFinalStage(this);
        }

        this.isActive = true;
        this.lastTime = performance.now();
        
        // 明示的に最初のステージをセット
        this.setStage('stage1');

        this.animate = (timestamp) => {
            this.loop(timestamp);
            if (this.isActive) requestAnimationFrame(this.animate);
        };
        requestAnimationFrame(this.animate);
    }

    transitionToCore() {
        this.isCoreTransitioning = true;
        
        if (this.trenchLeftWall) {
            this.trenchLeftWall.material.transparent = true;
            this.trenchRightWall.material.transparent = true;
            this.trenchFloorLeft.material.transparent = true;
            this.trenchFloorRight.material.transparent = true;
        }

        let startTime = performance.now();
        const fadeDuration = 1000; 

        const fadeLoop = () => {
            let elapsed = performance.now() - startTime;
            let progress = Math.min(1.0, elapsed / fadeDuration);

            if (this.trenchLeftWall) {
                let alpha = 1.0 - progress;
                this.trenchLeftWall.material.opacity = alpha;
                this.trenchRightWall.material.opacity = alpha;
                this.trenchFloorLeft.material.opacity = alpha;
                this.trenchFloorRight.material.opacity = alpha;
            }

            if (progress < 1.0) {
                requestAnimationFrame(fadeLoop);
            } else {
                if (this.trenchGroup) this.trenchGroup.visible = false;
                this.isCoreTransitioning = false; 
                
                if (this.trenchLeftWall) {
                    this.trenchLeftWall.material.opacity = 1.0;
                    this.trenchRightWall.material.opacity = 1.0;
                    this.trenchFloorLeft.material.opacity = 1.0;
                    this.trenchFloorRight.material.opacity = 1.0;
                    this.trenchLeftWall.material.transparent = false;
                    this.trenchRightWall.material.transparent = false;
                    this.trenchFloorLeft.material.transparent = false;
                    this.trenchFloorRight.material.transparent = false;
                }
            }
        };
        requestAnimationFrame(fadeLoop);
    }

    setStage(stageInput) {
        this.isCoreTransitioning = false; 

        let stageKey = 'stage1';

        if (typeof stageInput === 'string') {
            stageKey = stageInput;
            this.currentStage = (stageInput === 'final' || stageInput === 'stage6') ? 6 : 1;
        } else {
            this.currentStage = stageInput;
            let charId = window.selectedCharId || 'igari';
            if (charId === 'shiina') charId = 'mamoru';

            if (typeof characters !== 'undefined') {
                const foundChar = characters.find(c => c.id === charId);
                if (foundChar && foundChar.stages && foundChar.stages[stageInput - 1]) {
                    stageKey = foundChar.stages[stageInput - 1];
                }
            }
        }

        this.stageKey = stageKey;

        // ★修正：シナリオデータ側の表記揺れ（'stage1' や 'stage2'）を元の3Dアセット群へ1対1で完璧にマッピング
        if (stageKey === 'kagami' || stageKey === 'stage1') {
            this.scene.fog.near = 100;
            this.scene.fog.far = 500;
            this.scene.fog.color.setHex(0x0a0a14);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = true;
            if (this.textures.ground) {
                this.ground.material.map = this.textures.ground;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = true);
            this.clouds.forEach(c => c.visible = true);
            this.candles.forEach(c => c.visible = false);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;

        } else if (stageKey === 'hiragi' || stageKey === 'stage2') {
            this.scene.fog.near = 30;
            this.scene.fog.far = 250;
            this.scene.fog.color.setHex(0x020205);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = true;
            if (this.textures.ground2) {
                this.ground.material.map = this.textures.ground2;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = false);
            this.clouds.forEach(c => c.visible = false);
            this.candles.forEach(c => c.visible = true);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;

        } else if (stageKey === 'shiina' || stageKey === 'stage3') {
            this.scene.fog.near = 80;
            this.scene.fog.far = 400;
            this.scene.fog.color.setHex(0x0a0f1d);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = true;
            if (this.textures.ground) {
                this.ground.material.map = this.textures.ground;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = false);
            this.clouds.forEach(c => c.visible = true); 
            this.candles.forEach(c => c.visible = false);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;

        } else if (stageKey === 'jingu' || stageKey === 'stage4') {
            this.scene.fog.near = 50;
            this.scene.fog.far = 300;
            this.scene.fog.color.setHex(0x111c24);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = true;
            if (this.textures.ground2) {
                this.ground.material.map = this.textures.ground2;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = false);
            this.clouds.forEach(c => c.visible = true);
            this.candles.forEach(c => c.visible = false);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;

        } else if (stageKey === 'godai' || stageKey === 'stage5') {
            this.scene.fog.near = 2000;
            this.scene.fog.far = 8000;
            this.scene.fog.color.setHex(0x000002);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = false; 
            this.buildings.forEach(b => b.visible = false);
            this.clouds.forEach(c => c.visible = false);
            this.candles.forEach(c => c.visible = false);
            
            if (this.starField) this.starField.visible = true;
            
            if (this.moon) {
                this.moon.visible = true;
                this.moon.position.set(0, -3200, -1800); 
                this.moon.scale.set(1, 1, 1); 
                this.moon.rotation.set(0, 0, 0); 
            }
            if (this.moonLight) this.moonLight.visible = true;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;

        } else if (stageKey === 'final' || stageKey === 'stage6') {
            this.scene.fog.near = 100;
            this.scene.fog.far = 1200;
            this.scene.fog.color.setHex(0x030101); 
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = false;
            this.buildings.forEach(b => b.visible = false);
            this.clouds.forEach(c => c.visible = false);
            this.candles.forEach(c => c.visible = false);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            
            if (this.trenchGroup) {
                this.trenchGroup.visible = true;
                this.trenchLeftWall.position.x = -90 * this.camera.aspect;
                this.trenchRightWall.position.x = 90 * this.camera.aspect;
                this.trenchFloorLeft.position.x = -500;
                this.trenchFloorRight.position.x = 500;
            }
            
            if (this.coreGroup) {
                this.coreGroup.visible = true;
                this.coreLeftWall.position.x = -140 * this.camera.aspect;
                this.coreRightWall.position.x = 140 * this.camera.aspect;
                if (this.coreReactor) {
                    this.coreReactor.position.set(0, -80, -400); 
                    this.coreReactor.material.opacity = 1.0;
                }
            }

        } else {
            // --- 純粋な2D背景専用ステージ（eijiなど）における安全なフォールバック ---
            this.scene.fog.near = 10000;
            this.scene.fog.far = 10000; 
            this.scene.fog.color.setHex(0x000000);
            this.renderer.setClearColor(0x000000, 1.0); 

            if (this.ground) this.ground.visible = false;
            if (this.buildings) this.buildings.forEach(b => b.visible = false);
            if (this.clouds) this.clouds.forEach(c => c.visible = false);
            if (this.candles) this.candles.forEach(c => c.visible = false);
            if (this.starField) this.starField.visible = false;
            if (this.moon) this.moon.visible = false;
            if (this.moonLight) this.moonLight.visible = false;
            if (this.trenchGroup) this.trenchGroup.visible = false;
            if (this.coreGroup) this.coreGroup.visible = false;
        }
    }

    loop(timestamp) {
        if (!this.isActive) return;

        // ゲームコアから現在の本物の stgId を最優先でキャッチして上書き強制同期
        if (window.stgManager && window.stgManager.stgId) {
            if (this.stageKey !== window.stgManager.stgId) {
                this.setStage(window.stgManager.stgId);
            }
        } else if (typeof currentStage !== 'undefined' && this.currentStage !== currentStage) {
            this.setStage(currentStage);
        }

        // 識別キーが完全に確定した段階で、2D専用（eijiなど）ならレンダリングを完璧にスキップ
        if (this.stageKey === 'eiji') {
            return;
        }

        if (!timestamp) timestamp = performance.now();
        let delta = (timestamp - this.lastTime) / (1000 / 60); 
        this.lastTime = timestamp;

        if (delta > 3.0) delta = 3.0; 

        if (window.BG3DObjects) {
            window.BG3DObjects.updateAnimations(this, delta);
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}
