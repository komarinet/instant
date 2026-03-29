// CYBER-SWEEP v5.8 | main.js | [決定版] PATH: img/
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    debug(msg) {
        const el = document.getElementById('debug-log');
        el.innerHTML += msg + "<br>";
        console.log(msg);
    },

    init() {
        this.debug("System Init...");
        this.debug("imgs are at img/ (PATH UNIFIED). TAILWIND conflict fixed by unique scene-show classes.");
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
        btn.disabled = true; btn.innerText = "LOADING ASSETS...";
        this.debug("Preloading Images... PATH: img/ship.png etc.");

        try {
            await this.preload(['img/ship.png', 'img/space02.png', 'img/bomb.png']);
            this.debug("Preload OK. Starting Prologue.");
            this.startPrologue();
        } catch(e) { 
            this.debug("Preload ERROR: " + e);
            btn.innerText = "LOAD ERROR - SKIP TO SELECT";
            setTimeout(() => this.showScene('scene-select'), 1000);
        } finally { 
            btn.disabled = false; btn.innerText = "INITIALIZE CONNECTION"; 
        }
    },

    async preload(urls) {
        const ps = urls.map(u => new Promise((res, rej) => {
            const i = new Image();
            i.src = u;
            i.onload = () => {
                if (i.decode) i.decode().then(res).catch(res);
                else res();
            };
            i.onerror = () => rej(u + " failed");
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        this.debug("Switching to: " + id);
        // Tailwindのhiddenは競合するため独自クラス scene-hidden / scene-show のみで制御
        document.querySelectorAll('.scene').forEach(s => s.classList.replace('scene-show', 'scene-hidden'));
        document.getElementById(id).classList.replace('scene-hidden', 'scene-show');
    },

    startPrologue() {
        SoundEngine.init();
        this.debug("Prologe start... PATH: img/ space02.png full bg.");
        this.showScene('scene-prologue');
        
        const ship = document.getElementById('prologue-ship');
        const exp = document.getElementById('explosion-layer');
        const texts = document.querySelectorAll('#prologue-text > *');

        // 揺れ開始
        setTimeout(() => {
            this.debug("Event: Shake (on mobile, ship bottom may be covered. top: 50% used.)");
            ship.classList.add('shake-prologue');
            SoundEngine.playSFX('damage');
        }, 800);

        // 爆発
        setTimeout(() => {
            this.debug("Event: Explosion (small, on ship right side, 故障 setting)");
            exp.style.display = 'block';
            // 宇宙船が中央 (top: 50%, left: 50%) になったので爆発も中央付近から
            exp.style.left = "calc(50% + 50px)"; // 宇宙船の中心から右に50px
            exp.style.top = "calc(50% + 20px)"; // 宇宙船の中心から下に20px
            // style.cssで transform: translate(-50%, -50%) 指定済み。これで爆発の中心が指定座標に来る。
            exp.classList.add('bomb-play');
            texts.forEach(t => t.style.opacity = '1');
            SoundEngine.playSFX('damage');
        }, 1300);

        // シーン終了
        setTimeout(() => {
            if(document.getElementById('scene-prologue').classList.contains('scene-show')) {
                this.showScene('scene-select');
            }
        }, 5000);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            // Tailwindのhiddenと競合しないよう独自クラスに変更
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 transition-all active:scale-95';
            btn.innerHTML = `<span class="text-[10px]" style="color:${data.blue}">LEVEL ${lvl}</span><br>${data.name}`;
            btn.onclick = () => {
                document.documentElement.style.setProperty('--neon-blue', data.blue);
                document.documentElement.style.setProperty('--neon-pink', data.pink);
                document.getElementById('game-title-text').innerText = data.name;
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
        document.getElementById('modal-desc').innerText = isWin ? "Next sector decryption ready." : "Reboot required.";
        document.getElementById('modal-btn-main').onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        modal.classList.remove('hidden');
    }
};
window.onload = () => MainController.init();
