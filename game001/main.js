// CYBER-SWEEP v5.3 | main.js
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    init() {
        document.getElementById('start-btn').onclick = () => this.startPrologue();
        document.getElementById('scan-btn').onclick = () => this.toggleScan();
        document.getElementById('flag-mode-btn').onclick = () => this.toggleFlag();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        
        this.createStageSelect();
        this.setupScrollSync();
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

        setTimeout(() => ship.classList.add('shake-prologue'), 1000);
        setTimeout(() => {
            exp.style.display = 'block';
            exp.style.left = "calc(50% - 150px)"; exp.style.bottom = "calc(30% - 50px)";
            exp.classList.add('bomb-play');
            texts.forEach(t => t.style.opacity = '1');
            SoundEngine.playSFX('damage');
        }, 1500);

        setTimeout(() => this.showScene('scene-select'), 4500);
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 transition-all';
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
    },

    setupScrollSync() {
        const cont = document.getElementById('game-container');
        cont.onscroll = () => {
            document.getElementById('edge-top').classList.toggle('edge-active', cont.scrollTop > 5);
            document.getElementById('edge-bottom').classList.toggle('edge-active', cont.scrollTop + cont.clientHeight < cont.scrollHeight - 5);
        };
    }
};

window.onload = () => MainController.init();
