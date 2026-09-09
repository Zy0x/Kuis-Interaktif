// Procedural Background Music (BGM) Engine for Quiz SD Seru
// Synthesizes a cheerful, child-friendly educational game background groove using the Web Audio API.
// 100% offline, zero network requests, zero bundle audio bloat.

export interface BgmOptions {
  bpm?: number;
  urgentBpm?: number;
  volume?: number;
}

export class ProceduralBgmPlayer {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isPaused = false;
  private isMuted = false;
  private isDucked = false;
  private isUrgent = false;

  private currentStep = 0;
  private nextNoteTime = 0;
  private timerId: number | null = null;

  private baseBpm = 110;
  private urgentBpm = 128;
  private baseVolume = 0.12;

  // Pentatonic frequencies in Hz (C4 to E5)
  private readonly NOTE_FREQS: Record<string, number> = {
    C2: 65.41,
    F2: 87.31,
    G2: 98.00,
    A2: 110.00,
    B2: 123.47,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.00,
    A3: 220.00,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
  };

  // 64-step pattern (4 bars of 16 steps)
  // Bass notes: scheduled on quarter notes (steps 0, 4, 8, 12, 16, ...)
  private readonly BASS_PATTERN: (string | null)[] = [
    // Bar 1 (C)
    'C3', null, null, null, 'G3', null, null, null, 'E3', null, null, null, 'G3', null, null, null,
    // Bar 2 (Am)
    'A2', null, null, null, 'E3', null, null, null, 'C3', null, null, null, 'E3', null, null, null,
    // Bar 3 (F)
    'F2', null, null, null, 'C3', null, null, null, 'A2', null, null, null, 'C3', null, null, null,
    // Bar 4 (G)
    'G2', null, null, null, 'D3', null, null, null, 'B2', null, null, null, 'G2', null, null, null,
  ];

  // Cheerful Marimba Melody Plucks (4 bars)
  private readonly MELODY_PATTERN: (string | null)[] = [
    // Bar 1
    'C4', null, 'E4', null, 'G4', null, 'C5', null, 'E4', null, null, 'G4', null, null, 'E4', null,
    // Bar 2
    'C4', null, 'A4', null, 'E4', null, 'C5', null, 'A4', null, null, 'E4', null, 'A4', null, null,
    // Bar 3
    'F4', null, 'A4', null, 'C5', null, 'D5', null, 'C5', null, 'A4', null, 'F4', null, 'G4', null,
    // Bar 4
    'G4', null, 'B4', null, 'D5', null, 'G5', null, 'D5', null, 'B4', null, 'G4', null, 'D4', null,
  ];

  constructor(options?: BgmOptions) {
    if (options?.bpm) this.baseBpm = options.bpm;
    if (options?.urgentBpm) this.urgentBpm = options.urgentBpm;
    if (options?.volume) this.baseVolume = options.volume;
  }

  private initContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.getTargetVolume(), this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private getTargetVolume(): number {
    if (this.isMuted) return 0;
    if (this.isDucked) return this.baseVolume * 0.22; // Ducked to ~22% for clear SFX/answer feedback
    return this.baseVolume;
  }

  private updateGain(smoothTime = 0.15) {
    if (!this.masterGain || !this.audioCtx) return;
    const target = this.getTargetVolume();
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + smoothTime);
  }

  // Play a rounded warm bass pluck
  private playBass(freq: number, time: number) {
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    const dur = 0.28;
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  // Play a soft wooden marimba note
  private playMarimba(freq: number, time: number) {
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Slight pitch drop for tactile wooden marimba strike
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, time + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    const dur = 0.18;
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  // Play a very subtle high shaker pulse
  private playShaker(time: number, accent: boolean) {
    if (!this.audioCtx || !this.masterGain) return;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.035);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    const gain = this.audioCtx.createGain();
    const vol = accent ? 0.04 : 0.02;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  private scheduleStep() {
    const ctx = this.audioCtx;
    if (!ctx) return;

    const lookahead = 0.1; // Schedule ahead by 100ms
    const activeBpm = this.isUrgent ? this.urgentBpm : this.baseBpm;
    const secondsPer16th = 60 / (activeBpm * 4);

    while (this.nextNoteTime < ctx.currentTime + lookahead) {
      const step = this.currentStep % 64;

      // 1. Bass Note
      const bassNote = this.BASS_PATTERN[step];
      if (bassNote && this.NOTE_FREQS[bassNote]) {
        this.playBass(this.NOTE_FREQS[bassNote], this.nextNoteTime);
      }

      // 2. Melody Note
      const melodyNote = this.MELODY_PATTERN[step];
      if (melodyNote && this.NOTE_FREQS[melodyNote]) {
        this.playMarimba(this.NOTE_FREQS[melodyNote], this.nextNoteTime);
      }

      // 3. Shaker Pulse on even 16th notes
      if (step % 2 === 0) {
        const isBeat = step % 4 === 0;
        this.playShaker(this.nextNoteTime, isBeat);
      }

      this.nextNoteTime += secondsPer16th;
      this.currentStep++;
    }
  }

  // Public Controls
  public start() {
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.isPlaying && !this.isPaused) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.updateGain(0.2);

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.timerId = window.setInterval(() => {
      if (!this.isPaused && this.isPlaying) {
        this.scheduleStep();
      }
    }, 40);
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPaused = true;
    this.updateGain(0.1);
  }

  public resume() {
    if (!this.isPlaying) {
      this.start();
      return;
    }
    const ctx = this.audioCtx;
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    this.isPaused = false;
    if (ctx) {
      this.nextNoteTime = ctx.currentTime + 0.05;
    }
    this.updateGain(0.15);
  }

  public stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
    }
    this.currentStep = 0;
  }

  public setDucked(ducked: boolean) {
    if (this.isDucked === ducked) return;
    this.isDucked = ducked;
    this.updateGain(ducked ? 0.12 : 0.25);
  }

  public setUrgent(urgent: boolean) {
    this.isUrgent = urgent;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateGain(0.1);
  }

  public getIsMuted() {
    return this.isMuted;
  }

  public getIsPlaying() {
    return this.isPlaying && !this.isPaused;
  }
}

// Global Singleton for easy in-arena access
let globalBgmPlayer: ProceduralBgmPlayer | null = null;

export const getProceduralBgm = (): ProceduralBgmPlayer => {
  if (!globalBgmPlayer) {
    globalBgmPlayer = new ProceduralBgmPlayer();
  }
  return globalBgmPlayer;
};
