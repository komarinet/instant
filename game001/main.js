// CYBER-SWEEP v5.9 | main.js
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        // 緑色のデバッグ関数は完全に削除しました
        document.getElementById('start-btn').onclick = () => this.handleStart();
        document.getElementById('skip-prologue-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        
        this.createStageSelect();
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; 
        btn.innerText = "LOADING CORE...";

        try {
            await this.preload(['img/ship.png', 'img/space02.png', 'img/bomb.png']);
            this.startPrologue();
        } catch(e) { 
            this.showScene('scene-select'); 
        } finally { 
            btn.disabled = false; btn.innerText = "INITIALIZE CONNECTION"; 
        }
    },

    async preload(urls) {
        const ps = urls.map(u => new Promise((res, rej) => {
            const i = new Image();
            i.src = u;
            i.onload = () => i.decode ? i.decode().then(res).catch(res) : res();
            i.onerror = () => rej(u + " failed");
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        document.querySelectorAll('.scene').forEach(s => s.classList.replace('scene-show', 'scene-hidden'));
        document.getElementById(id).classList.replace('scene-hidden', 'scene-show');
    },

    startPrologue() {
        SoundEngine.init();
        this.showScene('scene-prologue');
        
        const ship = document.getElementById('prologue-ship');
        const exp = document.getElementById('explosion-layer');
        const texts = document.querySelectorAll('#prologue-text > *');

        // 1. 揺れ開始
        setTimeout(() => {
            ship.classList.add('shake-prologue');
            SoundEngine.playSFX('damage');
        }, 800);

        // 2. 爆発（船の右翼エンジン付近を狙って配置）
        setTimeout(() => {
            exp.style.display = 'block';
            exp.style.left = "calc(50% + 15px)"; // 船の中央から少し右
            exp.style.top = "calc(50% + 5px)";   // 船の中央から少し下
            exp.classList.add('bomb-play');
            texts.forEach(t => t.style.opacity = '1');
            SoundEngine.playSFX('damage');
        }, 1300);

        // 3. 5秒後にステージ選択へ自動移行
        setTimeout(() => {
            if(document.getElementById('scene-prologue').classList.contains('scene-show')) {
                this.showScene('scene-select');
            }
        }, 5500);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 transition-all active:scale-95';
            btn.innerHTML = `<span class="text-[9px] font-orbitron" style="color:${data.blue}">LEVEL ${lvl}</span><br><span class="text-sm">${data.name}</span>`;
            btn.onclick = () => {
                document.documentElement.style.setProperty('--neon-blue', data.blue);
                document.documentElement.style.setProperty('--neon-pink', data.pink);
                document.getElementById('game-title-text').innerText = data.name;
                document.getElementById('level-display').innerText = `LVL.0${lvl}`;
                this.showScene('scene-game');
                GameLogic.init(parseInt(lvl));
            };
            container.appendChild(btn);
        });
    },

    toggleScan() {
        if(GameLogic.state.energy >= GameLogic.config.scanCost) {
            GameLogic.state.isScanning = !GameLogic.state.isScanning;
            document.getElementById('scan-btn').classList.toggle('active-mode', GameLogic.state.isScanning);
            this.showToast(GameLogic.state.isScanning ? "SCAN READY: SELECT AREA" : "SCAN CANCELLED");
        }
    },

    toggleFlag() {
        GameLogic.state.flagMode = !GameLogic.state.flagMode;
        document.getElementById('flag-mode-btn').classList.toggle('active-mode', GameLogic.state.flagMode);
        this.showToast(GameLogic.state.flagMode ? "MARK MODE: ON" : "MARK MODE: OFF");
    },

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'Off' : 'On'}`;
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').innerText = isWin ? "CLEARED" : "FAILED";
        document.getElementById('modal-desc').innerText = isWin ? "Sector successfully decrypted. Moving to next sector." : "System integrity compromised. Reboot required.";
        document.getElementById('modal-btn-main').onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        modal.classList.remove('hidden');
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg; t.style.opacity = '1';
        setTimeout(() => t.style.opacity = '0', 2000);
    }
};
window.onload = () => MainController.init();
