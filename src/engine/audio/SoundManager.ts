/**
 * SoundManager.ts
 * Web Audio API & Howler SFX manager with strict per-sound concurrency instance capping.
 * Prevents audio CPU degradation and audio walls during 5,000-enemy stress tests.
 */

import { Howl, Howler } from 'howler';

export class SoundManagerClass {
  private sounds: Record<string, Howl> = {};
  private activeCounts: Record<string, number> = {};
  private maxConcurrentPerSound: number = 8;
  private muted: boolean = false;
  private isInitialized: boolean = false;

  public init(): void {
    if (this.isInitialized) return;

    // Synthesize procedural Web Audio sound buffers for 100% reliable CC0 SFX
    this.sounds = {
      fire_gunner: this.createProceduralSound('gunner'),
      fire_cannon: this.createProceduralSound('cannon'),
      fire_frost: this.createProceduralSound('frost'),
      fire_sniper: this.createProceduralSound('sniper'),
      enemy_death: this.createProceduralSound('death'),
      base_damage: this.createProceduralSound('damage'),
      wave_start: this.createProceduralSound('wave'),
      game_over: this.createProceduralSound('gameover'),
      victory: this.createProceduralSound('victory'),
    };

    Object.keys(this.sounds).forEach((id) => {
      this.activeCounts[id] = 0;
    });

    this.isInitialized = true;
  }

  /**
   * Plays a sound effect subject to the maximum concurrency cap.
   */
  public play(soundId: string): void {
    if (this.muted || !this.isInitialized) return;

    const currentActive = this.activeCounts[soundId] || 0;
    if (currentActive >= this.maxConcurrentPerSound) {
      // Concurrency cap reached: skip to preserve FPS and prevent audio noise wall
      return;
    }

    const sound = this.sounds[soundId];
    if (!sound) return;

    this.activeCounts[soundId] = currentActive + 1;

    const playId = sound.play();

    sound.once('end', () => {
      this.activeCounts[soundId] = Math.max(0, (this.activeCounts[soundId] || 1) - 1);
    }, playId);

    sound.once('stop', () => {
      this.activeCounts[soundId] = Math.max(0, (this.activeCounts[soundId] || 1) - 1);
    }, playId);
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    Howler.mute(mute);
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Creates synthetic Web Audio SFX data URLs with clean wave characteristics.
   */
  private createProceduralSound(type: string): Howl {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const sampleRate = 22050;
    const duration = type === 'cannon' ? 0.35 : type === 'sniper' ? 0.4 : 0.15;
    const frameCount = Math.floor(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (type === 'gunner') {
        sample = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 25);
      } else if (type === 'cannon') {
        sample = (Math.random() * 2 - 1) * Math.exp(-t * 12);
      } else if (type === 'frost') {
        sample = Math.sin(2 * Math.PI * (800 - t * 1500) * t) * 0.4;
      } else if (type === 'sniper') {
        sample = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 15) + (Math.random() * 0.5);
      } else if (type === 'death') {
        sample = (Math.random() * 2 - 1) * Math.exp(-t * 20);
      } else if (type === 'damage') {
        sample = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 10);
      } else {
        sample = Math.sin(2 * Math.PI * (300 + t * 400) * t) * Math.exp(-t * 5);
      }

      data[i] = sample * 0.5;
    }

    // Convert Buffer to WAV Data URL for Howl loading
    const wavDataUrl = this.bufferToWavUrl(buffer, sampleRate);

    return new Howl({
      src: [wavDataUrl],
      format: ['wav'],
      volume: 0.4,
    });
  }

  private bufferToWavUrl(buffer: AudioBuffer, sampleRate: number): string {
    const data = buffer.getChannelData(0);
    const numSamples = data.length;
    const headerByteLength = 44;
    const wavBuffer = new ArrayBuffer(headerByteLength + numSamples * 2);
    const view = new DataView(wavBuffer);

    // WAV Header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // PCM Data
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}

export const SoundManager = new SoundManagerClass();
