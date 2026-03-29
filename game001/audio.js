// CYBER-SWEEP v5.3 | audio.js
const SoundEngine = {
    ctx: null, masterGain: null, enabled: false, isMuted: false, bpm: 124, currentStep: 0,
    nextNoteTime: 0, patterns: { kick: [], hat: [], bass: [], lead: [] },
    scale: [48, 51, 53, 55, 58, 60],

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.ctx.destination);
            this.enabled = true;
            this.scheduler();
        } catch(e) { console.error("Audio init error", e); }
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
        return this.isMuted;
    },

    generateStageMusic(level) {
        if (!this.enabled) return;
        const seed = (level * 222) % 100;
        this.bpm = 120 + (seed % 15);
        this.patterns.kick = Array(16).fill(0).map((_, i) => (i % 4 === 0) ? 1 : 0);
        this.patterns.hat = Array(16).fill(0).map((_, i) => (i % 2 === 1) ? 1 : 0);
        this.patterns.bass = Array(16).fill(0).map((_, i) => (i % 4 === 0 || i % 8 === 2) ? this.scale[seed % this.scale.length] : 0);
        this.patterns.lead = Array(16).fill(0).map((_, i) => (Math.random() > 0.8) ? this.scale[Math.floor(Math.random()*this.scale.length)] + 12 : 0);
        this.currentStep = 0;
    },

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.scheduleNote(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += 60.0 / this.bpm / 4;
            this.currentStep = (this.currentStep + 1) % 16;
        }
        setTimeout(() => this.scheduler(), 25);
    },

    scheduleNote(step, time) {
        if (this.patterns.kick[step]) this.playKick(time);
        if (this.patterns.hat[step]) this.playHat(time);
        if (this.patterns.bass[step]) this.playSynth(this.patterns.bass[step], time, 'sawtooth', 0.1, 0.2);
        if (this.patterns.lead[step]) this.playSynth(this.patterns.lead[step], time, 'square', 0.04, 0.1);
    },

    playKick(time) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.frequency.setValueAtTime(150, time); o.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        g.gain.setValueAtTime(0.3, time); g.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        o.connect(g); g.connect(this.masterGain); o.start(time); o.stop(time + 0.1);
    },

    playHat(time) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = 'square'; o.frequency.setValueAtTime(8000 + Math.random() * 2000, time);
        g.gain.setValueAtTime(0.03, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        o.connect(g); g.connect(this.masterGain); o.start(time); o.stop(time + 0.05);
    },

    playSynth(midi, time, type, vol, len) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), time);
        g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(vol, time + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, time + len);
        o.connect(g); g.connect(this.masterGain); o.start(time); o.stop(time + len);
    },

    playSFX(type) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.connect(g); g.connect(this.masterGain);
        if(type==='damage') { o.type='square'; o.frequency.setValueAtTime(100,now); o.frequency.linearRampToValueAtTime(40,now+0.3); g.gain.setValueAtTime(0.3,now); o.start(); o.stop(now+0.3); }
        else if(type==='scan') { o.type='triangle'; o.frequency.setValueAtTime(200,now); o.frequency.exponentialRampToValueAtTime(1200,now+0.5); g.gain.setValueAtTime(0.2,now); o.start(); o.stop(now+0.5); }
        else if(type==='flag') { o.type='sine'; o.frequency.setValueAtTime(1200,now); g.gain.setValueAtTime(0.1,now); o.start(); o.stop(now+0.05); }
    }
};
