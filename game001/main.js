// CYBER-SWEEP v5.5 | main.js
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    async init() {
        const startBtn = document.getElementById('start-btn');
        startBtn.onclick = () => this.handleStart();
        
        document.getElementById('skip-prologue-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        
        this.createStageSelect();
    },

    // 画像の読み込み完了を待機する関数
    async preloadAssets(urls) {
        const promises = urls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    // decode()を使うことで、GPU上の展開まで確実に待機させる
                    if (img.decode) {
                        img.decode().then(resolve).catch(resolve);
                    } else {
                        resolve();
                    }
                };
                // 画像が見つからなくてもエラーにせず「完了」として扱う
                img.onerror = resolve;
            });
        });
        return Promise.all(promises);
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "LOADING ASSETS...";

        try {
            // 演出に必要な画像を事前に強制ロード
            await this.preloadAssets([
                './img/ship.png',
                './img/space02.png',
                './img/bomb.png'
            ]);
            this.startPrologue();
        } catch (e) {
            console.error("Asset Load Error", e);
            btn.innerText = "LOAD ERROR - SKIP TO SELECT";
            setTimeout(() => this.showScene('scene-select'), 1000);
        } finally {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    },

    showScene(id) {
        document.querySelectorAll('.scene').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    },

    applyTheme(level) {
        const t = this.themes[level];
        document.documentElement.style.setProperty('--neon-blue', t.blue);
        document.documentElement.style.setProperty('--neon-pink', t.pink);
        document.getElementById('game-title-text').innerText = t.name;
    },

    startPrologue() {
        SoundEngine.init();
        this.showScene('scene-prologue');
        
        const ship = document.getElementById('prologue-ship');
        const exp = document.getElementById('explosion-layer');
        const texts = document.querySelectorAll('#prologue-text > *');

        // 演出開始
        setTimeout(() => {
            ship.classList.add('shake-prologue');
            SoundEngine.playSFX('damage');
        }, 500);

        setTimeout(() => {
            exp.style.display = 'block';
            exp.style.left = "calc(50% - 150px)";
            exp.style.bottom = "calc(30% - 20px)";
            exp.classList.add('bomb-play');
            texts.forEach(t => t.style.opacity = '1');
            SoundEngine.playSFX('damage');
        }, 1200);

        setTimeout(() => {
            if(!document.getElementById('scene-prologue').classList.contains('hidden')) {
                this.showScene('scene-select');
            }
        }, 5000);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        container.innerHTML = '';
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 transition-all active:scale-95';
            btn.innerHTML = `<span class="text-[10px]" style="color:${data.blue}">LEVEL ${lvl}</span><br>${data.name}`;
            btn.onclick = () => { this.applyTheme(lvl); this.showScene('scene-game'); GameLogic.init(parseInt(lvl)); };
            container.appendChild(btn);
        });
    },

    toggleScan() {
        if(GameLogic.state.energy >= GameLogic.config.scanCost) {
            GameLogic.state.isScanning = !GameLogic.state.isScanning;
            document.getElementById('scan-btn').classList.toggle('active-mode', GameLogic.state.isScanning);
        }
    },

    toggleFlag() {
        GameLogic.state.flagMode = !GameLogic.state.flagMode;
        document.getElementById('flag-mode-btn').classList.toggle('active-mode', GameLogic.state.flagMode);
    },

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `SOUND: ${m ? 'OFF' : 'ON'}`;
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').innerText = isWin ? "SECTOR CLEARED" : "SYSTEM HALT";
        document.getElementById('modal-desc').innerText = isWin ? "次のセクターへ移動可能です。" : "リブートが必要です。";
        document.getElementById('modal-btn-main').onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        modal.classList.remove('hidden');
    }
};
window.onload = () => MainController.init();
