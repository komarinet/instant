// CYBER-SWEEP v7.0 | story.js | DIALOGUE ENGINE
const StoryEngine = {
    // 会話データ：小惑星衝突後〜扉前でやるしかないかまで
    dialogueData: [
        // ◯ 船内 (inship.png)
        { bg: "inship", speaker: "パルス", text: "わっ、なになに？", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "宇宙船が小惑星にあたりました。", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "えっ！？大変じゃない！", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "パルス", text: "どうするの！？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "脱出を推奨します。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "す、推奨って・・・", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "パルス", text: "もし、脱出しなかったら？", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
        { bg: "inship", speaker: "ビット333", text: "生命存続不能の可能性、100%。", pulse: "surprised", bit: "calm", tail: "left", color: "cyan" },
        { bg: "inship", speaker: "パルス", text: "ダメじゃない！逃げなきゃ！", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },

        // ◯ 扉前 (door.png) に切り替え
        { bg: "door", speaker: "ビット333", text: "脱出機のある部屋はコチラです。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
        { bg: "door", speaker: "ビット333", text: "・・・あれ？", pulse: "surprised", bit: "confused", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "どうしたの？", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "扉が開きません。", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "あんたねぇ！AIなんでしょ？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
        { bg: "door", speaker: "ビット333", text: "人が回答する形式のみ受け付けているようです。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
        { bg: "door", speaker: "パルス", text: "なんて面倒な仕様なの！", pulse: "angry", bit: "calm", tail: "right", color: "pink" },

        // 揺れ・ビープ音 (JS側で演出)
        { bg: "door", speaker: "ビット333", text: "宇宙船の崩壊、進行中。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake_and_beep" },
        { bg: "door", speaker: "パルス", text: "あー、やるしかないか。", pulse: "anxious", bit: "confused", tail: "right", color: "pink" }
    ],
    
    currentDialogueIndex: 0,
    isTyping: false,
    typingTimer: null,
    fullText: "",
    onComplete: null, // 会話完了後のコールバック (MainController.jsで設定)

    // 会話エンジン初期化
    init() {
        // 会話ウインドウのクリック処理
        document.getElementById('dialogue-container').onclick = () => this.handleDialogueClick();
    },

    // 会話を開始
    startConversation(completeCallback) {
        this.currentDialogueIndex = 0;
        this.onComplete = completeCallback;
        // 船内シーン初期化 (アラート演出)
        this.startInteriorAlert(() => {
            this.nextDialogue();
        });
    },

    // 船内衝撃アラート演出
    startInteriorAlert(callback) {
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('adventure-viewport');
        const advBg = document.getElementById('adv-bg');
        
        // 背景を船内に設定
        advBg.style.backgroundImage = "url('img/inship.png')";
        advBg.style.opacity = 0; // フェードイン用

        // 演出開始
        overlay.style.display = 'block';
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage'); // Beep代わりに衝突音

        // 立ち絵を表示 (まだ動かさない)
        this.setSpritesHidden(false);

        setTimeout(() => {
            overlay.style.display = 'none';
            win.classList.remove('shake-scene');
            advBg.style.opacity = 0.6; // 背景表示
            callback(); // 会話開始
        }, 1500);
    },

    // クリック処理 (タイピング全文表示 or 次へ)
    handleDialogueClick() {
        if(this.isTyping) {
            // タイピング中なら強制終了して全文表示
            clearInterval(this.typingTimer);
            const el = document.getElementById('dialogue-text');
            el.innerHTML = this.fullText; // 改行対応のためinnerHTML
            this.isTyping = false;
        } else {
            // 次のセリフへ
            this.nextDialogue();
        }
    },

    // 次のセリフを表示
    nextDialogue() {
        if(this.currentDialogueIndex >= this.dialogueData.length) {
            this.onComplete(); // 会話完了
            return;
        }

        const data = this.dialogueData[this.currentDialogueIndex];
        
        // 背景の切り替えチェック
        this.checkBackground(data.bg);
        
        // スペシャル演出チェック (振動音など)
        if (data.special === "shake_and_beep") {
            this.playSpecialEffect();
        }

        this.updateDialogueUI(data); // 名前ラベル、尻尾、色の更新
        this.updateSprites(data);    // 立ち絵の更新
        this.typeText(data.text);    // テキスト表示
        this.currentDialogueIndex++;
    },

    // 背景切り替え
    checkBackground(bgName) {
        const advBg = document.getElementById('adv-bg');
        const currentBg = advBg.style.backgroundImage;
        const newBg = `url("img/${bgName}.png")`;
        if (currentBg !== newBg) {
            advBg.style.backgroundImage = newBg;
        }
    },

    // スペシャル演出：振動音と画面揺れ
    playSpecialEffect() {
        const win = document.getElementById('adventure-viewport');
        win.classList.add('shake-scene');
        SoundEngine.playSFX('damage'); // 振動音
        setTimeout(() => {
            win.classList.remove('shake-scene');
        }, 800);
    },

    // テキストタイピング表示
    typeText(text) {
        this.isTyping = true;
        // 改行コード (\n) を <br> に変換
        this.fullText = text.replace(/\n/g, '<br>');
        const el = document.getElementById('dialogue-text');
        el.innerHTML = ''; // innerHTMLをリセット
        let i = 0;
        
        this.typingTimer = setInterval(() => {
            if (text[i] === '\n') {
                el.innerHTML += '<br>';
            } else {
                el.innerHTML += text[i];
            }
            i++;
            if(i >= text.length) {
                clearInterval(this.typingTimer);
                this.isTyping = false;
            }
        }, 40); // タイピング速度 (ms)
    },

    // UI更新 (ネームタグ、尻尾、テキストカラー)
    updateDialogueUI(data) {
        const label = document.getElementById('speaker-label');
        const tail = document.getElementById('speaker-tail');
        const el = document.getElementById('dialogue-text');
        
        // 名前ラベルの色とテキスト
        const tagColor = data.color === "pink" ? "var(--neon-pink)" : "var(--neon-blue)";
        label.innerText = data.speaker;
        label.style.backgroundColor = tagColor;
        label.style.borderColor = tagColor;

        // 尻尾の位置と色
        const leftPos = data.tail === "right" ? "calc(50% + 40px)" : "calc(50% - 40px)";
        tail.style.left = leftPos;
        tail.style.borderTopColor = tagColor;

        // テキストの色
        const txtColor = data.color === "pink" ? "var(--pink-txt)" : "var(--cyan-txt)";
        el.style.color = txtColor;
    },

    // 立ち絵更新
    updateSprites(data) {
        // bit.png スプライト (3x2) -> 1コマ 180x180 (CSSで調整)
        const bitMap = { calm: [0,0], smile: [1,0], angry: [2,0], confused: [0,1], tired: [1,1] };
        const b = bitMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${b[0]*180}px -${b[1]*180}px`;

        // girl.png スプライト (3x3) -> 1コマ 180x180
        const pulseMap = { calm:[0,0], anxious:[1,0], angry:[2,0], cry:[0,1], smile:[1,1], blush:[2,1], surprised:[0,2] };
        const p = pulseMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${p[0]*180}px -${p[1]*180}px`;
    },

    // 立ち絵の表示/非表示
    setSpritesHidden(hidden) {
        const bit = document.getElementById('char-bit');
        const girl = document.getElementById('char-pulse');
        const op = hidden ? 0 : 1;
        bit.style.opacity = op;
        girl.style.opacity = op;
    }
};
