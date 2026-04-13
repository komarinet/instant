const VER_3DBG = "0.2.0"; // バージョン更新（ShadowMapの廃止とジオメトリ/マテリアル再利用による軽量化）

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
        
        this.textures = {
            sideatlas: null,
            topatlas: null,
            ground: null,
            ground2: null, 
            candle: null 
        };
        this.textureAtlasSize = {
            side: { cols: 3, rows: 2, count: 5 }, 
            top: { cols: 4, rows: 3, count: 12 }   
        };

        this.scrollSpeed = 0.5; 
        this.cloudScrollSpeed = 1.0; 
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
            antialias: false, // ★軽量化: スマホ向けにアンチエイリアスをオフ（必要なら戻してください）
            alpha: true 
        });
        this.renderer.setPixelRatio(dpr);
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(width, height, false);
        this.renderer.setClearColor(0x000000, 0); 

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0a14, 50, 300); 

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(0, 60, 0); 
        this.camera.rotation.x = -Math.PI / 2.5; 

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 影を消す分少し明るめに
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 50, -20); 
        // ★軽量化: 重い影の計算を完全に無効化
        directionalLight.castShadow = false; 
        this.scene.add(directionalLight);

        this.renderer.shadowMap.enabled = false; // ★軽量化: シャドウマップ無効化

        this.createGround();
        this.createBuildings(); 
        this.createClouds();   
        this.createCandles();  

        this.isActive = true;
        this.loop(); 
    }

    setStage(stageNum) {
        this.currentStage = stageNum;
        if (!this.ground || !this.ground.material) return;
        
        if (stageNum === 2) {
            if (this.textures.ground2) {
                this.ground.material.map = this.textures.ground2;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, -10); 
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = false);
            this.candles.forEach(c => c.visible = true);
        } else {
            if (this.textures.ground) {
                this.ground.material.map = this.textures.ground;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            this.buildings.forEach(b => b.visible = true);
            this.candles.forEach(c => c.visible = false);
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
        // ★軽量化: receiveShadow を削除
        this.scene.add(this.ground);
    }

    // ★劇的軽量化：図形とマテリアルの再利用★
    createBuildings() {
        const numBuildings = 60; 
        
        // 1. 基準となる「1x1x1」の小さな箱を【1個だけ】作る（これを後で各サイズに引き伸ばす）
        const baseGeo = new THREE.BoxGeometry(1, 1, 1);

        // 2. マテリアルを全パターン（側面5種、屋上12種）事前に作って配列に保存しておく
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

        // 3. ループ内で事前生成した部品を組み立てるだけ
        for (let i = 0; i < numBuildings; i++) {
            const w = Math.random() * 15 + 10;
            const d = Math.random() * 15 + 10;
            const h = Math.random() * 40 + 20;

            const sMat = sideMaterials[Math.floor(Math.random() * sideMaterials.length)];
            const tMat = topMaterials[Math.floor(Math.random() * topMaterials.length)];
            const materials = [sMat, sMat, tMat, sMat, sMat, sMat];
            
            const mesh = new THREE.Mesh(baseGeo, materials);
            
            // ★ポイント: geometryを作り直さず、scaleで引き伸ばす
            mesh.scale.set(w, h, d);
            
            mesh.position.x = (Math.random() - 0.5) * 200;
            mesh.position.z = (Math.random() - 0.5) * 400 - 50; 
            mesh.position.y = h / 2; 

            // ★軽量化: castShadow, receiveShadow を削除

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

    // ★劇的軽量化：図形の再利用★
    createCandles() {
        const numCandles = 60; 

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
                    float t = uTime * 3.0 + offset * 10.0;
                    p.x += sin(t + p.y * 3.0) * 0.15 * p.y;
                    float d = length(vec2(p.x, max(0.0, p.y - 0.2))) * 1.5;
                    float alpha = smoothstep(0.8, 0.2, d + p.y * 0.5);
                    vec3 colorBottom = vec3(0.0, 0.4, 0.6); 
                    vec3 colorMid = vec3(0.8, 0.0, 0.4);    
                    vec3 colorTop = vec3(1.0, 0.5, 0.0);    
                    vec3 colorCore = vec3(1.0, 1.0, 0.8);   
                    vec3 col = mix(colorBottom, colorMid, smoothstep(-0.5, 0.0, p.y));
                    col = mix(col, colorTop, smoothstep(0.0, 0.5, p.y));
                    float core = smoothstep(0.3, 0.0, d);
                    col = mix(col, colorCore, core);
                    float flicker = 0.7 + 0.3 * sin(t * 5.0 + offset);
                    gl_FragColor = vec4(col * flicker, alpha * flicker);
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
        });

        // 1. 基準となる「半径1、高さ1」の基本図形を【1個だけ】作る
        const baseBodyGeo = new THREE.CylinderGeometry(0.8, 1, 1, 8); 
        const baseWickGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
        const baseFlameGeo = new THREE.PlaneGeometry(1, 1.5);

        const sideMat = this.textures.candle ? new THREE.MeshPhongMaterial({ map: this.textures.candle }) : new THREE.MeshPhongMaterial({ color: 0x883311 });
        const topMat = new THREE.MeshPhongMaterial({ color: 0x331100 }); 
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); 

        for (let i = 0; i < numCandles; i++) {
            const candleGroup = new THREE.Group();

            const r = Math.random() * 4 + 3; 
            const h = Math.random() * 30 + 15; 

            // 1. ロウソク本体
            const bodyMesh = new THREE.Mesh(baseBodyGeo, [sideMat, topMat, sideMat]); 
            bodyMesh.scale.set(r, h, r); // ★ポイント: scaleで引き伸ばす
            bodyMesh.position.y = h / 2; 
            candleGroup.add(bodyMesh);

            // 2. 黒い芯
            const wickMesh = new THREE.Mesh(baseWickGeo, wickMat);
            wickMesh.position.y = h + 1; 
            candleGroup.add(wickMesh);

            // 3. 不安な炎
            const flameSize = r * 3.0; 
            const flameMesh = new THREE.Mesh(baseFlameGeo, this.flameMaterial);
            flameMesh.scale.set(flameSize, flameSize, 1); // ★ポイント: scaleで引き伸ばす
            flameMesh.position.y = h + 1 + flameSize * 0.5; 
            candleGroup.add(flameMesh);

            candleGroup.position.x = (Math.random() - 0.5) * 200;
            candleGroup.position.z = (Math.random() - 0.5) * 400 - 50;
            candleGroup.visible = false; 

            this.scene.add(candleGroup);
            this.candles.push(candleGroup);
        }
    }

    loop() {
        if (!this.isActive) return;

        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        if (this.ground && this.ground.material.map) {
            this.ground.material.map.offset.y += (this.scrollSpeed / 40);
        }

        if (this.flameMaterial) {
            this.flameMaterial.uniforms.uTime.value += 0.016; 
        }

        this.candles.forEach(c => {
            if (!c.visible) return; 
            c.position.z += this.scrollSpeed;
            if (c.position.z > 40) {
                c.position.z -= 400;
                c.position.x = (Math.random() - 0.5) * 200;
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
