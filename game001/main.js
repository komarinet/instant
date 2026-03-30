// CYBER-SWEEP v6.2 | main.js | TAIL POSITIONING & NAMETAG COLOR ENGINE
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    // 会話データ：尻尾の位置、ネームタグの色を追加
    dialogueData: [
        { speaker: "パルス", text: "わっ、なになに？", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
        { speaker: "ビット333", text: "宇宙船が小惑星にあたりました。", pulse: "anxious", bit: "confused", tail: "left", color: "シアン" },
        { speaker: "パルス", text: "えっ！？大変じゃない！", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { speaker: "パルス", text: "どうするの！？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
        { speaker: "ビット333", text: "脱出を推奨します。", pulse: "anxious", bit: "tired", tail: "left", color: "シアン" },
        { speaker: "パルス", text: "す、推奨って・・・", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
        { speaker: "パルス", text: "もし、脱出しなかったら？", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { speaker: "ビット333", text: "生命存続不能の可能性、100%。", pulse: "surprised", bit: "calm", tail: "left", color: "シアン" },
        { speaker: "パルス", text: "ダメじゃない！逃げなきゃ！", pulse: "surprised", bit: "calm", tail: "right", color: "pink" }
    ],
    currentDialogue: 0,
    isTyping: false,
    typingTimer: null,
    fullText: "",

    init() {
        document.getElementById('start-btn').onclick = () => this.handleStart();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        document.getElementById('dialogue-container').onclick = () => this.handleDialogueClick();
        this.createStageSelect();
        this.setupScrollSync();
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; btn.innerText = "LOADING PROTOCOL...";
        try {
            await this.preload(['img/ship.png','img/space02.png','img/bomb.png','img/bit.png','img/girl.png','img/inship.png']);
            this.startPrologue();
        } catch(e) { this.showScene('scene-select'); }
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

    startPrologue() {
        SoundEngine.init();
        this.showScene('scene-prologue');
        let count = 0;
        const interval = setInterval(() => {
            this.playRandomExplosion();
            count++;
            if(count >= 3) {
                clearInterval(interval);
                setTimeout(() => this.startInterior(), 1800);
            }
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

    startInterior() {
        this.showScene('scene-interior');
        SoundEngine.playBGM('interior');
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('interior-window');
        overlay.style.display = 'block';
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage');
        setTimeout(() => {
            overlay.style.display = 'none';
            win.classList.remove('shake-scene');
            this.nextDialogue();
        }, 1500);
    },

    handleDialogueClick() {
        if(this.isTyping) {
            clearInterval(this.typingTimer);
            document.getElementById('dialogue-text').innerText = this.fullText;
            this.isTyping = false;
        } else {
            this.nextDialogue();
        }
    },

    nextDialogue() {
        if(this.currentDialogue >= this.dialogueData.length) {
            this.showScene('scene-select');
            return;
        }
        const data = this.dialogueData[this.currentDialogue];
        this.updateDialogueUI(data); // 尻尾、色、名前の更新
        this.updateSprites(data);
        this.typeText(data.text, data.color);
        this.currentDialogue++;
    },

    // 尻尾の位置とタグの色、テキストカラーを更新
    updateDialogueUI(data) {
        const label = document.getElementById('speaker-label');
        const tail = document.getElementById('speaker-tail');
        const txtColor = data.color === "pink" ? "var(--pink-txt)" : "var(--cyan-txt)";
        const tagColor = data.color === "pink" ? "var(--neon-pink)" : "var(--neon-blue)";

        // 名前とタグ色
        label.innerText = data.speaker;
        label.style.backgroundColor = tagColor;
        label.style.borderColor = tagColor;

        // 尻尾の位置調整。ラベルの中心を基準に左右へ
        if (data.tail === "right") {
            tail.style.left = "calc(50% + 40px)"; // 右にずらす
            tail.style.borderTopColor = "var(--neon-pink)";
        } else {
            tail.style.left = "calc(50% - 40px)"; // 左にずらす
            tail.style.borderTopColor = "var(--neon-blue)";
        }

        // テキストのベースカラー
        document.getElementById('dialogue-text').style.color = txtColor;
    },

    typeText(text, color) {
        this.isTyping = true;
        this.fullText = text;
        const el = document.getElementById('dialogue-text');
        el.innerText = '';
        let i = 0;
        this.typingTimer = setInterval(() => {
            el.innerText += text[i];
            i++;
            if(i >= text.length) {
                clearInterval(this.typingTimer);
                this.isTyping = false;
            }
        }, 40);
    },

    updateSprites(data) {
        // bit.png (Confused顔、Tired顔を割り当て)
        const bitMap = { calm: [0,0], smile: [1,0], angry: [2,0], confused: [0,1], tired: [1,1] };
        const b = bitMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${b[0]*180}px -${b[1]*180}px`;

        // girl.png
        const pMap = { calm:[0,0], anxious:[1,0], angry:[2,0], cry:[0,1], smile:[1,1], blush:[2,1], surprised:[0,2] };
        const p = pMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${p[0]*180}px -${p[1]*180}px`;
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        container.innerHTML = '';
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-5 rounded-xl font-bold text-left hover:bg-gray-800 active:scale-95 transition-all';
            btn.innerHTML = `<span class="text-[10px] font-orbitron" style="color:${data.blue}">SECTOR ${String(lvl).padStart(2,'0')}</span><br><span class="text-sm tracking-wide">${data.name}</span>`;
            btn.onclick = () => {
                document.documentElement.style.setProperty('--neon-blue', data.blue);
                document.documentElement.style.setProperty('--neon-pink', data.pink);
                document.getElementById('game-title-text').innerText = data.name;
                document.getElementById('level-display').innerText = `LVL.0${lvl} / 05`;
                this.showScene('scene-game');
                GameLogic.init(parseInt(lvl));
            };
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
            document.getElementById('edge-left').classList.toggle('edge-active', cont.scrollLeft > th);
            document.getElementById('edge-right').classList.toggle('edge-active', cont.scrollLeft + cont.clientWidth < cont.scrollWidth - th);
        };
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg; t.style.opacity = '1';
        setTimeout(() => t.style.opacity = '0', 2000);
    },

    showModal(isWin) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').innerText = isWin ? "CLEARED" : "FAILED";
        document.getElementById('modal-desc').innerText = isWin ? "Data decrypted. Moving to next sector." : "Integrity lost. Rebooting system.";
        document.getElementById('modal-btn-main').onclick = () => { modal.classList.add('hidden'); this.showScene('scene-select'); };
        modal.classList.remove('hidden');
    }
};
window.onload = () => MainController.init();
