const VER_3DBG = "0.7.7"; // バージョン更新（main.js側の数値制御との完全な互換性を復旧し、配列枠からグラフィック識別子を安全に逆算して表示バグを根底から完全解消。2D時のCPUスキップも完全両立）

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

        // 起動時の安全を確保するための初期化キー
        this.stageKey = 'kagami'; 

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
        
        // 数値の 1 で確実に初期背景を起動
        this.setStage(1);

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

    // ★修正：確実な数値（1〜6）、および送られてくる可能性のある文字列（"Stage1", "stage1"など）のすべてを完璧に受け止めて数値に統合する頑強なインターフェース
    setStage(stageInput) {
        this.isCoreTransitioning = false; 

        let stageNum = 1;

        if (typeof stageInput === 'number') {
            stageNum = stageInput;
        } else if (typeof stageInput === 'string') {
            // "Stage1" や "stage1" や "1" などの文字列から数値を確実に抽出する
            const matched = stageInput.match(/\d+/);
            if (matched) {
                stageNum = Number(matched[0]);
            } else if (stageInput === 'final') {
                stageNum = 6;
            }
        } else if (stageInput && typeof stageInput === 'object') {
            if (stageInput.currentStage) stageNum = Number(stageInput.currentStage);
        }

        this.currentStage = stageNum;

        // 割り出した現在の正確な数値（1〜6）から、選択中キャラの固有ステージ文字列（'kagami', 'eiji'など）を逆算取得
        let stageKey = 'kagami';
        let charId = window.selectedCharId || 'igari';
        if (charId === 'shiina') charId = 'mamoru';

        if (typeof characters !== 'undefined' && Array.isArray(characters)) {
            const foundChar = characters.find(c => c.id === charId);
            if (foundChar && foundChar.stages && foundChar.stages[stageNum - 1]) {
                stageKey = foundChar.stages[stageNum - 1];
            }
        }

        this.stageKey = stageKey;

        // ★完全復活：判定を stageKey の文字列に一本化し、既存の3Dアセットの表示フラグを元の完璧な状態へ復帰！
        if (stageKey === 'kagami') {
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

        } else if (stageKey === 'hiragi') {
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

        } else if (stageKey === 'shiina') {
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

        } else if (stageKey === 'jingu') {
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

        } else if (stageKey === 'godai') {
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

        } else if (stageKey === 'final') {
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

        // main.jsから常時流れてくる window.currentStage (数値の1〜6) を最優先で監視して完全同期
        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        // 2D画像背景専用ステージ（eijiなど）の場合のみ、裏側の3Dレンダリングと計算を完全にパス
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
