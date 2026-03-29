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
        const pText = document.querySelector('#prologue-text h2');

        setTimeout(() => {
            ship.classList.add('shake');
            const rect = ship.getBoundingClientRect();
            exp.style.left = `${rect.left - 50}px`;
            exp.style.top = `${rect.top - 50}px`;
            exp.classList.add('bomb-play');
            SoundEngine.playSFX('damage');
            pText.classList.replace('opacity-0', 'opacity-100');
        }, 2000);

        setTimeout(() => this.showScene('scene-select'), 5000);
    },

    createStageSelect() {
        const container = document.querySelector('#scene-select div');
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800';
            btn.innerHTML = `<span class="text-[10px]" style="color:${data.blue}">LEVEL ${lvl}</span><br>${data.name}`;
            btn.onclick = () => {
                this.applyTheme(lvl);
                this.showScene('scene-game');
                GameLogic.init(parseInt(lvl));
            };
            container.appendChild(btn);
        });
    },

    toggleScan() {
        if (GameLogic.state.energy >= GameLogic.config.scanCost) {
            GameLogic.state.isScanning = !GameLogic.state.isScanning;
            document.getElementById('scan-btn').classList.toggle('active-mode', GameLogic.state.isScanning);
            this.showToast(GameLogic.state.isScanning ? "SCAN READY" : "SCAN CANCELLED");
        }
    },

    toggleFlag() {
        GameLogic.state.flagMode = !GameLogic.state.flagMode;
        document.getElementById('flag-mode-btn').classList.toggle('active-mode', GameLogic.state.flagMode);
        this.showToast(GameLogic.state.flagMode ? "MARK MODE: ON" : "MARK MODE: OFF");
    },

    toggleAudio() {
        const muted = SoundEngine.toggleMute();
        const btn = document.getElementById('audio-toggle-btn');
        btn.innerText = `SOUND: ${muted ? 'OFF' : 'ON'}`;
        btn.style.borderColor = muted ? 'var(--neon-pink)' : 'var(--neon-blue)';
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const btn = document.getElementById('modal-btn-main');

        if (isWin) {
            title.innerText = "SECTOR CLEARED";
            desc.innerText = "セキュリティ層の突破に成功しました。";
            btn.innerText = "セクター選択へ";
            btn.onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        } else {
            title.innerText = "CRITICAL ERROR";
            desc.innerText = "システムが損壊しました。リブートが必要です。";
            btn.innerText = "再試行";
            btn.onclick = () => { modal.classList.add('hidden'); GameLogic.init(GameLogic.state.level); };
        }
        modal.classList.remove('hidden');
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg; t.style.opacity = '1';
        setTimeout(() => t.style.opacity = '0', 2000);
    },

    setupScrollSync() {
        const cont = document.getElementById('game-container');
        cont.onscroll = () => {
            const threshold = 5;
            document.getElementById('edge-top').classList.toggle('edge-active', cont.scrollTop > threshold);
            document.getElementById('edge-bottom').classList.toggle('edge-active', cont.scrollTop + cont.clientHeight < cont.scrollHeight - threshold);
            document.getElementById('edge-left').classList.toggle('edge-active', cont.scrollLeft > threshold);
            document.getElementById('edge-right').classList.toggle('edge-active', cont.scrollLeft + cont.clientWidth < cont.scrollWidth - threshold);
        };
    }
};

window.onload = () => MainController.init();
