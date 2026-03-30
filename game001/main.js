// CYBER-SWEEP v11.2 | main.js | SCENE LOGIC STABILIZATION
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#fff200', pink: '#00f3ff', name: "SCANNERA GATE" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        document.getElementById('start-btn').onclick = () => this.handleStart();
        document.getElementById('select-scene-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('back-to-title-btn').onclick = () => this.showScene('scene-title');
        
        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        
        this.createStageSelect();
        StoryEngine.init();
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; btn.innerText = "LOADING...";
        try {
            await this.preload(['img/ship.png','img/space02.png','img/bomb.png','img/bit.png','img/girl.png','img/inship.png','img/door.png','img/wing.png','img/cockpit0.png','img/cockpit.png','img/uni.png','img/waku.png','img/chaku.png']);
            this.startStageSequence(1);
        } catch(e) { this.startStageSequence(1); }
        finally { btn.disabled = false; btn.innerText = "START MISSION"; }
    },

    async preload(urls) {
        const ps = urls.map(u => new Promise(res => {
            const i = new Image(); i.src = u;
            i.onload = () => res(); i.onerror = () => res();
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        // 全てのシーンを隠し、対象だけを表示
        const scenes = document.querySelectorAll('.scene');
        scenes.forEach(s => {
            s.classList.remove('scene-show');
            s.classList.add('scene-hidden');
        });
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('scene-hidden');
            target.classList.add('scene-show');
        }
    },

    startStageSequence(lvl) {
        if (lvl === 1) {
            this.startExteriorPrologue(() => {
                this.showScene('scene-adventure');
                StoryEngine.play('stage1', () => this.launchGame(1));
            });
        } else if (lvl === 2) {
            this.showScene('scene-adventure');
            StoryEngine.play('stage2', () => this.launchGame(2));
        } else if (lvl === 3) {
            this.showScene('scene-adventure');
            StoryEngine.play('stage3', () => this.launchGame(3));
        } else if (lvl === 4) {
            this.showScene('scene-adventure');
            StoryEngine.play('stage4', () => this.launchGame(4));
        } else if (lvl === 5) {
            this.showScene('scene-adventure');
            StoryEngine.play('stage5', () => this.launchGame(5));
        } else {
            this.showScene('scene-select');
        }
    },

    startExteriorPrologue(callback) {
        SoundEngine.init();
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
        this.showScene('scene-game');
        GameLogic.init(lvl);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        if (!container) return;
        container.innerHTML = '';
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-5 rounded-xl font-bold text-left active:scale-95';
            btn.innerHTML = `<span class="text-[10px] font-orbitron" style="color:${data.blue}">SECTOR ${String(lvl).padStart(2,'0')}</span><br><span class="text-sm uppercase">${data.name}</span>`;
            btn.onclick = () => this.startStageSequence(parseInt(lvl));
            container.appendChild(btn);
        });
    },

    toggleFlag() {
        GameLogic.state.flagMode = !GameLogic.state.flagMode;
        const btn = document.getElementById('flag-mode-btn');
        btn.style.backgroundColor = GameLogic.state.flagMode ? "var(--neon-pink)" : "";
        btn.style.color = GameLogic.state.flagMode ? "black" : "";
        this.showToast(GameLogic.state.flagMode ? "MARK ON" : "MARK OFF");
    },

    toggleScan() {
        if(GameLogic.state.energy >= GameLogic.config.scanCost) {
            GameLogic.state.isScanning = !GameLogic.state.isScanning;
            document.getElementById('scan-btn').style.backgroundColor = GameLogic.state.isScanning ? "var(--neon-blue)" : "";
        }
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').innerText = isWin ? "DECRYPTED" : "HALT";
        document.getElementById('modal-desc').innerText = isWin ? "Matrix break success." : "Critical error.";
        document.getElementById('modal-btn-main').onclick = () => {
            modal.classList.add('hidden');
            this.startStageSequence(isWin ? GameLogic.state.level + 1 : GameLogic.state.level);
        };
        modal.classList.remove('hidden');
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        if (t) { t.innerText = msg; t.style.opacity = '1'; setTimeout(() => t.style.opacity = '0', 1500); }
    }
};
window.onload = () => MainController.init();
