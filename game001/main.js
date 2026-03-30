// CYBER-SWEEP v10.0 | main.js | MASTER PROGRESSION
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
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        StoryEngine.init();
        this.setupScrollSync();
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; btn.innerText = "SYNCING CORE...";
        try {
            await this.preload(['img/ship.png','img/space02.png','img/bomb.png','img/bit.png','img/girl.png','img/inship.png','img/door.png','img/wing.png','img/cockpit0.png','img/cockpit.png','img/uni.png','img/waku.png']);
            this.startStageSequence(1);
        } catch(e) { this.showScene('scene-select'); }
        finally { btn.disabled = false; btn.innerText = "INITIALIZE CONNECTION"; }
    },

    async preload(urls) {
        const ps = urls.map(u => new Promise(res => {
            const i = new Image(); i.src = u; i.onload = () => i.decode ? i.decode().then(res) : res(); i.onerror = res;
        }));
        return Promise.all(ps);
    },

    showScene(id) {
        document.querySelectorAll('.scene').forEach(s => s.classList.replace('scene-show', 'scene-hidden'));
        document.getElementById(id).classList.replace('scene-hidden', 'scene-show');
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
        } else {
            this.launchGame(lvl);
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
        const exp = document.createElement('div');
        exp.className = 'explosion';
        const rx = 170 + (Math.random() * 80 - 40);
        const ry = 100 + (Math.random() * 30 - 15);
        exp.style.left = `${rx - 40}px`; exp.style.top = `${ry - 40}px`;
        container.appendChild(exp);
        exp.classList.add('bomb-play');
        SoundEngine.playSFX('damage');
        setTimeout(() => exp.remove(), 1000);
    },

    launchGame(lvl) {
        const theme = this.themes[lvl];
        document.documentElement.style.setProperty('--neon-blue', theme.blue);
        document.documentElement.style.setProperty('--neon-pink', theme.pink);
        document.getElementById('game-title-text').innerText = theme.name;
        document.getElementById('level-display').innerText = `LVL.0${lvl}`;
        this.showScene('scene-game');
        GameLogic.init(lvl);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        container.innerHTML = '';
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-5 rounded-xl font-bold text-left active:scale-95 transition-all';
            btn.innerHTML = `<span class="text-[10px] font-orbitron" style="color:${data.blue}">SECTOR ${String(lvl).padStart(2,'0')}</span><br><span class="text-sm tracking-wide uppercase">${data.name}</span>`;
            btn.onclick = () => this.startStageSequence(parseInt(lvl));
            container.appendChild(btn);
        });
    },

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'OFF' : 'ON'}`;
    },

    setupScrollSync() {
        const cont = document.getElementById('game-container');
        cont.onscroll = () => {
            const th = 5;
            document.getElementById('edge-top').classList.toggle('edge-active', cont.scrollTop > th);
            document.getElementById('edge-bottom').classList.toggle('edge-active', cont.scrollTop + cont.clientHeight < cont.scrollHeight - th);
        };
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        const modalBtn = document.getElementById('modal-btn-main');
        if (isWin) {
            document.getElementById('modal-title').innerText = "DECRYPTED";
            document.getElementById('modal-desc').innerText = "Matrix break success. Advancing to next node.";
            modalBtn.innerText = "CONTINUE CONNECTION";
            modalBtn.onclick = () => { modal.classList.add('hidden'); this.startStageSequence(GameLogic.state.level + 1); };
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
