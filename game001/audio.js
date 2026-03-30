// CYBER-SWEEP v6.0 | audio.js | BGM ENGINE
const SoundEngine = {
    ctx: null, master: null, enabled: false, isMuted: false, bpm: 124, 
    currentStep: 0, nextTime: 0, currentBGM: null, patterns: { kick:[], hat:[], bass:[], lead:[] },

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.4;
        this.master.connect(this.ctx.destination);
        this.enabled = true;
        this.scheduler();
    },

    playBGM(type) {
        if(type === 'interior') {
            this.bpm = 90; // 少しスローでダークなサイバーパンク
            this.patterns.kick = [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0];
            this.patterns.bass = [48,0,48,0, 51,0,51,0, 48,0,48,0, 46,0,46,0];
            this.patterns.lead = [0,0,60,63, 0,0,65,0, 0,0,63,0, 60,0,0,0];
        }
    },

    generateStageMusic(lvl) {
        this.bpm = 125 + (lvl * 2);
        this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
        this.patterns.hat = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0];
        this.patterns.bass = [48,48,0,0, 48,48,0,0, 48,48,0,0, 48,48,0,0];
        this.patterns.lead = Array(16).fill(0).map(() => Math.random() > 0.8 ? 60 + Math.floor(Math.random()*12) : 0);
    },

    scheduler() {
        if(this.enabled) {
            while (this.nextTime < this.ctx.currentTime + 0.1) {
                this.scheduleNote(this.currentStep, this.nextTime);
                this.nextTime += 60.0 / this.bpm / 4;
                this.currentStep = (this.currentStep + 1) % 16;
            }
        }
        setTimeout(() => this.scheduler(), 25);
    },

    scheduleNote(s, t) {
        if(this.patterns.kick[s]) this.playOsc(100, t, 0.1, 'sine', 0.4, true);
        if(this.patterns.hat[s]) this.playOsc(8000, t, 0.05, 'square', 0.05);
        if(this.patterns.bass[s]) this.playOsc(this.mToF(this.patterns.bass[s]), t, 0.2, 'sawtooth', 0.1);
        if(this.patterns.lead[s]) this.playOsc(this.mToF(this.patterns.lead[s]), t, 0.1, 'square', 0.05);
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
        if(type==='damage') this.playOsc(150, now, 0.4, 'square', 0.3, true);
        if(type==='flag') this.playOsc(1200, now, 0.05, 'sine', 0.1);
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.master.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
        return this.isMuted;
    }
};
