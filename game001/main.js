// CYBER-SWEEP v12.6 | main.js | SCENE BGM STOP FIX
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#fff200', pink: '#00f3ff', name: "SCANNERA GATE" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        const startBtn = document.getElementById('start-btn');
        const selectBtn = document.getElementById('select-scene-btn');
        const backTitleBtn = document.getElementById('back-to-title-btn');
        
        if(startBtn) startBtn.onclick = () => this.handleStart();
        if(selectBtn) selectBtn.onclick = () => {
            this.createStageSelect();
            this.showScene('scene-select');
        };
        // タイトルに戻る時はテーマとBGMをリセット
        if(backTitleBtn) backTitleBtn.onclick = () => {
            this.resetTheme();
            SoundEngine.setStoryMusic('stop');
            this.showScene('scene-title');
        };

        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('back-to-menu-btn').onclick = () => {
            SoundEngine.setStoryMusic('stop');
            this.showScene('scene-select');
        };
        
        // エンディング画面のボタン
        document.getElementById('end-retry-btn').onclick = () => this.startStageSequence(1);
        document.getElementById('end-select-btn').onclick = () => { 
            SoundEngine.setStoryMusic('stop');
            this.createStageSelect(); 
            this.showScene('scene-select'); 
        };
        document.getElementById('end-title-btn').onclick = () => {
            this.resetTheme();
            SoundEngine.setStoryMusic('stop');
            this.showScene('scene-title');
        };

        this.createStageSelect();
        StoryEngine.init();
    },

    resetTheme() {
        document.documentElement.style.setProperty('--neon-blue', '#00f3ff');
        document.documentElement.style.setProperty('--neon-pink', '#ff00ff');
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; btn.innerText = "LOADING...";
        try {
            await this.preload(['img/ship.png','img/space02.png','img/bomb.png','img/bit.png','img/girl.png','img/inship.png','img/door.png','img/wing.png','img/cockpit0.png','img/cockpit.png','img/uni.png','img/waku.png','img/chaku.png','img/shu.png']);
            this.startStageSequence(1);
        } catch(e) { 
            this.startStageSequence(1); 
        }
        finally { btn.disabled = false; btn.innerText = "START MISSION"; }
    },

    async preload(urls) {
        const ps = urls.map(u => new Promise(res => {
            const i = new Image(); i.src = u;
            i.onload = () => i.decode ? i.decode().then(res).catch(res) : res();
            i.onerror = () => { res(); };
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        const scenes = document.querySelectorAll('.scene');
        scenes.forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('scene-show');
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('scene-show');
        }
    },

    startStageSequence(lvl) {
        if (lvl === 1) {
            this.startExteriorPrologue(() => {
                this.showScene('scene-adventure');
                StoryEngine.play('stage1', () => this.launchGame(1));
            });
        } else if (lvl >= 2 && lvl <= 5) {
            this.showScene('scene-adventure');
            StoryEngine.play(`stage${lvl}`, () => this.launchGame(lvl));
        } else if (lvl === 99) {
            this.showScene('scene-adventure');
            StoryEngine.play('ending', () => this.showScene('scene-ending'));
        } else {
            this.showScene('scene-select');
        }
    },

    startExteriorPrologue(callback) {
        this.resetTheme();
        SoundEngine.init();
        SoundEngine.setStoryMusic('calm'); // プロローグBGM
        this.showScene('scene-prologue');
        let count = 0;
        const interval = setInterval(() => {
            this.playRandomExplosion();
            count++;
            if(count >= 3) { clearInterval(interval); setTimeout(callback, 1500); }
        }, 800);
    },

    playRandomExplosion() {
        const container = document.getElementById('exp-container');
        if (!container) return;
        const exp = document.createElement('div');
        exp.className = 'explosion bomb-play';
        const rx = 170 + (Math.random() * 80 - 40);
        const ry = 100 + (Math.random() * 30 - 15);
        exp.style.left = `${rx - 40}px`; exp.style.top = `${ry - 40}px`;
        container.appendChild(exp);
        SoundEngine.playSFX('damage');
        setTimeout(() => exp.remove(), 1000);
    },

    launchGame(lvl) {
        const theme = this.themes[lvl];
        if(!theme) return;
        document.documentElement.style.setProperty('--neon-blue', theme.blue);
        document.documentElement.style.setProperty('--neon-pink', theme.pink);
        document.getElementById('game-title-text').innerText = theme.name;
        document.getElementById('level-display').innerText = `LVL.0${lvl}`;
        
        const fBtn = document.getElementById('flag-mode-btn');
        fBtn.style.backgroundColor = ""; fBtn.style.color = "";
        const sBtn = document.getElementById('scan-btn');
        sBtn.style.backgroundColor = ""; sBtn.style.color = "";
        
        this.showScene('scene-game');
        GameLogic.init(lvl);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        if (!container) return;
        container.innerHTML = '';
        
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-5 rounded-xl font-bold text-left active:scale-95 transition-all';
            btn.innerHTML = `<span class="text-[10px] font-orbitron" style="color:${data.blue}">SECTOR ${String(lvl).padStart(2,'0')}</span><br><span class="text-sm uppercase">${data.name}</span>`;
            btn.onclick = () => this.startStageSequence(parseInt(lvl));
            container.appendChild(btn);
        });

        const endBtn = document.createElement('button');
        endBtn.className = 'cyber-panel p-3 mt-4 rounded-xl font-bold text-center active:scale-95 transition-all border-dashed border-[var(--neon-yellow)] text-[var(--neon-yellow)]';
        endBtn.innerHTML = `<span class="text-xs uppercase">[DEBUG] View Ending</span>`;
        endBtn.onclick = () => this.startStageSequence(99); 
        container.appendChild(endBtn);
    },

    toggleFlag() {
        GameLogic.state.flagMode = !GameLogic.state.flagMode;
        const btn = document.getElementById('flag-mode-btn');
        btn.style.backgroundColor = GameLogic.state.flagMode ? "var(--neon-pink)" : "";
        btn.style.color = GameLogic.state.flagMode ? "black" : "";
    },

    toggleScan() {
        if(GameLogic.state.energy >= GameLogic.config.scanCost) {
            GameLogic.state.isScanning = !GameLogic.state.isScanning;
            const btn = document.getElementById('scan-btn');
            btn.style.backgroundColor = GameLogic.state.isScanning ? "var(--neon-blue)" : "";
            btn.style.color = GameLogic.state.isScanning ? "black" : "";
        }
    },

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'OFF' : 'ON'}`;
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        const modalBtn = document.getElementById('modal-btn-main');
        
        if (isWin) {
            document.getElementById('modal-title').innerText = "DECRYPTED";
            document.getElementById('modal-desc').innerText = "Advanced matrix break success.";
            modalBtn.innerText = "CONTINUE CONNECTION";
            modalBtn.onclick = () => {
                modal.classList.add('hidden');
                if (GameLogic.state.level === 5) {
                    this.showScene('scene-adventure');
                    StoryEngine.play('ending', () => this.showScene('scene-ending'));
                } else {
                    this.startStageSequence(GameLogic.state.level + 1);
                }
            };
        } else {
            document.getElementById('modal-title').innerText = "CRITICAL FAIL";
            document.getElementById('modal-desc').innerText = "Matrix lock active. Resetting connection.";
            modalBtn.innerText = "REBOOT MATRIX";
            modalBtn.onclick = () => { modal.classList.add('hidden'); this.launchGame(GameLogic.state.level); };
        }
        modal.classList.remove('hidden');
    }
};
window.onload = () => MainController.init();
