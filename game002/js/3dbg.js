const VER_3DBG = "0.6.0"; // バージョン更新（床が割れる演出に合わせてコアを初期から背面に配置）

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
        this.trenchFloorLeft = null;  // ★修正：床を左右分割に対応
        this.trenchFloorRight = null; // ★修正：床を左右分割に対応
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

        this.scrollSpeed = 0.5; 
        this.cloudScrollSpeed = 1.0; 
        this.trenchScrollSpeed = 2.5; 
        this.isLoaded = false;
        
        this.currentStage = 1;
        this.flameMaterial = null; 

        if (!window._bgManagerInstance) {
            window._bgManagerInstance = this;
            const origFillText = CanvasRenderingContext2D.prototype.fillText;
            CanvasRenderingContext2D.prototype.fillText = function(text, x, y, mw) {
                if (typeof text === 'string' && text.includes('STAGE') && text.includes('START')) {
                    const m = text.match(/STAGE\s+(\d+)/);
                    if (m && window._bgManagerInstance) {
                        const stageNum = parseInt(m[1], 10);
                        if (window._bgManagerInstance.currentStage !== stageNum) {
                            window._bgManagerInstance.setStage(stageNum);
                        }
                    }
                }
                if (mw !== undefined) return origFillText.call(this, text, x, y, mw);
                return origFillText.call(this, text, x, y);
            };
        } else {
            window._bgManagerInstance = this; 
        }
    }

    preload(images, callback) {
        if (!images || images.length === 0) {
            this.isLoaded = true;
            callback();
            return;
        }

        let loaded = 0;
        const total = images.length;
        const textureLoader = new THREE.TextureLoader();

        const checkComplete = () => {
            loaded++;
            if (loaded >= total) {
                this.isLoaded = true;
                callback();
            }
        };

        images.forEach(imgData => {
            const key = imgData.key;
            const src = `img/${imgData.src}`;
            textureLoader.load(
                src, 
                (texture) => {
                    this.textures[key] = texture;
                    checkComplete();
                }, 
                undefined, 
                (err) => {
                    console.error(`Failed to load texture: ${src}`, err);
                    checkComplete(); 
                }
            );
        });
    }

    init() {
        if (!this.canvas || typeof THREE === 'undefined') return;
        if (!this.isLoaded) return;
        
        const dpr = window.devicePixelRatio || 1;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false, 
            alpha: true 
        });
        this.renderer.setPixelRatio(dpr);
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(width, height, false);
        this.renderer.setClearColor(0x000000, 0); 

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0a14, 50, 300); 

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 8000);
        this.camera.position.set(0, 60, 0); 
        this.camera.rotation.x = -Math.PI / 2.5; 

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 50, -20); 
        directionalLight.castShadow = false; 
        this.scene.add(directionalLight);

        this.renderer.shadowMap.enabled = false; 

        if (window.BG3DObjects) {
            window.BG3DObjects.createGround(this);
            window.BG3DObjects.createBuildings(this);
            window.BG3DObjects.createClouds(this);
            window.BG3DObjects.createCandles(this);
            window.BG3DObjects.createSpace(this);
            window.BG3DObjects.createFinalStage(this);
        }

        this.isActive = true;
        this.loop(); 
    }

    transitionToCore() {
        this.isCoreTransitioning = true;
    }

    setStage(stageNum) {
        this.currentStage = stageNum;
        if (!this.ground || !this.ground.material) return;
        
        this.ground.visible = false;
        this.buildings.forEach(b => b.visible = false);
        this.candles.forEach(c => c.visible = false);
        this.clouds.forEach(c => c.visible = false);
        if (this.starField) this.starField.visible = false;
        if (this.moon) this.moon.visible = false;
        if (this.moonLight) this.moonLight.visible = false;
        if (this.trenchGroup) this.trenchGroup.visible = false;
        if (this.coreGroup) this.coreGroup.visible = false;
        this.isCoreTransitioning = false;
        
        // ★PCの横長画面では1.0、スマホの縦長画面では0.5などの比率になる係数
        const aspectFactor = Math.min(1, this.camera.aspect);

        if (stageNum === 6) { 
            this.scene.fog.near = 100;
            this.scene.fog.far = 1200; 
            this.scene.fog.color.setHex(0x050505); 
            this.renderer.setClearColor(0x000000, 1); 
            
            if (this.trenchGroup) {
                this.trenchGroup.visible = true;
                const edgeX = 90 * this.camera.aspect; // ★修正：40から90へ広げました
                this.trenchLeftWall.position.x = -edgeX;
                this.trenchRightWall.position.x = edgeX;
                // ★追加：床の隙間を閉じておく（リセット）
                if (this.trenchFloorLeft) {
                    this.trenchFloorLeft.position.x = -500;
                    this.trenchFloorRight.position.x = 500;
                }
            }
            if (this.coreGroup) {
                this.coreGroup.visible = true; // ★修正：床の奥に常に表示しておく
                this.coreGroup.position.y = 0; // ★修正：-1500から0へ
                
                // ★追加：ボスのコア球体もスマホ幅に合わせて縮小
                if (this.coreReactor) {
                    this.coreReactor.scale.set(aspectFactor, aspectFactor, aspectFactor);
                }
            }
        } 
        else if (stageNum === 5) {
            this.scene.fog.near = 9999999;
            this.scene.fog.far = 10000000; 
            this.renderer.setClearColor(0x000000, 1); 
            
            if (this.starField) {
                this.starField.visible = true;
                this.starField.position.set(0, -2500, -800);
            }
            if (this.moon) {
                this.moon.visible = true;
                this.moon.position.set(0, -4500, -1200); 
                // ★追加：月の初期サイズもスマホ幅にフィットさせる
                this.moon.scale.set(0.6 * aspectFactor, 0.6 * aspectFactor, 0.6 * aspectFactor); 
            }
            if (this.moonLight) this.moonLight.visible = true;
        } else if (stageNum === 2) {
            this.scene.fog.near = 50;
            this.scene.fog.far = 300; 
            this.scene.fog.color.setHex(0x0a0a14);
            this.renderer.setClearColor(0x000000, 0);

            this.ground.visible = true;
            if (this.textures.ground2) {
                this.ground.material.map = this.textures.ground2;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, -10); 
                this.ground.material.needsUpdate = true;
            }
            this.candles.forEach(c => c.visible = true);
            this.clouds.forEach(c => c.visible = true);
            
        } else {
            this.scene.fog.near = 50;
            this.scene.fog.far = 300; 
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
        }
    }

    loop() {
        if (!this.isActive) return;

        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        if (window.BG3DObjects) {
            window.BG3DObjects.updateAnimations(this);
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.loop());
    }
}
