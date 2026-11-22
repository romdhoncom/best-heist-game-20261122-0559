// Synthesised WebAudio only — no audio files, no network.
const AudioSys = {
  ctx: null,
  master: null,
  muted: false,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },

  tone(freq, dur, type, vol, when) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },

  footstep() { this.tone(190, 0.04, "square", 0.03); },
  suspicion() { this.tone(520, 0.12, "sine", 0.12); this.tone(660, 0.14, "sine", 0.12, 0.1); },
  alert() { this.tone(880, 0.12, "square", 0.14); this.tone(660, 0.16, "square", 0.14, 0.11); },
  caught() { this.tone(330, 0.2, "sawtooth", 0.14); this.tone(220, 0.3, "sawtooth", 0.14, 0.16); },
  cameraBeep() { this.tone(1200, 0.08, "square", 0.1); },
  hackBlip() { this.tone(980, 0.06, "sine", 0.12); this.tone(1240, 0.06, "sine", 0.12, 0.07); this.tone(1560, 0.08, "sine", 0.12, 0.14); },
  chime() { this.tone(880, 0.14, "sine", 0.16); this.tone(1320, 0.22, "sine", 0.16, 0.1); },
  fanfare() { this.tone(523, 0.14, "triangle", 0.18); this.tone(659, 0.14, "triangle", 0.18, 0.12); this.tone(784, 0.28, "triangle", 0.18, 0.24); },
  winFanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => this.tone(n, 0.2, "triangle", 0.18, i * 0.13));
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },
};
