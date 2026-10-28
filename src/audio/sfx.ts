type AudioCtor = typeof AudioContext;

/** Tiny WebAudio synth so the game needs no audio assets. */
export class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;

  unlock(): void {
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  horn(): void {
    this.tone(392, 0.35, 'square', 0.06);
    this.tone(494, 0.35, 'square', 0.06);
  }

  chorus(): void {
    for (let i = 0; i < 4; i++) {
      this.tone(330 + Math.random() * 220, 0.25, 'sawtooth', 0.04, i * 0.18);
    }
  }

  pickup(): void {
    this.tone(660, 0.08, 'sine', 0.08);
    this.tone(990, 0.12, 'sine', 0.08, 0.07);
  }

  step(): void {
    this.tone(220, 0.05, 'triangle', 0.04);
  }

  crash(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = 0.25;
    source.connect(gain).connect(ctx.destination);
    source.start();
    this.tone(90, 0.4, 'sawtooth', 0.12, 0, 40);
  }

  private ready(): AudioContext | null {
    return this.ctx && !this.muted ? this.ctx : null;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0,
    slideTo?: number,
  ): void {
    const ctx = this.ready();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export const sfx = new Sfx();
