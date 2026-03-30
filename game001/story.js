// CYBER-SWEEP v11.7 | story.js
const StoryEngine = {
    scripts: {
        stage1: [
            { bg: "inship", speaker: "パルス", text: "わっ、なになに？", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "inship", speaker: "ビット333", text: "宇宙船が小惑星にあたりました。", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            { bg: "inship", speaker: "パルス", text: "えっ！？大変じゃない！\nどうするの！？", pulse: "cry", bit: "confused", tail: "right", color: "pink" },
            { bg: "inship", speaker: "ビット333", text: "脱出を推奨します。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan" },
            { bg: "inship", speaker: "パルス", text: "す、推奨って・・・\nもし脱出しなかったら？", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
            { bg: "inship", speaker: "ビット333", text: "生命存続不能の可能性、100%。", pulse: "surprised", bit: "calm", tail: "left", color: "cyan" },
            { bg: "inship", speaker: "パルス", text: "ダメじゃない！逃げなきゃ！", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "door", speaker: "ビット333", text: "脱出機のある部屋はコチラです。\n・・・あれ？", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            { bg: "door", speaker: "パルス", text: "どうしたの？", pulse: "anxious", bit: "confused", tail: "right", color: "pink" },
            { bg: "door", speaker: "ビット333", text: "扉が開きません。", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
            { bg: "door", speaker: "パルス", text: "あんたねぇ！AIなんでしょ？", pulse: "angry", bit: "confused", tail: "right", color: "pink" },
            { bg: "door", speaker: "ビット333", text: "人が回答する形式のみ受け付けているようです。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
            { bg: "door", speaker: "パルス", text: "なんて面倒な仕様なの！", pulse: "angry", bit: "calm", tail: "right", color: "pink" },
            { bg: "door", speaker: "ビット333", text: "宇宙船の崩壊、進行中。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake" },
            { bg: "door", speaker: "パルス", text: "あー、やるしかないか。", pulse: "anxious", bit: "confused", tail: "right", color: "pink" }
        ],
        stage2: [
            { bg: "wing", speaker: "パルス", text: "よかった、脱出機は無事ね！", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "真ん中のO-559が燃料も入ってます。", pulse: "anxious", bit: "smile", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "パルス", text: "さっすがビット！ よおし・・・\n・・・コクピット、開かないんだけど。", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "どうやらパスコードが設定されているようです。", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "ビット333", text: "宇宙船崩壊まであと5分。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan", special: "shake" },
            { bg: "wing", speaker: "パルス", text: "わわっ！ 早く開けてよ！", pulse: "surprised", bit: "confused", tail: "right", color: "pink" },
            { bg: "wing", speaker: "ビット333", text: "非常に申し訳ないのですが、これも・・・", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
            { bg: "wing", speaker: "パルス", text: "ああもう, わかったわよ、いくわよ！", pulse: "angry", bit: "calm", tail: "right", color: "pink" }
        ],
        stage3: [
            { bg: "cockpit0", brightness: "dark", speaker: "パルス", text: "うわ、暗い", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "dark", speaker: "ビット333", text: "電源を入れましょう", pulse: "anxious", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "・・・", pulse: "calm", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "light", speaker: "ビット333", text: "どうしましたか？", pulse: "calm", bit: "calm", tail: "left", color: "cyan" },
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "いや、てっきりコクピットもパスコードかかってるかと", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "light", speaker: "ビット333", text: "戦闘機のシステムは宇宙船とは別ですから", pulse: "smile", bit: "smile", tail: "left", color: "cyan" },
            { bg: "cockpit0", brightness: "light", speaker: "パルス", text: "あー、よかった。じゃあ早速脱出しよう", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit0", brightness: "light", speaker: "", text: "", special: "alert_dark_shake" }, 
            { bg: "cockpit", speaker: "パルス", text: "ぎゃあああ！", pulse: "surprised", bit: "surprised", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "危険、危険！ 宇宙船崩壊の危険！", pulse: "surprised", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "んなことわかってるわよ！ 離陸するわよ！", pulse: "angry", bit: "calm", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "お待ちください。ハッチが閉じています。離陸できません", pulse: "surprised", bit: "tired", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "宇宙船の・・・ハッチ！？\nね、念のため聞くけど宇宙船のハッチは・・・", pulse: "surprised", bit: "tired", tail: "right", color: "pink" },
            { bg: "cockpit", speaker: "ビット333", text: "宇宙船のパスコードがかかってます", pulse: "cry", bit: "confused", tail: "left", color: "cyan" },
            { bg: "cockpit", speaker: "パルス", text: "ちくしょおおおお！", pulse: "angry", bit: "smile", tail: "right", color: "pink" }
        ],
        stage4: [
            { bg: "uni", speaker: "パルス", text: "し、死んだかと思ったわ・・・", pulse: "cry", bit: "calm", tail: "right", color: "pink" },
            { bg: "uni", speaker: "ビット333", text: "私もです。AIなので死ぬという表現はどうでしょうね。", pulse: "anxious", bit: "smile", tail: "left", color: "cyan" },
            { bg: "uni", speaker: "パルス", text: "自分で突っ込んでれば世話ないわよ。\nさてと、最寄りの惑星に向かいましょう。", pulse: "angry", bit: "calm", tail: "right", color: "pink" },
            { bg: "uni", speaker: "ビット333", text: "スカネイラ惑星が近いですね。ワープしますか？", pulse: "smile", bit: "calm", tail: "left", color: "cyan" },
            { bg: "uni", speaker: "パルス", text: "いいわ, そこまでワープしましょ。", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "uni", speaker: "ビット333", text: "かしこまりました。", pulse: "smile", bit: "smile", tail: "left", color: "cyan", special: "warp" },
            { bg: "waku", speaker: "パルス", text: "わあ、綺麗。", pulse: "smile", bit: "calm", tail: "right", color: "pink" },
            { bg: "waku", speaker: "ビット333", text: "スカネイラ惑星は植物資源で有名な惑星です。", pulse: "smile", bit: "smile", tail: "left", color: "cyan" },
            { bg: "waku", speaker: "unknown", unknown: true, text: "不明機、応答せよ。", color: "yellow" },
            { bg: "waku", speaker: "ビット333", text: "こちら、O-559。緊急避難中。着陸許可を求む。", pulse: "anxious", bit: "calm", tail: "left", color: "cyan" },
            { bg: "waku", speaker: "unknown", unknown: true, text: "わかった。だが、そちらが敵性AIでないことを示してほしい。", color: "yellow" },
            { bg: "waku", speaker: "パルス", text: "わ、私人間です！ 敵性なんてありません！", pulse: "surprised", bit: "calm", tail: "right", color: "pink" },
            { bg: "waku", speaker: "unknown", unknown: true, text: "残念ながらAIはみんなそう言うんだ。\n君が人間であるという証拠、パスコードを解いてもらおう。", color: "yellow" },
            { bg: "waku", speaker: "パルス", text: "やりますよ！ やればいいんでしょ！", pulse: "angry", bit: "calm", tail: "right", color: "pink" }
        ],
        stage5: [
            { bg: "chaku", speaker: "パルス", text: "ふわー、やっと惑星に入れたー！", pulse: "smile", bit: "smile", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "ビット333", text: "ヴヴ・・・！　ヴヴヴ！", pulse: "surprised", bit: "confused", tail: "left", color: "cyan", special: "shake" },
            { bg: "chaku", speaker: "パルス", text: "ビット！？　どうしたの！？", pulse: "surprised", bit: "confused", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "ビット333", text: "他の惑星に機密を持ち込む可能性を検知しました。", pulse: "surprised", bit: "angry", tail: "left", color: "cyan" },
            { bg: "chaku", speaker: "ビット333", text: "あなたを企業スパイと認定します。", pulse: "surprised", bit: "angry", tail: "left", color: "cyan" },
            { bg: "chaku", speaker: "パルス", text: "ちょっと！　しっかりしてよ、ビット！", pulse: "angry", bit: "angry", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "ビット333", text: "パルス、私を破壊して・・・下さい。", pulse: "anxious", bit: "cry", tail: "left", color: "cyan" },
            { bg: "chaku", speaker: "ビット333", text: "私はあなたを・・・排除しようとしている！", pulse: "cry", bit: "cry", tail: "left", color: "cyan", special: "shake" },
            { bg: "chaku", speaker: "パルス", text: "そんなことできるわけないじゃない。どうしよう。", pulse: "cry", bit: "tired", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "ビット333", text: "マスターコードの書き換えを・・・。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan" },
            { bg: "chaku", speaker: "パルス", text: "マスターコードの書き換え！？　それってまさか・・・", pulse: "surprised", bit: "tired", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "ビット333", text: "人にしかできない、コードを。", pulse: "anxious", bit: "tired", tail: "left", color: "cyan" },
            { bg: "chaku", speaker: "パルス", text: "またそれかっ！　ここまで来たらやってやるわよ！", pulse: "angry", bit: "tired", tail: "right", color: "pink" },
            { bg: "chaku", speaker: "パルス", text: "来なさい、ビット！　あなたを解放してあげる！", pulse: "smile", bit: "tired", tail: "right", color: "pink" }
        ]
    },

    currentScript: [], currentIndex: 0, isTyping: false, typingTimer: null, fullText: "", onComplete: null,

    init() {
        document.getElementById('dialogue-container').onclick = () => this.handleDialogueClick();
        document.getElementById('adv-skip-btn').onclick = (e) => { e.stopPropagation(); this.skip(); };
    },

    play(key, cb) {
        this.currentScript = this.scripts[key] || [];
        this.currentIndex = 0;
        this.onComplete = cb;
        const advBg = document.getElementById('adv-bg');
        advBg.style.opacity = "0.7";
        advBg.style.filter = "brightness(1)";
        document.getElementById('char-bit').style.opacity = 1;
        document.getElementById('char-pulse').style.opacity = 1;
        
        if (key === 'stage1') this.startAlert演出(() => this.next()); else this.next();
    },

    startAlert演出(callback) {
        const overlay = document.getElementById('interior-alert-overlay');
        const win = document.getElementById('adventure-viewport');
        document.getElementById('adv-bg').style.backgroundImage = "url('img/inship.png')";
        overlay.style.display = 'block'; win.classList.add('shake-scene'); SoundEngine.playSFX('damage');
        setTimeout(() => { overlay.style.display = 'none'; win.classList.remove('shake-scene'); callback(); }, 1200);
    },

    handleDialogueClick() {
        if(this.isTyping) {
            clearInterval(this.typingTimer);
            document.getElementById('dialogue-text').innerHTML = this.fullText;
            this.isTyping = false;
        } else this.next();
    },

    next() {
        if(this.currentIndex >= this.currentScript.length) { if(this.onComplete) this.onComplete(); return; }
        const data = this.currentScript[this.currentIndex];
        this.fadeBackgroundUpdate(data.bg, data.brightness, () => {
            this.updateUI(data);
            this.currentIndex++;
        });
    },

    fadeBackgroundUpdate(bgName, brightness, callback) {
        const advBg = document.getElementById('adv-bg');
        const blackOut = document.getElementById('black-out-overlay');
        const currentBg = advBg.style.backgroundImage;
        const newBg = `url("img/${bgName}.png")`;

        if (currentBg !== newBg) {
            blackOut.classList.add('fade-black');
            setTimeout(() => {
                advBg.style.backgroundImage = newBg;
                this.applyBrightness(advBg, brightness);
                blackOut.classList.remove('fade-black');
                setTimeout(callback, 300);
            }, 300);
        } else {
            this.applyBrightness(advBg, brightness);
            callback();
        }
    },

    applyBrightness(el, b) {
        el.style.filter = (b === "dark") ? "brightness(0.2)" : "brightness(1.0)";
    },

    skip() { clearInterval(this.typingTimer); if(this.onComplete) this.onComplete(); },

    updateUI(data) {
        if (data.special === "shake") {
            const win = document.getElementById('adventure-viewport');
            win.classList.add('shake-scene'); SoundEngine.playSFX('damage');
            setTimeout(() => win.classList.remove('shake-scene'), 800);
        } else if (data.special === "alert_dark_shake") {
            this.playAlertDarkShake(); this.isTyping = false; return;
        } else if (data.special === "warp") {
            this.isTyping = true;
            this.playWarpEffect(() => { this.isTyping = false; this.next(); });
        }

        const label = document.getElementById('speaker-label');
        const tail = document.getElementById('speaker-tail');
        
        if (data.unknown) {
            document.getElementById('char-bit').style.opacity = 0;
            document.getElementById('char-pulse').style.opacity = 0;
            label.innerText = "UNKNOWN"; 
            label.style.backgroundColor = "var(--neon-yellow)"; 
            label.style.borderColor = "var(--neon-yellow)";
            tail.style.opacity = 0;
        } else {
            document.getElementById('char-bit').style.opacity = 1;
            document.getElementById('char-pulse').style.opacity = 1;
            tail.style.opacity = 1;
            const color = data.color === "pink" ? "var(--neon-pink)" : "var(--neon-blue)";
            label.innerText = data.speaker || ""; 
            label.style.backgroundColor = color; 
            label.style.borderColor = color;
            tail.style.left = data.tail === "right" ? "calc(50% + 40px)" : "calc(50% - 40px)";
            tail.style.borderTopColor = color;
            this.updateSprites(data);
        }
        this.typeText(data.text, data.color);
    },

    playAlertDarkShake() {
        const win = document.getElementById('adventure-viewport');
        const overlay = document.getElementById('interior-alert-overlay');
        this.isTyping = true;
        overlay.style.display = 'block'; overlay.classList.add('alert-blink-red');
        SoundEngine.playSFX('damage'); win.classList.add('shake-scene-heavy');
        setTimeout(() => { 
            overlay.style.display = 'none'; overlay.classList.remove('alert-blink-red'); 
            win.classList.remove('shake-scene-heavy'); this.isTyping = false;
            this.next();
        }, 1500);
    },

    playWarpEffect(callback) {
        const container = document.getElementById('warp-container');
        container.innerHTML = ''; container.classList.remove('hidden');
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div'); p.className = 'warp-particle';
            const angle = Math.random() * Math.PI * 2; const dist = 100 + Math.random() * 200;
            p.style.setProperty('--tw-x', `${Math.cos(angle) * dist}px`);
            p.style.setProperty('--tw-y', `${Math.sin(angle) * dist}px`);
            p.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(p);
        }
        SoundEngine.playSFX('scan');
        setTimeout(() => { container.classList.add('hidden'); callback(); }, 2000);
    },

    typeText(text, colorType) {
        if (!text) return;
        this.isTyping = true; this.fullText = text.replace(/\n/g, '<br>');
        const el = document.getElementById('dialogue-text');
        el.style.color = (colorType === "pink") ? "var(--pink-txt)" : (colorType === "yellow") ? "var(--yellow-txt)" : "var(--cyan-txt)";
        el.innerHTML = ''; let i = 0;
        this.typingTimer = setInterval(() => {
            if (text[i] === '\n') el.innerHTML += '<br>'; else el.innerHTML += text[i];
            i++; if(i >= text.length) { clearInterval(this.typingTimer); this.isTyping = false; }
        }, 40);
    },

    updateSprites(data) {
        if (data.unknown) return;
        const pSize = 210;
        const pMap = { calm:[0,0], anxious:[1,0], angry:[2,0], cry:[0,1], smile:[1,1], blush:[2,1], surprised:[0,2] };
        const p = pMap[data.pulse] || [0,0];
        document.getElementById('char-pulse').style.backgroundPosition = `-${p[0] * pSize}px -${p[1] * pSize}px`;

        const bW = 186.6; const bH = 196.35;
        const bMap = { calm:[0,0], smile:[1,0], angry:[2,0], confused:[0,1], tired:[1,1], surprised:[2,1], cry:[0,1] };
        const b = bMap[data.bit] || [0,0];
        document.getElementById('char-bit').style.backgroundPosition = `-${b[0] * bW}px -${b[1] * bH}px`;
    }
};
