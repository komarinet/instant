// CYBER-SWEEP v6.0 | main.js | DIALOGUE ENGINE & MULTI-EXPLOSION
const MainController = {
    themes: {
        1: { blue: '#00f3ff', pink: '#ff00ff', name: "ALPHA SECTOR" },
        2: { blue: '#00ff41', pink: '#00ccff', name: "NEO-SHIBUYA" },
        3: { blue: '#ffff00', pink: '#ff0000', name: "VOID ZONE" },
        4: { blue: '#ff00ff', pink: '#ffffff', name: "GHOST NETWORK" },
        5: { blue: '#ff3300', pink: '#ff00ff', name: "CORE SERVER" }
    },

    dialogueData: [
        { speaker: "パルス", text: "わっ、なになに？", pulse: "surprised", bit: "smile" },
        { speaker: "ビット333", text: "宇宙船が小惑星にあたりました。", pulse: "anxious", bit: "calm" },
        { speaker: "パルス", text: "えっ！？大変じゃない！", pulse: "anxious", bit: "calm" },
        { speaker: "パルス", text: "どうするの！？", pulse: "angry", bit: "calm" },
        { speaker: "ビット333", text: "脱出を推奨します。", pulse: "anxious", bit: "smile" },
        { speaker: "パルス", text: "す、推奨って・・・", pulse: "anxious", bit: "calm" },
        { speaker: "パルス", text: "もし、脱出しなかったら？", pulse: "anxious", bit: "calm" },
        { speaker: "ビット333", text: "生命存続不能の可能性、100%。", pulse: "anxious", bit: "smile" },
        { speaker: "パルス", text: "ダメじゃない！逃げなきゃ！", pulse: "surprised", bit: "smile" }
    ],
    currentDialogue: 0,
    isTyping: false,

    init() {
        document.getElementById('start-btn').onclick = () => this.handleStart();
        document.getElementById('back-to-menu-btn').onclick = () => this.showScene('scene-select');
        document.getElementById('audio-toggle-btn').onclick = () => this.toggleAudio();
        document.getElementById('dialogue-container').onclick = () => this.nextDialogue();
        this.createStageSelect();
    },

    async handleStart() {
        const btn = document.getElementById('start-btn');
        btn.disabled = true; btn.innerText = "LOADING CORE...";
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
        
        // 3回爆発のシーケンス
        let count = 0;
        const interval = setInterval(() => {
            this.playRandomExplosion();
            count++;
            if(count >= 3) {
                clearInterval(interval);
                setTimeout(() => this.startInterior(), 1500);
            }
        }, 800);
    },

    playRandomExplosion() {
        const container = document.getElementById('exp-container');
        const exp = document.createElement('div');
        exp.className = 'explosion';
        // 船(160x?)に重なる位置にランダム配置
        const rx = 170 + (Math.random() * 80 - 40);
        const ry = 110 + (Math.random() * 40 - 20);
        exp.style.left = `${rx - 40}px`;
        exp.style.top = `${ry - 40}px`;
        container.appendChild(exp);
        exp.classList.add('bomb-play');
        SoundEngine.playSFX('damage');
        setTimeout(() => exp.remove(), 1000);
    },

    startInterior() {
        this.showScene('scene-interior');
        SoundEngine.playBGM('interior');
        
        // アラート演出
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('interior-window');
        overlay.style.display = 'block';
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage'); // Beep代わり
        
        setTimeout(() => {
            overlay.style.display = 'none';
            win.classList.remove('shake-scene');
            this.nextDialogue();
        }, 1200);
    },

    nextDialogue() {
        if(this.isTyping) return;
        if(this.currentDialogue >= this.dialogueData.length) {
            this.showScene('scene-select');
            return;
        }

        const data = this.dialogueData[this.currentDialogue];
        document.getElementById('speaker-name').innerText = data.speaker;
        this.updateSprites(data);
        this.typeText(data.text);
        this.currentDialogue++;
    },

    typeText(text) {
        this.isTyping = true;
        const el = document.getElementById('dialogue-text');
        el.innerText = '';
        let i = 0;
        const timer = setInterval(() => {
            el.innerText += text[i];
            i++;
            if(i >= text.length) {
                clearInterval(timer);
                this.isTyping = false;
            }
        }, 50);
    },

    updateSprites(data) {
        // bit.png スプライト切り替え
        const bitMap = { calm: [0,0], smile: [0,0], angry: [2,0] }; // bitの各表情座標
        const bitPos = bitMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${bitPos[0]*150}px -${bitPos[1]*200}px`;

        // girl.png スプライト切り替え
        const pulseMap = { calm: [0,0], anxious: [1,0], angry: [2,0], cry: [0,1], smile: [1,1], blush: [2,1], surprised: [0,2] };
        const pPos = pulseMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${pPos[0]*150}px -${pPos[1]*200}px`;
    },

    createStageSelect() {
        const container = document.getElementById('stage-buttons');
        container.innerHTML = '';
        Object.entries(this.themes).forEach(([lvl, data]) => {
            const btn = document.createElement('button');
            btn.className = 'cyber-panel p-4 rounded-lg font-bold text-left hover:bg-gray-800 active:scale-95 transition-all';
            btn.innerHTML = `<span class="text-[9px]" style="color:${data.blue}">LEVEL ${lvl}</span><br><span class="text-sm">${data.name}</span>`;
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

    toggleAudio() {
        const m = SoundEngine.toggleMute();
        document.getElementById('audio-toggle-btn').innerText = `Sound: ${m ? 'OFF' : 'ON'}`;
    }
};
window.onload = () => MainController.init();
