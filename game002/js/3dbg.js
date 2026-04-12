const VER_3DBG = "0.1.8"; // バージョン更新（ステージ切り替え判定のバグ修正）

class BGManager3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.isActive = false;
        
        // --- Three.js 基本コンポーネント ---
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // --- ゲームオブジェクト ---
        this.ground = null;
        this.buildings = [];
        this.clouds = []; // 煙・雲
        this.candles = []; // ★追加：巨大ロウソク群
        
        // --- アセット（テクスチャ） ---
        this.textures = {
            sideatlas: null,
            topatlas: null,
            ground: null,
            ground2: null, // ★追加：Stage2用グラウンドテクスチャ
            candle: null // ★追加：ロウソク側面
        };
        this.textureAtlasSize = {
            side: { cols: 3, rows: 2, count: 5 }, // Build_side.png
            top: { cols: 4, rows: 3, count: 12 }   // build_top.png
        };

        // --- 設定・状態 ---
        this.scrollSpeed = 0.5; // 地面とビルのスクロール速度
        this.cloudScrollSpeed = 1.0; // 雲のスクロール速度（疾走感）
        this.isLoaded = false;
        
        // ★追加：現在のステージ管理用変数
        this.currentStage = 1;
        this.flameMaterial = null; // ★追加：炎の共通シェーダーマテリアル
    }

    // ★アセットのプリロードロジック★（ビルドサイド、ビルドトップ、グラウンド）
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
                    checkComplete(); // 画像がなくてもフリーズさせないための修正
                }
            );
        });
    }

    // Three.js空間の初期化
    init() {
        if (!this.canvas || typeof THREE === 'undefined') return;
        if (!this.isLoaded) return;
        
        // --- Renderer設定 ---
        const dpr = window.devicePixelRatio || 1;
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true, // ギザギザ防止（スマホでは重くなるかも）
            alpha: true // 背景を透明にする（index.htmlのCSSと合わせる）
        });
        this.renderer.setPixelRatio(dpr);
        // CanvasサイズをCSSピクセルベースで取得し、Three.js側を設定
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.renderer.setSize(width, height, false);
        this.renderer.setClearColor(0x000000, 0); // 完全に透明

        // --- Scene設定 ---
        this.scene = new THREE.Scene();
        // 遠景にわずかなフォグ（霧）をかけて奥行きを出す
        this.scene.fog = new THREE.Fog(0x0a0a14, 50, 300); // 色、開始距離、終了距離

        // --- Camera設定 (PerspectiveCamera - ドローン視点) ---
        // 視野角75度、アスペクト比、描画範囲（近、遠）
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        // ドローン視点：上空に配置し、真下（+少し前方）を見下ろす角度
        this.camera.position.set(0, 60, 0); // (x, y, z) - 真上
        this.camera.rotation.x = -Math.PI / 2.5; // 少し前傾させる。-90度だと真下

        // --- Light設定 ---
        // 環境光（全体を薄く照らす）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // 色、強度
        this.scene.add(ambientLight);

        // 平行光源（太陽光。影を作る）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 50, -20); // (x, y, z)
        directionalLight.castShadow = true; // 影を落とす
        this.scene.add(directionalLight);

        // shadow map設定 (ビルに影を落とすため)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // --- ゲームオブジェクトの作成 ---
        this.createGround();
        this.createBuildings(); // ランダムなビル群生成
        this.createClouds();   // 煙・雲（疾走感）生成
        this.createCandles();  // ★追加：巨大ロウソク群生成

        this.isActive = true;
        this.loop(); // アニメーションループ開始
    }

    // ★追加：ステージに応じた背景切り替え機能
    setStage(stageNum) {
        this.currentStage = stageNum;
        if (!this.ground || !this.ground.material) return;
        
        if (stageNum === 2) {
            // Stage 2: ground02.png を上下反転させて使用
            if (this.textures.ground2) {
                this.ground.material.map = this.textures.ground2;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                // マイナス値を設定することでテクスチャを上下反転させる
                this.ground.material.map.repeat.set(4, -10); 
                this.ground.material.needsUpdate = true;
            }
            // ★追加：ビルを隠してロウソクを表示
            this.buildings.forEach(b => b.visible = false);
            this.candles.forEach(c => c.visible = true);
        } else {
            // Stage 1 (他): ground01.png を通常使用
            if (this.textures.ground) {
                this.ground.material.map = this.textures.ground;
                this.ground.material.map.wrapS = THREE.MirroredRepeatWrapping;
                this.ground.material.map.wrapT = THREE.MirroredRepeatWrapping;
                this.ground.material.map.repeat.set(4, 10);
                this.ground.material.needsUpdate = true;
            }
            // ★追加：ビルを表示してロウソクを隠す
            this.buildings.forEach(b => b.visible = true);
            this.candles.forEach(c => c.visible = false);
        }
    }

    // 地面（グラウンド）の作成とシームレススクロール設定
    createGround() {
        const groundTexture = this.textures.ground;
        let material;

        if (groundTexture) {
            // テクスチャをひっくり返しながら繋げることでシームレスにする要望
            groundTexture.wrapS = THREE.MirroredRepeatWrapping; // 横（S）
            groundTexture.wrapT = THREE.MirroredRepeatWrapping; // 縦（T）
            groundTexture.repeat.set(4, 10);
            
            material = new THREE.MeshPhongMaterial({
                map: groundTexture,
                shininess: 0 // 光沢なし
            });
        } else {
            material = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 0 });
        }
        
        // 地面の平面（PlaneGeometry）を作成（大きめに）
        const geometry = new THREE.PlaneGeometry(300, 400); // 幅、高さ
        // 地面にテクスチャを貼る（影を受け取る）
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2; // 地面なので水平に回転
        this.ground.position.y = 0; // 地面の高さ
        this.ground.receiveShadow = true; // 影を受け取る
        
        this.scene.add(this.ground);
    }

    // ランダムなビル群の作成
    createBuildings() {
        const sideTexAtlas = this.textures.sideatlas;
        const topTexAtlas = this.textures.topatlas;

        const numBuildings = 60; // ビルの数

        for (let i = 0; i < numBuildings; i++) {
            // ランダムなサイズ
            const w = Math.random() * 15 + 10;
            const d = Math.random() * 15 + 10;
            const h = Math.random() * 40 + 20;

            const geo = new THREE.BoxGeometry(w, h, d);
            
            let sideMat, topMat;

            // 側面テクスチャの切り出し（3列2行、右下空欄）
            if (sideTexAtlas) {
                const sideTex = sideTexAtlas.clone();
                sideTex.needsUpdate = true;
                sideTex.repeat.set(1/3, 1/2); // 3列2行サイズに分割
                const sideIndex = Math.floor(Math.random() * 5); // 0〜4（5番目は空欄）
                const sCol = sideIndex % 3;
                const sRow = Math.floor(sideIndex / 3);
                // UVのY軸は下から上なので、行の計算を反転させる
                sideTex.offset.set(sCol * (1/3), 1 - (sRow + 1) * (1/2));
                sideMat = new THREE.MeshPhongMaterial({ map: sideTex });
            } else {
                sideMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
            }

            // 屋上テクスチャの切り出し（4列3行）
            if (topTexAtlas) {
                const topTex = topTexAtlas.clone();
                topTex.needsUpdate = true;
                topTex.repeat.set(1/4, 1/3); // 4列3行サイズに分割
                const topIndex = Math.floor(Math.random() * 12);
                const tCol = topIndex % 4;
                const tRow = Math.floor(topIndex / 4);
                topTex.offset.set(tCol * (1/4), 1 - (tRow + 1) * (1/3));
                topMat = new THREE.MeshPhongMaterial({ map: topTex });
            } else {
                topMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
            }

            // マテリアルを配列で指定 [右, 左, 上, 下, 前, 後]
            const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
            
            const mesh = new THREE.Mesh(geo, materials);
            
            // ランダムに配置
            mesh.position.x = (Math.random() - 0.5) * 200;
            mesh.position.z = (Math.random() - 0.5) * 400 - 50; 
            mesh.position.y = h / 2; // 地面に接するように高さを調整

            mesh.castShadow = true; // 影を落とす
            mesh.receiveShadow = true; // 影を受け取る

            this.scene.add(mesh);
            this.buildings.push(mesh);
        }
    }

    // 煙・雲（疾走感）の作成
    createClouds() {
        const numClouds = 20;
        const cloudGeo = new THREE.PlaneGeometry(40, 40);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0x111115,
            transparent: true,
            opacity: 0.4,
            depthWrite: false // 雲同士の描画順序のちらつきを防止
        });

        for (let i = 0; i < numClouds; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMat);
            cloud.position.x = (Math.random() - 0.5) * 200;
            cloud.position.y = Math.random() * 20 + 60; // ビルより高い位置
            cloud.position.z = (Math.random() - 0.5) * 300;
            
            // ランダムな回転で煙のモクモク感を出す
            cloud.rotation.x = -Math.PI / 2; 
            cloud.rotation.z = Math.random() * Math.PI * 2;
            
            this.scene.add(cloud);
            this.clouds.push(cloud);
        }
    }

    // ★追加：巨大ロウソク群の作成（完全新規メソッド）
    createCandles() {
        const numCandles = 60; // キャンドルの数

        // 魔法のような炎を作るための自作シェーダー
        this.flameMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0.0 }
            },
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

                // ランダムノイズ関数
                float rand(vec2 n) { 
                    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                }

                void main() {
                    vec2 p = vUv * 2.0 - 1.0; 
                    
                    // ワールド座標をシードにして、個々の炎の揺らめきタイミングをずらす
                    float offset = rand(vWorldPosition.xz);
                    float t = uTime * 3.0 + offset * 10.0;

                    // 炎の揺らめき（歪み）
                    p.x += sin(t + p.y * 3.0) * 0.15 * p.y;

                    // 炎のベース形状（雫型）
                    float d = length(vec2(p.x, max(0.0, p.y - 0.2))) * 1.5;
                    float alpha = smoothstep(0.8, 0.2, d + p.y * 0.5);

                    // 不安で魔女的な色合い（青緑 -> 赤紫 -> オレンジ）
                    vec3 colorBottom = vec3(0.0, 0.4, 0.6); // 不気味な青緑
                    vec3 colorMid = vec3(0.8, 0.0, 0.4);    // 毒々しい赤紫
                    vec3 colorTop = vec3(1.0, 0.5, 0.0);    // オレンジ
                    vec3 colorCore = vec3(1.0, 1.0, 0.8);   // 中心は白

                    // Y軸に応じて色をミックス
                    vec3 col = mix(colorBottom, colorMid, smoothstep(-0.5, 0.0, p.y));
                    col = mix(col, colorTop, smoothstep(0.0, 0.5, p.y));

                    // 中心部を白く飛ばす
                    float core = smoothstep(0.3, 0.0, d);
                    col = mix(col, colorCore, core);

                    // チカチカする明滅
                    float flicker = 0.7 + 0.3 * sin(t * 5.0 + offset);

                    // 加算合成用にアルファを掛けて出力
                    gl_FragColor = vec4(col * flicker, alpha * flicker);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending, // 加算合成（明るい部分だけが発光して重なる）
            depthWrite: false, // 炎同士の重なりバグを防ぐ
            side: THREE.DoubleSide
        });

        // ロウソク本体のマテリアル
        const candleTex = this.textures.candle;
        let sideMat;
        if (candleTex) {
            sideMat = new THREE.MeshPhongMaterial({ map: candleTex });
        } else {
            sideMat = new THREE.MeshPhongMaterial({ color: 0x883311 });
        }
        // 円柱のフタ部分（溶けたロウ）と底
        const topMat = new THREE.MeshPhongMaterial({ color: 0x331100 }); 
        const wickMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 真っ黒の芯

        for (let i = 0; i < numCandles; i++) {
            const candleGroup = new THREE.Group();

            // ランダムなサイズ
            const r = Math.random() * 4 + 3; // 半径 3〜7
            const h = Math.random() * 30 + 15; // 高さ 15〜45

            // 1. ロウソク本体（CylinderGeometry）
            // マテリアルは [側面, 上のフタ, 底のフタ] の順番
            const bodyGeo = new THREE.CylinderGeometry(r * 0.8, r, h, 8); 
            const bodyMesh = new THREE.Mesh(bodyGeo, [sideMat, topMat, sideMat]); 
            bodyMesh.castShadow = true;
            bodyMesh.receiveShadow = true;
            bodyMesh.position.y = h / 2; // 地面に接するように
            candleGroup.add(bodyMesh);

            // 2. 黒い芯
            const wickGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 4);
            const wickMesh = new THREE.Mesh(wickGeo, wickMat);
            wickMesh.position.y = h + 1; // 本体の少し上
            candleGroup.add(wickMesh);

            // 3. 不安な炎（平面のビルボード）
            const flameSize = r * 3.0; // 本体の太さに合わせて炎も大きく
            const flameGeo = new THREE.PlaneGeometry(flameSize, flameSize * 1.5);
            const flameMesh = new THREE.Mesh(flameGeo, this.flameMaterial);
            flameMesh.position.y = h + 1 + flameSize * 0.5; // 芯のさらに上
            candleGroup.add(flameMesh);

            // ランダムに配置
            candleGroup.position.x = (Math.random() - 0.5) * 200;
            candleGroup.position.z = (Math.random() - 0.5) * 400 - 50;

            candleGroup.visible = false; // デフォルトは隠しておく（Stage2で表示）

            this.scene.add(candleGroup);
            this.candles.push(candleGroup);
        }
    }

    // アニメーションループ
    loop() {
        if (!this.isActive) return;

        // ★修正：letで宣言された変数はwindowに入らないため、直接参照に変更してバグを修正
        if (typeof currentStage !== 'undefined') {
            if (this.currentStage !== currentStage) {
                this.setStage(currentStage);
            }
        }

        // 地面（グラウンド）のシームレススクロール（テクスチャオフセットを変化させる）
        if (this.ground && this.ground.material.map) {
            // ★修正：ビル群の移動と完全に同期させるための計算
            // 地面の縦幅(400) ÷ 縦のリピート数(10) = 40 なので、
            // ビルがスクロール速度(this.scrollSpeed)動くとき、画像は1/40動かせばピタッと同期します。
            this.ground.material.map.offset.y += (this.scrollSpeed / 40);
        }

        // ★追加：炎のシェーダーのアニメーション時間を進める
        if (this.flameMaterial) {
            this.flameMaterial.uniforms.uTime.value += 0.016; 
        }

        // ★追加：巨大ロウソク群のスクロールと炎のビルボード処理
        this.candles.forEach(c => {
            if (!c.visible) return;
            c.position.z += this.scrollSpeed;
            if (c.position.z > 40) {
                c.position.z -= 400;
                c.position.x = (Math.random() - 0.5) * 200;
            }
            
            // 平面ポリゴンで作った「炎(children[2])」が、常にカメラ側（プレイヤー側）を向くようにする
            const flame = c.children[2];
            if (flame && this.camera) {
                flame.quaternion.copy(this.camera.quaternion);
            }
        });

        // ビル群のスクロール
        this.buildings.forEach(b => {
            if (!b.visible) return; // ★追加：非表示の時は移動処理をスキップして軽くする
            b.position.z += this.scrollSpeed;
            // ★修正：影のアーティファクトを防ぐため、画面外に出たら早めに(z:40で)リサイクル
            if (b.position.z > 40) {
                b.position.z -= 400;
                b.position.x = (Math.random() - 0.5) * 200;
            }
        });

        // 雲のスクロール
        this.clouds.forEach(c => {
            c.position.z += this.cloudScrollSpeed;
            c.rotation.z += 0.01;
            if (c.position.z > 100) {
                c.position.z -= 400;
                c.position.x = (Math.random() - 0.5) * 200;
            }
        });

        // 描画実行
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.loop());
    }
}
