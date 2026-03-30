// CYBER-SWEEP v8.0 | story.js | MULTI-SCRIPT & SKIP ENGINE
const StoryEngine = {
    // シナリオスクリプト定義
    scripts: {
        // ステージ1前のストーリー (船内衝突〜扉前)
        stage1: [
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
            { bg: "door", speaker: "ビット333", text: "宇宙船の崩壊、進行中。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake" },
            { bg: "door", speaker: "パルス", text: "あー、やるしかないか。", pulse: "anxious", bit: "confused", tail: "right", color: "pink" }
        ],
        // ステージ2前のストーリー (格納庫 wing.png)
        stage2: [
            { bg: "wing", speaker: "パルス", text: "よかった、脱出機は無事ね！", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "真ん中のO-559が燃料も入ってます。", pulse: "anxious", bit: "smile", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "パルス", text: "さっすがビット！ よおし・・・", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "wing", speaker: "パルス", text: "・・・コクピット、開かないんだけど。", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "どうやらパスコードが設定されているようです。", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "ビット333", text: "宇宙船崩壊まであと5分。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake" },
            { bg: "wing", speaker: "パルス", text: "わわっ！ 早く開けてよ！", pulse: "surprised", bit: "confused", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "非常に申し訳ないのですが、これも・・・", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "パルス", text: "ああもう、わかったわよ、いくわよ！", pulse: "angry", bit: "calm", tail: "right", color: "pink" }
        ]
    },

    currentScript: [],
    currentIndex: 0,
    isTyping: false,
    typingTimer: null,
    fullText: "",
    onComplete: null,

    init() {
        document.getElementById('dialogue-container').onclick = () => this.handleDialogueClick();
        document.getElementById('adv-skip-btn').onclick = (e) => {
            e.stopPropagation(); // 親要素のクリックイベント（会話送り）を防止
            this.skipStory();
        };
    },

    // 会話開始 (スクリプト名を指定)
    play(scriptKey, completeCallback) {
        this.currentScript = this.scripts[scriptKey];
        this.currentIndex = 0;
        this.onComplete = completeCallback;
        
        // 最初の表示
        if (scriptKey === 'stage1') {
            this.startAlert演出(() => this.next());
        } else {
            this.next();
        }
    },

    // 船内衝撃演出 (ステージ1開始時のみ)
    startAlert演出(callback) {
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('adventure-viewport');
        document.getElementById('adv-bg').style.backgroundImage = "url('img/inship.png')";
        overlay.style.display = 'block';
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage');
        setTimeout(() => {
            overlay.style.display = 'none';
            win.classList.remove('shake-scene');
            callback();
        }, 1200);
    },

    handleDialogueClick() {
        if(this.isTyping) {
            clearInterval(this.typingTimer);
            document.getElementById('dialogue-text').innerHTML = this.fullText;
            this.isTyping = false;
        } else {
            this.next();
        }
    },

    next() {
        if(this.currentIndex >= this.currentScript.length) {
            this.onComplete();
            return;
        }
        const data = this.currentScript[this.currentIndex];
        this.updateUI(data);
        this.currentIndex++;
    },

    skipStory() {
        clearInterval(this.typingTimer);
        this.onComplete();
    },

    updateUI(data) {
        const advBg = document.getElementById('adv-bg');
        advBg.style.backgroundImage = `url("img/${data.bg}.png")`;
        advBg.style.opacity = 0.6;

        if (data.special === "shake") {
            const win = document.getElementById('adventure-viewport');
            win.classList.add('shake-scene');
            SoundEngine.playSFX('damage');
            setTimeout(() => win.classList.remove('shake-scene'), 800);
        }

        const label = document.getElementById('speaker-label');
        const tail = document.getElementById('speaker-tail');
        const color = data.color === "pink" ? "var(--neon-pink)" : "var(--neon-blue)";
        
        label.innerText = data.speaker;
        label.style.backgroundColor = color;
        label.style.borderColor = color;
        tail.style.left = data.tail === "right" ? "calc(50% + 50px)" : "calc(50% - 50px)";
        tail.style.borderTopColor = color;

        this.updateSprites(data);
        this.typeText(data.text, data.color);
    },

    typeText(text, colorType) {
        this.isTyping = true;
        this.fullText = text.replace(/\n/g, '<br>');
        const el = document.getElementById('dialogue-text');
        el.style.color = colorType === "pink" ? "var(--pink-txt)" : "var(--cyan-txt)";
        el.innerHTML = '';
        let i = 0;
        this.typingTimer = setInterval(() => {
            if (text[i] === '\n') el.innerHTML += '<br>'; else el.innerHTML += text[i];
            i++;
            if(i >= text.length) { clearInterval(this.typingTimer); this.isTyping = false; }
        }, 40);
    },

    updateSprites(data) {
        const bMap = { calm: [0,0], smile: [1,0], angry: [2,0], confused: [0,1], tired: [1,1] };
        const b = bMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${b[0]*180}px -${b[1]*180}px`;
        const pMap = { calm:[0,0], anxious:[1,0], angry:[2,0], cry:[0,1], smile:[1,1], blush:[2,1], surprised:[0,2] };
        const p = pMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${p[0]*180}px -${p[1]*180}px`;
    }
};
