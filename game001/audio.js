// CYBER-SWEEP v12.6 | audio.js | STORY BGM ENABLED
const SoundEngine = {
    ctx: null, master: null, enabled: false, isMuted: false, bpm: 128, currentStep: 0, nextTime: 0,
    patterns: { kick:[], hat:[], bass:[], lead:[] },

    init() {
        if(this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.3;
        this.master.connect(this.ctx.destination);
        this.enabled = true; this.scheduler();
    },

    // ゲームパートのプロシージャル生成
    generateStageMusic(lvl) {
        this.bpm = 120 + (lvl * 5);
        this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
        this.patterns.bass = [48,0,48,0, 48,0,51,0, 48,0,48,0, 46,0,53,0];
        this.patterns.hat = [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1];
        this.patterns.lead = Array(16).fill(0).map(() => Math.random() > 0.8 ? 60 + Math.floor(Math.random()*12) : 0);
    },

    // アドベンチャーパートの雰囲気生成
    setStoryMusic(type) {
        if(!this.enabled) return;
        this.patterns = { kick:[], hat:[], bass:[], lead:[] }; // リセット
        
        if (type === 'calm') {
            this.bpm = 70;
            this.patterns.lead = [60,0,0,0, 64,0,0,0, 67,0,0,0, 72,0,0,0];
            this.patterns.bass = [48,0,0,0, 48,0,0,0, 48,0,0,0, 48,0,0,0];
        } else if (type === 'tense') {
            this.bpm = 150;
            this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
            this.patterns.bass = [36,36,36,36, 36,36,36,36, 36,36,36,36, 36,36,36,36];
        } else if (type === 'sad') {
            this.bpm = 60;
            this.patterns.lead = [72,0,71,0, 67,0,64,0, 0,0,0,0, 0,0,0,0];
            this.patterns.bass = [45,0,0,0, 45,0,0,0, 45,0,0,0, 45,0,0,0];
        } else if (type === 'ending') {
            this.bpm = 110;
            this.patterns.kick = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0];
            this.patterns.bass = [48,0,0,0, 55,0,0,0, 53,0,0,0, 50,0,0,0];
            this.patterns.lead = [60,64,67,0, 67,71,74,0, 65,69,72,0, 62,65,69,0];
        } else if (type === 'stop') {
            // 空のまま
        }
    },

    scheduler() {
        if(this.enabled && !this.isMuted) {
            while(this.nextTime < this.ctx.currentTime + 0.1) {
                this.scheduleNote(this.currentStep, this.nextTime);
                this.nextTime += 60.0 / this.bpm / 4;
                this.currentStep = (this.currentStep + 1) % 16;
            }
        }
        setTimeout(() => this.scheduler(), 25);
    },

    scheduleNote(s, t) {
        if(this.patterns.kick[s]) this.playOsc(80, t, 0.1, 'sine', 0.5, true);
        if(this.patterns.bass[s]) this.playOsc(this.mToF(this.patterns.bass[s]), t, 0.2, 'sawtooth', 0.1);
        if(this.patterns.lead[s]) this.playOsc(this.mToF(this.patterns.lead[s]), t, 0.1, 'square', 0.05);
        if(this.patterns.hat[s]) this.playOsc(8000, t, 0.05, 'square', 0.03);
    },

    mToF(m) { return 440 * Math.pow(2, (m - 69) / 12); },
    
    playOsc(f, t, l, type, vol, sweep=false) {
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        if(sweep) o.frequency.exponentialRampToValueAtTime(0.01, t+l);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t+l);
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t+l);
    },

    playSFX(type) {
        if(!this.ctx) return;
        if(type==='damage') this.playOsc(150, this.ctx.currentTime, 0.5, 'square', 0.3, true);
        if(type==='flag') this.playOsc(1000, this.ctx.currentTime, 0.05, 'sine', 0.1);
        if(type==='scan') this.playOsc(2000, this.ctx.currentTime, 0.2, 'square', 0.05, true);
    },

    toggleMute() { this.isMuted = !this.isMuted; return this.isMuted; }
};
