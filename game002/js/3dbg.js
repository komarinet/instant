const VER_3DBG = "0.4.2"; // バージョン更新（スクロール方向の修正、スマホ画面に合わせた壁位置の調整）

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
        
        // ステージ5用の背景オブジェクト
        this.starField = null;
        this.moon = null;
        this.moonLight = null; 

        // ★ステージ6（最終面）用の背景オブジェクトを追加
        this.trenchGroup = null;
        this.trenchFloor = null;
        this.trenchLeftWall = null;
        this.trenchRightWall = null;
        this.coreGroup = null;
        this.coreBg = null;
        this.coreReactor = null;
        this.isCoreTransitioning = false; // 壁が開くフラグ
        
        this.textures = {
            sideatlas: null,
            topatlas: null,
            ground: null,
            ground2: null, 
            candle: null,
            moon: null,
            // ★最終ステージ用テクスチャを追加
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
        this.trenchScrollSpeed = 2.5; // ★トレンチ疾走用のハイスピード
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

        this.createGround();
        this.createBuildings(); 
        this.createClouds();   
        this.createCandles();  
        
        this.createSpace();
        
        // ★新規追加：最終ステージの空間を生成
        this.createFinalStage(); 

        this.isActive = true;
        this.loop(); 
    }

    // ★STGロジックから呼ばれるコア突入メソッド
    transitionToCore() {
        this.isCoreTransitioning = true;
    }

    setStage(stageNum) {
        this.currentStage = stageNum;
        if (!this.ground || !this.ground.material) return;
        
        // ★表示状態を一旦すべてリセット
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
        
        if (stageNum === 6) { 
            // ★ステージ6（最終面）の表示設定
            this.scene.fog.near = 100;
            this.scene.fog.far = 1200; // 奥のほうを暗闇に溶け込ませる
            this.scene.fog.color.setHex(0x050505); // 暗いグレー
            this.renderer.setClearColor(0x000000, 1); 
            
            if (this.trenchGroup) {
                this.trenchGroup.visible = true;
                // ★修正：壁の位置をスマホ画面にフィットさせる（-200, 200 から -60, 60 へ）
                this.trenchLeftWall.position.x = -60;
                this.trenchRightWall.position.x = 60;
            }
            if (this.coreGroup) {
                this.coreGroup.visible = false; // 最初は見えない
                this.coreGroup.position.y = -1500; // 画面奥下部に隠しておく
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
                this.moon.scale.set(0.6, 0.6, 0.6); 
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

    createGround() {
        const groundTexture = this.textures.ground;
        let material;

        if (groundTexture) {
            groundTexture.wrapS = THREE.MirroredRepeatWrapping; 
            groundTexture.wrapT = THREE.MirroredRepeatWrapping; 
            groundTexture.repeat.set(4, 10);
            material = new THREE.MeshPhongMaterial({ map: groundTexture, shininess: 0 });
        } else {
            material = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 0 });
        }
        
        const geometry = new THREE.PlaneGeometry(300, 400); 
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2; 
        this.ground.position.y = 0; 
        this.scene.add(this.ground);
    }

    createBuildings() {
        const numBuildings = 60; 
        const baseGeo = new THREE.BoxGeometry(1, 1, 1);
        const sideMaterials = [];
        const topMaterials = [];

        if (this.textures.sideatlas) {
            for (let i = 0; i < 5; i++) {
                const tex = this.textures.sideatlas.clone();
                tex.needsUpdate = true;
                tex.repeat.set(1/3, 1/2); 
                tex.offset.set((i % 3) * (1/3), 1 - (Math.floor(i / 3) + 1) * (1/2));
                sideMaterials.push(new THREE.MeshPhongMaterial({ map: tex }));
            }
        } else {
            sideMaterials.push(new THREE.MeshPhongMaterial({ color: 0x333333 }));
        }

        if (this.textures.topatlas) {
            for (let i = 0; i < 12; i++) {
                const tex = this.textures.topatlas.clone();
                tex.needsUpdate = true;
                tex.repeat.set(1/4, 1/3);
                tex.offset.set((i % 4) * (1/4), 1 - (Math.floor(i / 4) + 1) * (1/3));
                topMaterials.push(new THREE.MeshPhongMaterial({ map: tex }));
            }
        } else {
            topMaterials.push(new THREE.MeshPhongMaterial({ color: 0x555555 }));
        }

        for (let i = 0; i < numBuildings; i++) {
            const w = Math.random() * 15 + 10;
            const d = Math.random() * 15 + 10;
            const h = Math.random() * 40 + 20;

            const sMat = sideMaterials[Math.floor(Math.random() * sideMaterials.length)];
            const tMat = topMaterials[Math.floor(Math.random() * topMaterials.length)];
            const materials = [sMat, sMat, tMat, sMat, sMat, sMat];
            
            const mesh = new THREE.Mesh(baseGeo, materials);
            mesh.scale.set(w, h, d);
            mesh.position.x = (Math.random() - 0.5) * 200;
            mesh.position.z = (Math.random() - 0.5) * 400 - 50; 
            mesh.position.y = h / 2; 

            this.scene.add(mesh);
            this.buildings.push(mesh);
        }
    }

    createClouds() {
        const numClouds = 20;
        const cloudGeo = new THREE.PlaneGeometry(40, 40);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0x111115,
            transparent: true,
            opacity: 0.4,
            depthWrite: false 
        });

        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.x = (Math.random() - 0.5) * 200;
            cloud.position.y = Math.random() * 20 + 60; 
            cloud.position.z = (Math.random() - 0.5) * 300;
            cloud.rotation.x = -Math.PI / 2; 
            cloud.rotation.z = Math.random() * Math.PI * 2;
            
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    createCandles() {
        const numCandles = 2000; 

        this.flameMaterial = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0.0 } },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
                void main() {
                    vec2 p = vUv * 2.0 - 1.0; 
                    float offset = rand(vWorldPosition.xz);
                    float t = uTime * 4.0 + offset * 10.0;
                    
                    p.x += sin(t + p.y * 3.0) * 0.15 * max(0.0, p.y + 0.5);
                    
                    float d = length(vec2(p.x * (1.5 - p.y), p.y + 0.3));
                    float alpha = smoothstep(0.9, 0.1, d);
                    
                    vec3 col = mix(vec3(0.0, 0.3, 0.8), vec3(1.0, 0.3, 0.0), smoothstep(-0.8, -0.3, p.y));
                    col = mix(col, vec3(1.0, 0.8, 0.1), smoothstep(-0.3, 0.5, p.y));
                    
                    float core = smoothstep(0.3, 0.0, d);
                    col = mix(col, vec3(1.0, 1.0, 1.0), core);
                    
                    float flicker = 0.85 + 0.15 * sin(t * 3.0 + offset * 20.0);
                    
                    gl_FragColor = vec4(col * flicker, alpha * flicker);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });

        const baseBodyGeo = new THREE.CylinderGeometry(0.8, 1, 1, 8); 
        const baseWickGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
        const baseFlameGeo = new THREE.PlaneGeometry(1, 1.5);

        const sideMat = this.textures.candle 
            ? new THREE.MeshPhongMaterial({ map: this.textures.candle, emissive: 0x331100 }) 
            : new THREE.MeshPhongMaterial({ color: 0xddccaa, emissive: 0x442211, shininess: 30 });
        const topMat = new THREE.MeshPhongMaterial({ color: 0xffeedd, emissive: 0xaa5522, shininess: 50 }); 
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 }); 

        const r = 0.8;  
        const h = 8;    
        const flameSize = r * 4.0; 

        for (let i = 0; i < numCandles; i++) {
            const candleGroup = new THREE.Group();

            const bodyMesh = new THREE.Mesh(baseBodyGeo, [sideMat, topMat, sideMat]); 
            bodyMesh.scale.set(r, h, r);
            bodyMesh.position.y = h / 2; 
            candleGroup.add(bodyMesh);

            const wickMesh = new THREE.Mesh(baseWickGeo, wickMat);
            wickMesh.scale.set(1, 1, 1);
            wickMesh.position.y = h + 1; 
            candleGroup.add(wickMesh);

            const flameMesh = new THREE.Mesh(baseFlameGeo, this.flameMaterial);
            flameMesh.scale.set(flameSize, flameSize, 1);
            flameMesh.position.y = h + 1 + flameSize * 0.4; 
            candleGroup.add(flameMesh);

            candleGroup.position.x = (Math.random() - 0.5) * 400; 
            candleGroup.position.y = 0; 
            candleGroup.position.z = (Math.random() - 0.5) * 800 - 100; 

            candleGroup.visible = false; 

            this.scene.add(candleGroup);
            this.candles.push(candleGroup);
        }
    }

    createSpace() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const posArray = new Float32Array(starCount * 3);
        for(let i = 0; i < starCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 6000;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const starMat = new THREE.PointsMaterial({ 
            size: 4, 
            color: 0xffffff, 
            transparent: true, 
            opacity: 1.0, 
            depthWrite: false
        });
        this.starField = new THREE.Points(starGeo, starMat);
        this.starField.visible = false;
        this.scene.add(this.starField);

        const moonGeo = new THREE.SphereGeometry(400, 64, 64);
        const moonMat = new THREE.MeshStandardMaterial({ 
            map: this.textures.moon || null, 
            roughness: 0.8, 
            metalness: 0.1,
            emissive: 0x666666 
        });
        this.moon = new THREE.Mesh(moonGeo, moonMat);
        this.moon.visible = false;
        this.scene.add(this.moon);

        this.moonLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.moonLight.position.set(200, 200, 200); 
        this.moonLight.visible = false;
        this.scene.add(this.moonLight);
    }

    // ★新規追加：ステージ6（最終面）の空間構築
    createFinalStage() {
        this.trenchGroup = new THREE.Group();
        
        // 1. トレンチの床
        const floorTex = this.textures.trenchFloor;
        let floorMat;
        if (floorTex) {
            floorTex.wrapS = THREE.MirroredRepeatWrapping; 
            floorTex.wrapT = THREE.MirroredRepeatWrapping; 
            floorTex.repeat.set(2, 20); 
            floorMat = new THREE.MeshPhongMaterial({ map: floorTex, emissive: 0x333333 });
        } else {
            floorMat = new MeshPhongMaterial({ color: 0x222222 });
        }
        this.trenchFloor = new THREE.Mesh(new THREE.PlaneGeometry(400, 3000), floorMat);
        this.trenchFloor.rotation.x = -Math.PI / 2;
        this.trenchFloor.position.y = -60;
        this.trenchFloor.position.z = -500;
        this.trenchGroup.add(this.trenchFloor);

        // 2. トレンチの左右の壁
        const wallTex = this.textures.trenchWall;
        let wallMat;
        if (wallTex) {
            wallTex.wrapS = THREE.MirroredRepeatWrapping;
            wallTex.wrapT = THREE.MirroredRepeatWrapping;
            wallTex.repeat.set(20, 2); 
            wallMat = new THREE.MeshPhongMaterial({ map: wallTex, emissive: 0x333333 });
        } else {
            wallMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        }
        
        const wallGeo = new THREE.PlaneGeometry(3000, 300);
        this.trenchLeftWall = new THREE.Mesh(wallGeo, wallMat);
        this.trenchLeftWall.rotation.y = Math.PI / 2;
        // ★修正：初期位置をスマホ幅に調整
        this.trenchLeftWall.position.set(-60, 0, -500);
        this.trenchGroup.add(this.trenchLeftWall);

        this.trenchRightWall = new THREE.Mesh(wallGeo, wallMat);
        this.trenchRightWall.rotation.y = -Math.PI / 2;
        // ★修正：初期位置をスマホ幅に調整
        this.trenchRightWall.position.set(60, 0, -500);
        this.trenchGroup.add(this.trenchRightWall);

        this.trenchGroup.visible = false;
        this.scene.add(this.trenchGroup);

        // 3. コア空間（ボスの部屋）
        this.coreGroup = new THREE.Group();
        
        const coreBgMat = this.textures.coreBg ? new THREE.MeshBasicMaterial({ map: this.textures.coreBg }) : new THREE.MeshBasicMaterial({ color: 0x550000 });
        this.coreBg = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), coreBgMat);
        this.coreBg.position.set(0, 0, -800);
        this.coreGroup.add(this.coreBg);

        const reactorTex = this.textures.coreReactor;
        let reactorMat;
        if (reactorTex) {
            reactorMat = new THREE.MeshStandardMaterial({ map: reactorTex, emissive: 0xff3300, emissiveMap: reactorTex, emissiveIntensity: 1.5 });
        } else {
            reactorMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff0000, wireframe: true });
        }
        this.coreReactor = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 32), reactorMat);
        this.coreReactor.position.set(0, -100, -600);
        this.coreGroup.add(this.coreReactor);

        const redLight = new THREE.PointLight(0xff0000, 2, 1000);
        redLight.position.set(0, 0, -400);
        this.coreGroup.add(redLight);

        this.coreGroup.visible = false;
        this.scene.add(this.coreGroup);
    }

    loop() {
        if (!this.isActive) return;

        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        if (this.currentStage === 5) {
            if (this.moon) {
                if (this.moon.position.y < -2000) { 
                    this.moon.position.y += 0.55; 
                }
                if (this.moon.scale.x < 4.5) { 
                    this.moon.scale.x += 0.0009; 
                    this.moon.scale.y += 0.0009;
                    this.moon.scale.z += 0.0009;
                }
                
                this.moon.rotation.y += 0.001;
                this.moon.rotation.x += 0.0005;
            }
            if (this.starField) {
                this.starField.rotation.y += 0.0003;
                this.starField.rotation.x += 0.0001;
            }
        }

        if (this.currentStage === 6) {
            if (this.trenchGroup && this.trenchGroup.visible) {
                // ★修正：スクロール方向を逆転（奥へ進むように変更）
                if (this.trenchFloor && this.trenchFloor.material.map) {
                    this.trenchFloor.material.map.offset.y += this.trenchScrollSpeed * 0.01;
                }
                if (this.trenchLeftWall && this.trenchLeftWall.material.map) {
                    this.trenchLeftWall.material.map.offset.x -= this.trenchScrollSpeed * 0.01;
                    this.trenchRightWall.material.map.offset.x += this.trenchScrollSpeed * 0.01;
                }

                if (this.isCoreTransitioning) {
                    this.coreGroup.visible = true;
                    if (this.trenchLeftWall.position.x > -800) {
                        this.trenchLeftWall.position.x -= 4;
                        this.trenchRightWall.position.x += 4;
                    }
                    if (this.coreGroup.position.y < -200) {
                        this.coreGroup.position.y += 5;
                    }
                }
            }

            if (this.coreGroup && this.coreGroup.visible && this.coreReactor) {
                this.coreReactor.rotation.y += 0.01;
                this.coreReactor.rotation.x += 0.005;
                const redLight = this.coreGroup.children[2];
                if(redLight) redLight.intensity = 2 + Math.sin(Date.now() * 0.005) * 1.0;
            }
        }

        if (this.ground && this.ground.material.map && this.ground.visible) {
            this.ground.material.map.offset.y += (this.scrollSpeed / 40) * Math.sign(this.ground.material.map.repeat.y);
        }

        if (this.flameMaterial) {
            this.flameMaterial.uniforms.uTime.value += 0.016; 
        }

        this.candles.forEach(c => {
            if (!c.visible) return; 
            
            c.position.z += this.scrollSpeed;

            if (c.position.z > 40) {
                c.position.z -= 800; 
                c.position.x = (Math.random() - 0.5) * 400;
            }
            
            const flame = c.children[2];
            if (flame && this.camera) {
                flame.quaternion.copy(this.camera.quaternion);
            }
        });

        this.buildings.forEach(b => {
            if (!b.visible) return; 
            b.position.z += this.scrollSpeed;
            if (b.position.z > 40) {
                b.position.z -= 400;
                b.position.x = (Math.random() - 0.5) * 200;
            }
        });

        this.clouds.forEach(c => {
            if (!c.visible) return; 
            c.position.z += this.cloudScrollSpeed;
            c.rotation.z += 0.01;
            if (c.position.z > 100) {
                c.position.z -= 400;
                c.position.x = (Math.random() - 0.5) * 200;
            }
        });

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.loop());
    }
}
