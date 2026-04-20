export const VER_AUDIO = "0.2.0"; // バージョン更新（新規追加された11曲のBGMアセットを一括登録）

export const soundManager = {
    bgm: {},
    se: {},
    currentBGM: null,
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


        // --- SE（効果音） ---
        this.se['smallb'] = new Audio('se/smallb.mp3');
        this.se['smallb'].volume = 0.6;
    },
    
    playBGM: function(id) {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
        }
        if (this.bgm[id]) {
            this.currentBGM = this.bgm[id];
            this.currentBGM.play().catch(e => console.log("BGM play failed:", e));
        }
    },
    
    stopBGM: function() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
        }
    },
    
    playSE: function(id) {
        if (this.se[id]) {
            const se = this.se[id].cloneNode();
            se.volume = this.se[id].volume;
            se.play().catch(e => console.log("SE play failed:", e));
        }
    }
};
