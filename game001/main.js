// CYBER-SWEEP v11.8 | main.js
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#fff200', pink: '#00f3ff', name: "SCANNERA GATE" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        console.log("System Initialization...");
        
        // 1. 各ボタンへのイベント登録 (ID間違いを徹底チェック)
        const startBtn = document.getElementById('start-btn');
        const selectBtn = document.getElementById('select-scene-btn');
        const backTitleBtn = document.getElementById('back-to-title-btn');
        
        if(startBtn) startBtn.onclick = () => this.handleStart();
        if(selectBtn) selectBtn.onclick = () => {
            this.createStageSelect(); // ボタンを再生成
            this.showScene('scene-select');
        };
        if(backTitleBtn) backTitleBtn.onclick = () => this.showScene('scene-title');

        // ゲーム中ボタン
        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        
        // 初期状態：ステージ選択ボタンを作っておく
        this.createStageSelect();
        
        StoryEngine.init();
        this.setupScrollSync();
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
            i.onload = () => res(); i.onerror = () => { console.warn("Asset missing:", u); res(); };
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        console.log("Switching scene to:", id);
        // 全シーンを .hidden (display:none) にし、対象だけ .scene-show にする
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
        // 船体に重なるランダム位置
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

        this.showScene('scene-game');
        GameLogic.init(lvl);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        if (!container) return;
        container.innerHTML = ''; // 一旦クリア
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-5 rounded-xl font-bold text-left active:scale-95 transition-all';
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
            document.getElementById('scan-btn').style.color = GameLogic.state.isScanning ? "black" : "";
        }
    },

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'OFF' : 'ON'}`;
    },

    setupScrollSync() {
        const cont = document.getElementById('game-container');
        if (!cont) return;
        cont.onscroll = () => {
            const th = 5;
            document.getElementById('edge-top').classList.toggle('edge-active', cont.scrollTop > th);
            document.getElementById('edge-bottom').classList.toggle('edge-active', cont.scrollTop + cont.clientHeight < cont.scrollHeight - th);
        };
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').innerText = isWin ? "DECRYPTED" : "HALT";
        document.getElementById('modal-desc').innerText = isWin ? "Advanced matrix break success." : "Critical error detected.";
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
// 最後に確実に初期化
window.onload = () => MainController.init();
