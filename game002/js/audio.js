export const VER_AUDIO = "0.4.0"; // バージョン更新（ステージ6のBGM追加）

export const soundManager = {
    bgm: {},
    se: {},
    currentBGM: null,
    isMuted: false, // ミュート状態管理

    init: function() {
        // --- UI・システム系 BGM ---
        this.bgm['title'] = new Audio('bgm/title.mp3');
        this.bgm['title'].loop = true;
        this.bgm['title'].volume = 0.4;

        this.bgm['gameover'] = new Audio('bgm/gameover.mp3');
        this.bgm['gameover'].loop = true;
        this.bgm['gameover'].volume = 0.4;

        this.bgm['clear'] = new Audio('bgm/clear.mp3');
        this.bgm['clear'].loop = true;
        this.bgm['clear'].volume = 0.4;

        // --- ADV（会話）パート用 BGM ---
        this.bgm['relax'] = new Audio('bgm/relax.mp3');
        this.bgm['relax'].loop = true;
        this.bgm['relax'].volume = 0.4;

        this.bgm['dark'] = new Audio('bgm/dark.mp3');
        this.bgm['dark'].loop = true;
        this.bgm['dark'].volume = 0.4;

        // --- STAGE 1: 各務 栞 ---
        this.bgm['stage_kagami'] = new Audio('bgm/stage_kagami.mp3');
        this.bgm['stage_kagami'].loop = true;
        this.bgm['stage_kagami'].volume = 0.4;

        this.bgm['boss_kagami'] = new Audio('bgm/boss_kagami.mp3');
        this.bgm['boss_kagami'].loop = true;
        this.bgm['boss_kagami'].volume = 0.4;

        // --- STAGE 2: 柊 千華 ---
        this.bgm['stage_hiragi'] = new Audio('bgm/stage_hiragi.mp3');
        this.bgm['stage_hiragi'].loop = true;
        this.bgm['stage_hiragi'].volume = 0.4;

        this.bgm['boss_hiragi'] = new Audio('bgm/boss_hiragi.mp3');
        this.bgm['boss_hiragi'].loop = true;
        this.bgm['boss_hiragi'].volume = 0.4;

        // --- STAGE 3: 椎名 護 ---
        this.bgm['stage_shiina'] = new Audio('bgm/stage_shiina.mp3');
        this.bgm['stage_shiina'].loop = true;
        this.bgm['stage_shiina'].volume = 0.4;

        this.bgm['boss_shiina'] = new Audio('bgm/boss_shiina.mp3');
        this.bgm['boss_shiina'].loop = true;
        this.bgm['boss_shiina'].volume = 0.4;

        // --- STAGE 4: 神宮寺 恒成 ---
        this.bgm['stage_jingu'] = new Audio('bgm/stage_jingu.mp3');
        this.bgm['stage_jingu'].loop = true;
        this.bgm['stage_jingu'].volume = 0.4;

        this.bgm['boss_jingu'] = new Audio('bgm/boss_jingu.mp3');
        this.bgm['boss_jingu'].loop = true;
        this.bgm['boss_jingu'].volume = 0.4;

        // --- STAGE 5: G・O・D・A・I ---
        this.bgm['stage_godai'] = new Audio('bgm/stage_godai.mp3');
        this.bgm['stage_godai'].loop = true;
        this.bgm['stage_godai'].volume = 0.4;

        this.bgm['boss_godai'] = new Audio('bgm/boss_godai.mp3');
        this.bgm['boss_godai'].loop = true;
        this.bgm['boss_godai'].volume = 0.4;

        // --- STAGE 6: FINAL ---
        // ★追加：stage_cap と boss_cap を登録
        this.bgm['stage_final'] = new Audio('bgm/stage_cap.mp3');
        this.bgm['stage_final'].loop = true;
        this.bgm['stage_final'].volume = 0.4;

        this.bgm['boss_final'] = new Audio('bgm/boss_cap.mp3');
        this.bgm['boss_final'].loop = true;
        this.bgm['boss_final'].volume = 0.4;


        // --- SE（効果音） ---
        this.se['smallb'] = new Audio('se/smallb.mp3');
        this.se['smallb'].volume = 0.6;
    },
    
    // ミュート切り替え
    toggleMute: function() {
        this.isMuted = !this.isMuted;
        for (let key in this.bgm) {
            this.bgm[key].muted = this.isMuted;
        }
        for (let key in this.se) {
            this.se[key].muted = this.isMuted;
        }
        return this.isMuted;
    },
    
    playBGM: function(id) {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
        }
        if (this.bgm[id]) {
            this.currentBGM = this.bgm[id];
            this.currentBGM.muted = this.isMuted;
            this.currentBGM.play().catch(e => console.log("BGM play failed:", e));
        }
    },
    
    stopBGM: function() {
        for (let key in this.bgm) {
            this.bgm[key].pause();
            this.bgm[key].currentTime = 0;
        }
        this.currentBGM = null;
    },
    
    playSE: function(id) {
        if (this.se[id]) {
            const se = this.se[id].cloneNode();
            se.volume = this.se[id].volume;
            se.muted = this.isMuted;
            se.play().catch(e => console.log("SE play failed:", e));
        }
    }
};
