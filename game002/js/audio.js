// js/audio.js
export const soundManager = {
    bgm: {},
    se: {},
    currentBGM: null,
    init: function() {
        this.bgm['kagami'] = new Audio('bgm/stage_kagami.mp3');
        this.bgm['kagami'].loop = true;
        this.bgm['kagami'].volume = 0.4;

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
