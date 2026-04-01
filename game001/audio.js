// CYBER-SWEEP v14.0 | audio.js | LUXURY GENERATIVE ENGINE
const SoundEngine = {
    ctx: null, master: null, enabled: false, isMuted: false, bpm: 120, 
    currentStep: 0, nextTime: 0, 
    patterns: { kick:[], hat:[], bass:[], lead:[], pad:[] },

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.3;
        this.master.connect(this.ctx.destination);
        this.enabled = true; this.scheduler();
    },

    // ADVパートの豪華BGM生成
    setStoryMusic(type) {
        if(!this.enabled) return;
        this.patterns = { kick:[], hat:[], bass:[], lead:[], pad:[] };
        
        if (type === 'calm') {
            this.bpm = 70;
            this.patterns.pad = [60, 64, 67, 72]; // Cmaj
            this.patterns.lead = [0,0,67,0, 0,0,72,0, 0,0,64,0, 0,0,60,0];
        } else if (type === 'tense') {
            this.bpm = 140;
            this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
            this.patterns.bass = [36,36,39,36, 41,36,39,43, 36,36,39,36, 44,43,41,39];
            this.patterns.pad = [48, 51, 54]; // Dark disharmony
        } else if (type === 'sad') {
            this.bpm = 60;
            this.patterns.pad = [57, 60, 64, 67]; // Am7
            this.patterns.lead = [64,0,0,0, 62,0,0,0, 60,0,0,0, 59,0,0,0];
        } else if (type === 'ending') {
            this.bpm = 110;
            this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
            this.patterns.pad = [60, 65, 69, 72]; // Fmaj7
            this.patterns.lead = [72,74,76,77, 79,0,77,0, 76,0,74,0, 72,0,0,0];
        } else if (type === 'stop') {
            this.patterns = { kick:[], hat:[], bass:[], lead:[], pad:[] };
        }
    },

    // ゲームパートのメロディランダム生成
    generateStageMusic(lvl) {
        this.bpm = 124 + (lvl * 4);
        this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
        this.patterns.hat = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1];
        this.patterns.bass = [48,0,51,0, 48,0,46,0, 48,0,51,0, 53,0,48,0];
        // 数千通りのメロディパターン
        this.patterns.lead = Array(16).fill(0).map(() => Math.random() > 0.7 ? 60 + Math.floor(Math.random()*12) : 0);
        this.patterns.pad = [48, 55, 60]; // Background atmosphere
    },

    scheduler() {
        if(this.enabled && !this.isMuted) {
            while (this.nextTime < this.ctx.currentTime + 0.1) {
                this.scheduleNote(this.currentStep, this.nextTime);
                this.nextTime += 60.0 / this.bpm / 4;
                this.currentStep = (this.currentStep + 1) % 16;
            }
        }
        setTimeout(() => this.scheduler(), 25);
    },

    scheduleNote(s, t) {
        if(this.patterns.kick[s]) this.playOsc(80, t, 0.1, 'sine', 0.4, true);
        if(this.patterns.bass[s]) this.playOsc(this.mToF(this.patterns.bass[s]), t, 0.2, 'sawtooth', 0.1);
        if(this.patterns.lead[s]) this.playOsc(this.mToF(this.patterns.lead[s]), t, 0.15, 'square', 0.05);
        if(this.patterns.pad.length > 0 && s % 8 === 0) {
            this.patterns.pad.forEach(note => this.playOsc(this.mToF(note), t, 1.5, 'sawtooth', 0.02));
        }
        if(this.patterns.hat[s]) this.playOsc(8500, t, 0.04, 'square', 0.03);
    },

    mToF(m) { return 440 * Math.pow(2, (m - 69) / 12); },

    playOsc(f, t, l, type, vol, isSweep=false) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if(isSweep) o.frequency.exponentialRampToValueAtTime(0.01, t + l);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + l);
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t + l);
    },

    playSFX(type) {
        if(!this.ctx) return;
        const now = this.ctx.currentTime;
        if(type==='damage') this.playOsc(140, now, 0.5, 'square', 0.3, true);
        if(type==='flag') this.playOsc(1100, now, 0.06, 'sine', 0.1);
        if(type==='scan') this.playOsc(2000, now, 0.3, 'sawtooth', 0.05, true);
    },

    toggleMute() { this.isMuted = !this.isMuted; return this.isMuted; }
};
