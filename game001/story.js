// CYBER-SWEEP v7.1 | story.js | LABEL POSITION FIXED
const StoryEngine = {
    dialogueData: [
        { bg: "inship", speaker: "パルス", text: "わっ、なになに？", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "宇宙船が小惑星にあたりました。", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "えっ！？大変じゃない！", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "パルス", text: "どうするの！？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "脱出を推奨します。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "す、推奨って・・・", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "パルス", text: "もし、脱出しなかったら？", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "生命存続不能の可能性、100%。", pulse: "surprised", bit: "calm", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "ダメじゃない！逃げなきゃ！", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "脱出機のある部屋はコチラです。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
        { bg: "door", speaker: "ビット333", text: "・・・あれ？", pulse: "surprised", bit: "confused", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "どうしたの？", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "扉が開きません。", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "あんたねぇ！AIなんでしょ？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "人が回答する形式のみ受け付けているようです。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "なんて面倒な仕様なの！", pulse: "angry", bit: "calm", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "宇宙船の崩壊、進行中。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake_and_beep" },
        { bg: "door", speaker: "パルス", text: "あー、やるしかないか。", pulse: "anxious", bit: "confused", tail: "right", color: "pink" }
    ],
    
    currentDialogueIndex: 0,
    isTyping: false,
    typingTimer: null,
    fullText: "",
    onComplete: null,

    init() {
        document.getElementById('dialogue-container').onclick = () => this.handleDialogueClick();
    },

    startConversation(completeCallback) {
        this.currentDialogueIndex = 0;
        this.onComplete = completeCallback;
        this.startInteriorAlert(() => {
            this.nextDialogue();
        });
    },

    startInteriorAlert(callback) {
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('adventure-viewport');
        const advBg = document.getElementById('adv-bg');
        
        advBg.style.backgroundImage = "url('img/inship.png')";
        advBg.style.opacity = 0;
        overlay.style.display = 'block';
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage');

        this.setSpritesHidden(false);

        setTimeout(() => {
            overlay.style.display = 'none';
            win.classList.remove('shake-scene');
            advBg.style.opacity = 0.6;
            callback();
        }, 1500);
    },

    handleDialogueClick() {
        if(this.isTyping) {
            clearInterval(this.typingTimer);
            document.getElementById('dialogue-text').innerHTML = this.fullText;
            this.isTyping = false;
        } else {
            this.nextDialogue();
        }
    },

    nextDialogue() {
        if(this.currentDialogueIndex >= this.dialogueData.length) {
            this.onComplete();
            return;
        }

        const data = this.dialogueData[this.currentDialogueIndex];
        this.checkBackground(data.bg);
        if (data.special === "shake_and_beep") this.playSpecialEffect();

        this.updateDialogueUI(data);
        this.updateSprites(data);
        this.typeText(data.text);
        this.currentDialogueIndex++;
    },

    checkBackground(bgName) {
        const advBg = document.getElementById('adv-bg');
        advBg.style.backgroundImage = `url("img/${bgName}.png")`;
    },

    playSpecialEffect() {
        const win = document.getElementById('adventure-viewport');
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage');
        setTimeout(() => win.classList.remove('shake-scene'), 800);
    },

    typeText(text) {
        this.isTyping = true;
        this.fullText = text.replace(/\n/g, '<br>');
        const el = document.getElementById('dialogue-text');
        el.innerHTML = '';
        let i = 0;
        this.typingTimer = setInterval(() => {
            if (text[i] === '\n') el.innerHTML += '<br>'; else el.innerHTML += text[i];
            i++;
            if(i >= text.length) { clearInterval(this.typingTimer); this.isTyping = false; }
        }, 40);
    },

    updateDialogueUI(data) {
        const label = document.getElementById('speaker-label');
        const tail = document.getElementById('speaker-tail');
        const el = document.getElementById('dialogue-text');
        
        const tagColor = data.color === "pink" ? "var(--neon-pink)" : "var(--neon-blue)";
        label.innerText = data.speaker;
        label.style.backgroundColor = tagColor;
        label.style.borderColor = tagColor;

        // 尻尾を名前ラベルに追随。反転しているためborder-top-colorを更新
        tail.style.left = data.tail === "right" ? "calc(50% + 50px)" : "calc(50% - 50px)";
        tail.style.borderTopColor = tagColor;

        el.style.color = data.color === "pink" ? "var(--pink-txt)" : "var(--cyan-txt)";
    },

    updateSprites(data) {
        const bitMap = { calm: [0,0], smile: [1,0], angry: [2,0], confused: [0,1], tired: [1,1] };
        const b = bitMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${b[0]*180}px -${b[1]*180}px`;

        const pulseMap = { calm:[0,0], anxious:[1,0], angry:[2,0], cry:[0,1], smile:[1,1], blush:[2,1], surprised:[0,2] };
        const p = pulseMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${p[0]*180}px -${p[1]*180}px`;
    },

    setSpritesHidden(hidden) {
        const op = hidden ? 0 : 1;
        document.getElementById('char-bit').style.opacity = op;
        document.getElementById('char-pulse').style.opacity = op;
    }
};
