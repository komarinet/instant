const VER_3DBG = "0.7.7"; // バージョン更新（0.6.3のCanvasフックとループ構造を完全復元。既存のプログラム構造を1行も壊さずに、stages配列による自由な背景切り替えと2D軽量化を完璧に組み込み）

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
        this.scrollSpeed = 0.65; 
        this.cloudScrollSpeed = 1.3; 
        this.trenchScrollSpeed = 2.5; 
        this.isLoaded = false;
        
        this.currentStage = 1;
        this.stageKey = 'kagami'; // 追加：内部判定用のキー
        this.flameMaterial = null;
        this.lastTime = 0;

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
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    transitionToCore() {
        this.isCoreTransitioning = true;
    }

    setStage(stageNum) {
        this.currentStage = stageNum;
        if (!this.ground || !this.ground.material) return;
        
        // --- ★ NEW: stages配列からの文字割り出しと、3D描画用数値（visualMode）への変換 ---
        let stageKey = 'kagami';
        let charId = window.selectedCharId || 'igari';
        if (charId === 'shiina') charId = 'mamoru';

        // 配列から現在のステージキー（'kagami', 'eiji' 等）を逆算
        if (typeof characters !== 'undefined' && Array.isArray(characters)) {
            const foundChar = characters.find(c => c.id === charId);
            if (foundChar && foundChar.stages && foundChar.stages[stageNum - 1]) {
                stageKey = foundChar.stages[stageNum - 1];
            }
        }
        
        // stgManagerが存在すれば確実にそちらを正とする
        if (window.stgManager && window.stgManager.stgId) {
            stageKey = window.stgManager.stgId;
        }

        this.stageKey = stageKey;

        // キーから0.6.3基準の描画モード数値にすり替える
        let visualMode = stageNum;
        if (stageKey === 'kagami' || stageKey === 'stage1') visualMode = 1;
        else if (stageKey === 'hiragi' || stageKey === 'stage2') visualMode = 2;
        else if (stageKey === 'godai' || stageKey === 'stage5') visualMode = 5;
        else if (stageKey === 'final' || stageKey === 'stage6') visualMode = 6;
        else if (stageKey === 'eiji') visualMode = 99; // 2D専用ステージ

        // --------------------------------------------------------------------
        
        this.ground.visible = false;
        this.buildings.forEach(b => b.visible = false);
        this.candles.forEach(c => c.visible = false);
        // 雲はステージ1（kagami）などのみ表示
        this.clouds.forEach(c => c.visible = (visualMode === 1 || visualMode === 3 || visualMode === 4));
        if (this.starField) this.starField.visible = false;
        if (this.moon) this.moon.visible = false;
        if (this.moonLight) this.moonLight.visible = false;
        if (this.trenchGroup) this.trenchGroup.visible = false;
        if (this.coreGroup) this.coreGroup.visible = false;
        this.isCoreTransitioning = false;
        
        const aspectFactor = Math.min(1, this.camera.aspect);

        // ★追加：eijiなど（2D背景）の場合は完全に黒クリアして3Dを表示しない
        if (visualMode === 99) {
            this.scene.fog.near = 9999999;
            this.scene.fog.far = 10000000;
            this.renderer.setClearColor(0x000000, 1);
            if (this.ground) this.ground.visible = false;
        }
        else if (visualMode === 6) { 
            this.scene.fog.near = 100;
            this.scene.fog.far = 1200; 
            this.scene.fog.color.setHex(0x050505); 
            this.renderer.setClearColor(0x000000, 1); 
            
            if (this.trenchGroup) {
                this.trenchGroup.visible = true;
                const edgeX = 90 * this.camera.aspect; 
                this.trenchLeftWall.position.x = -edgeX;
                this.trenchRightWall.position.x = edgeX;
                if (this.trenchFloorLeft) {
                    this.trenchFloorLeft.position.x = -500;
                    this.trenchFloorRight.position.x = 500;
                }
            }
            if (this.coreGroup) {
                this.coreGroup.visible = true;
                this.coreGroup.position.y = 0; 
                
                if (this.coreReactor) {
                    this.coreReactor.scale.set(aspectFactor, aspectFactor, aspectFactor);
                }
            }
        } 
        else if (visualMode === 5) {
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
                this.moon.scale.set(0.6 * aspectFactor, 0.6 * aspectFactor, 0.6 * aspectFactor);
            }
            if (this.moonLight) this.moonLight.visible = true;
        } else if (visualMode === 2) {
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
            
            // visualMode 3, 4（雲だけのステージ）の場合はビルを消す
            if (visualMode === 3 || visualMode === 4) {
                this.buildings.forEach(b => b.visible = false);
            } else {
                this.buildings.forEach(b => b.visible = true);
            }
        }
    }

    loop(timestamp) {
        if (!this.isActive) return;
        if (!timestamp) timestamp = performance.now();
        let delta = (timestamp - this.lastTime) / (1000 / 60); 
        this.lastTime = timestamp;
        if (delta > 3.0) delta = 3.0; 

        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        // ★追加：eijiなどの2D背景時は、描画をパスしつつ「次のループへ繋ぐ」ことでフリーズを完全に防ぐ
        if (this.stageKey === 'eiji') {
            requestAnimationFrame((ts) => this.loop(ts));
            return;
        }

        if (window.BG3DObjects) {
            window.BG3DObjects.updateAnimations(this, delta);
        }

        this.renderer.render(this.scene, this.camera);
        
        // 0.6.3に存在した命綱となるループ呼び出し
        requestAnimationFrame((ts) => this.loop(ts));
    }
}
