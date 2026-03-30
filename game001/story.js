// CYBER-SWEEP v9.0 | story.js | BLACK-OUT BACKGROUND UPDATE & COCKPIT SCENARIO
const StoryEngine = {
    // シナリオスクリプト定義
    scripts: {
        // ステージ1前 (衝突〜扉前)
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
        // ステージ2前 (格納庫)
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
        ],
        // ステージ3前 (コクピットcockpit0.png -> cockpit.png)
        stage3: [
            // cockpit0 (電源オフ・明るさ暗)
            { bg: "cockpit0", brightness: "dark", speaker: "パルス", text: "うわ、暗い", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "dark", speaker: "ビット333", text: "電源を入れましょう", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            
            // cockpit0 (白い光がさし、黒いフィルター除去。 -> brightnessをデフォルトに)
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "・・・", pulse: "calm", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "light", speaker: "ビット333", text: "どうしましたか？", pulse: "calm", bit: "calm", tail: "left", color: "cyan" },
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "いや、てっきりコクピットもパスコードかかってるかと", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "light", speaker: "ビット333", text: "戦闘機のシステムは宇宙船とは別ですから", pulse: "smile", bit: "smile", tail: "left", color: "cyan" },
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "あー、よかった。じゃあ早速脱出しよう", pulse: "smile", bit: "calm", tail: "right", color: "pink" },

            // (画面が赤くなり振動とともに暗転 -> special: "alert_dark_shake")
            { bg: "cockpit0", brightness: "light", speaker: "", text: "", special: "alert_dark_shake" }, 

            // cockpit.png (自動的に暗転解除、Sprites表示、背景切り替え暗転が挟まる)
            { bg: "cockpit", speaker: "パルス", text: "ぎゃあああ！", pulse: "surprised", bit: "surprised", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "危険、危険！ 宇宙船崩壊の危険！", pulse: "surprised", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "んなことわかってるわよ！", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "パルス", text: "離陸するわよ！", pulse: "angry", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "お待ちください", pulse: "surprised", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "待てるわけないでしょ！", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "宇宙船のハッチが閉じています。離陸できません", pulse: "surprised", bit: "tired", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "宇宙船の・・・ハッチ！？", pulse: "surprised", bit: "tired", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "パルス", text: "ね、念のため聞くけど宇宙船のハッチは・・・", pulse: "cry", bit: "tired", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "宇宙船のパスコードがかかってます", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "ちくしょおおおお！", pulse: "angry", bit: "smile", tail: "right", color: "pink" }
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
            e.stopPropagation();
            this.skipStory();
        };
    },

    play(scriptKey, completeCallback) {
        this.currentScript = this.scripts[scriptKey];
        this.currentIndex = 0;
        this.onComplete = completeCallback;
        
        // 最初の表示
        if (scriptKey === 'stage1') {
            this.startAlert演出(() => this.next());
        } else {
            // ステージ3など、明るさ調整が必要な場合の初期化
            const advBg = document.getElementById('adv-bg');
            advBg.style.filter = "brightness(1.0)";
            document.getElementById('scene-adventure').style.opacity = 1;
            this.setSpritesHidden(false);
            this.next();
        }
    },

    startAlert演出(callback) {
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('adventure-viewport');
        document.getElementById('adv-bg').style.backgroundImage = "url('img/inship.png')";
        // アラート（点滅ではない）
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
        
        // 演出からの復帰チェック
        const advScene = document.getElementById('scene-adventure');
        if (advScene.style.opacity === "0") {
            advScene.style.opacity = 1;
            this.setSpritesHidden(false);
        }

        const data = this.currentScript[this.currentIndex];
        
        // 背景の更新と明るさ（暗転を挟む）
        this.fadeBackgroundUpdate(data.bg, data.brightness, () => {
            this.updateUI(data); // テキストや立ち絵
            this.currentIndex++;
        });
    },

    // 背景切り替え時の暗転フェード
    fadeBackgroundUpdate(bgName, brightness, callback) {
        const advBg = document.getElementById('adv-bg');
        const blackOut = document.getElementById('black-out-overlay');
        const currentBg = advBg.style.backgroundImage;
        const newBg = `url("img/${bgName}.png")`;

        if (currentBg !== newBg) {
            // 背景が変わる場合は暗転させる
            blackOut.classList.add('fade-black');
            
            // 完全に黒くなったら画像を切り替える
            setTimeout(() => {
                advBg.style.backgroundImage = newBg;
                this.applyBrightness(advBg, brightness);
                // フェードイン
                blackOut.classList.remove('fade-black');
                // フェードイン完了後にコールバック（次の処理へ）
                setTimeout(callback, 300); 
            }, 300);
        } else {
            // 背景が変わらない場合は、明るさだけ適用してそのまま次に進む
            this.applyBrightness(advBg, brightness);
            callback();
        }
    },

    // 明るさフィルターの適用
    applyBrightness(el, brightness) {
        if (brightness === "dark") {
            el.classList.add('brightness-20');
            el.classList.remove('brightness-100');
        } else {
            el.classList.add('brightness-100');
            el.classList.remove('brightness-20');
        }
    },

    skipStory() {
        clearInterval(this.typingTimer);
        // コクピット演出のクリーンアップ
        const overlay = document.getElementById('interior-alert-overlay');
        overlay.classList.remove('alert-blink-red');
        document.getElementById('adventure-viewport').classList.remove('shake-scene-heavy');
        this.onComplete();
    },

    updateUI(data) {
        // スペシャル演出
        if (data.special === "shake") {
            const win = document.getElementById('adventure-viewport');
            win.classList.add('shake-scene');
            SoundEngine.playSFX('damage');
            setTimeout(() => win.classList.remove('shake-scene'), 800);
        } else if (data.special === "alert_dark_shake") {
            // コクピット衝撃演出 (赤点滅 -> 振動音と衝撃 -> 暗転)
            this.playAlertDarkShake();
            // 演出だけのコマなので、テキスト等は表示せずにタイピングフラグだけ解除
            this.isTyping = false;
            return;
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

    // コクピット衝撃演出：赤点滅 -> 振動音と衝撃 -> 暗転
    playAlertDarkShake() {
        const win = document.getElementById('adventure-viewport');
        const overlay = document.getElementById('interior-alert-overlay');
        
        this.isTyping = true; // 演出中はクリック無効

        // 1. 赤く点滅
        overlay.style.display = 'block';
        overlay.classList.add('alert-blink-red');
        
        // 2. 振動音と振動
        SoundEngine.playSFX('damage'); // 衝撃音
        win.classList.add('shake-scene-heavy');
        
        // 3. 暗転 (シーン全体をフェードアウト)
        setTimeout(() => {
            document.getElementById('scene-adventure').style.opacity = 0;
            // 立ち絵も非表示に (暗転中は見えないため)
            this.setSpritesHidden(true);
        }, 1200);
        
        // 4. クリーンアップして次のクリックを待つ
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('alert-blink-red');
            win.classList.remove('shake-scene-heavy');
            this.isTyping = false; // クリック有効化
        }, 2000);
    },

    typeText(text, colorType) {
        if (!text) return; // テキストがないコマ（演出用）はスキップ

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
    },

    setSpritesHidden(hidden) {
        const op = hidden ? 0 : 1;
        document.getElementById('char-bit').style.opacity = op;
        document.getElementById('char-pulse').style.opacity = op;
    }
};
