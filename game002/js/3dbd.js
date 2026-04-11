const VER_3DBG = "0.1.0"; // バージョン更新

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
        
        // --- アセット（テクスチャ） ---
        this.textures = {
            sideatlas: null,
            topatlas: null,
            ground: null
        };
        this.textureAtlasSize = {
            side: { cols: 3, rows: 2, count: 5 }, // Build_side.png
            top: { cols: 4, rows: 3, count: 12 }   // build_top.png
        };

        // --- 設定・状態 ---
        this.scrollSpeed = 0.5; // 地面とビルのスクロール速度
        this.cloudScrollSpeed = 1.0; // 雲のスクロール速度（疾走感）
        this.isLoaded = false;
    }

    // ★アセットのプリロードロジック★（ビルドサイド、ビルドトップ、グラウンド）
    preload(images, callback) {
        let loaded = 0;
        const total = images.length;
        const textureLoader = new THREE.TextureLoader();

        images.forEach(imgData => {
            const key = imgData.key;
            const src = `img/${imgData.src}`;
            textureLoader.load(src, (texture) => {
                this.textures[key] = texture;
                loaded++;
                if (loaded === total) {
                    this.isLoaded = true;
                    callback();
                }
            }, undefined, (err) => {
                console.error(`Failed to load texture: ${src}`, err);
            });
        });
    }

    // Three.js空間の初期化
    init() {
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
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
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

        this.isActive = true;
        this.loop(); // アニメーションループ開始
    }

    // ★修正：地面（グラウンド）の作成とシームレススクロール設定★
    createGround() {
        const groundTexture = this.textures.ground;
        if (!groundTexture) return;

        // 地面のテクスチャをリピート設定
        groundTexture.wrapS = THREE.RepeatWrapping; // 横（S）
        groundTexture.wrapT = THREE.RepeatWrapping; // 縦（T）
        // テクスチャをひっくり返しながら繋げることでシームレスにする要望
        // Three.jsでは直接サポートされていないため、テクスチャ自体のひっくり返しは画像側で行う前提とする。
        // ここでは縦方向のテクスチャオフセットを変化させてスクロールを表現する。
        
        // 地面の平面（PlaneGeometry）を作成（大きめに）
        const geometry = new THREE.PlaneGeometry(300, 300); // 幅、高さ
        // 地面にテクスチャを貼る（影を受け取る）
        const material = new THREE.MeshPhongMaterial({
            map: groundTexture,
            shininess: 0 // 光沢なし
        });
        
        this.ground = new THREE.Mesh(geometry, material);
        this.ground.rotation.x = -Math.PI / 2; // 地面なので水平に回転
        this.ground.position.y = 0; // 地面の高さ
        this.ground.receiveShadow = true; // 影を受け取る
        
        this.scene.add(this.ground);
    }

    // ランダムなビル群の作成（テクスチャ貼り付けはステップ3で）
    createBuildings() {
        // ... (ここに、直方体を大量生成し、ランダムに配置するロジックが入る。影を落とす設定も)
    }

    // 煙・雲（疾走感）の作成（ステップ3で）
    createClouds() {
        // ... (ここに、煙のような雲を生成し、ビル群の上空に配置するロジックが入る)
    }

    // アニメーションループ
    loop() {
        if (!this.isActive) return;

        // 地面（グラウンド）のシームレススクロール（テクスチャオフセットを変化させる）
        if (this.ground && this.ground.material.map) {
            // テクスチャのYオフセットを変化させる。上下ひっくり返しは画像で行う前提
            this.ground.material.map.offset.y -= (this.scrollSpeed * 0.01);
        }

        // ビル群のスクロール（ステップ3で）

        // 雲のスクロール（ステップ3で）

        // 描画実行
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(() => this.loop());
    }
}
