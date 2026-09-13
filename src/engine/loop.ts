/**
 * GameLoop.ts
 * Fixed-timestep game loop wrapper around requestAnimationFrame with accumulator pattern,
 * variable game speed, pause controls, and performance metrics tracking.
 */

export interface LoopMetrics {
  fps: number;
  frameTimeMs: number;
  averageFrameTimeMs: number;
}

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
  private baseFixedDt: number; // Base fixed step, e.g. 1000/60 ms
  private speedMultiplier: number = 1.0;
  private maxAccumulatorMs: number = 250; // Cap to prevent spiral of death

  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;

  private lastTime: number = 0;
  private accumulator: number = 0;

  // Ring buffer for tracking rolling FPS and frame time metrics
  private readonly ringBufferSize: number = 60;
  private frameTimes: number[] = [];
  private frameTimeIndex: number = 0;
  private lastFrameDurationMs: number = 0;

  constructor(
    onUpdate: UpdateCallback,
    onRender: RenderCallback,
    baseFixedDtMs: number = 1000 / 60
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.baseFixedDt = baseFixedDtMs;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now(); // Reset lastTime on resume to avoid sudden delta jump
  }

  public isGamePaused(): boolean {
    return this.isPaused;
  }

  public setSpeed(multiplier: number): void {
    if (multiplier > 0) {
      this.speedMultiplier = multiplier;
    }
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  public getMetrics(): LoopMetrics {
    const totalMs = this.frameTimes.reduce((acc, val) => acc + val, 0);
    const count = this.frameTimes.length || 1;
    const avgMs = totalMs / count;
    const fps = avgMs > 0 ? Math.round(1000 / avgMs) : 0;

    return {
      fps,
      frameTimeMs: this.lastFrameDurationMs,
      averageFrameTimeMs: avgMs,
    };
  }

  private tick = (currentTime: number): void => {
    if (!this.isRunning) return;

    let delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap maximum delta time to avoid spiral of death (e.g. after tab switch / minimize)
    if (delta > this.maxAccumulatorMs) {
      delta = this.maxAccumulatorMs;
    }

    // Record metrics
    this.lastFrameDurationMs = delta;
    if (this.frameTimes.length < this.ringBufferSize) {
      this.frameTimes.push(delta);
    } else {
      this.frameTimes[this.frameTimeIndex] = delta;
      this.frameTimeIndex = (this.frameTimeIndex + 1) % this.ringBufferSize;
    }

    // Accumulator pattern for fixed-timestep updates
    const scaledFixedDt = this.baseFixedDt;
    const stepDt = this.baseFixedDt * this.speedMultiplier;

    if (!this.isPaused) {
      this.accumulator += delta;

      while (this.accumulator >= scaledFixedDt) {
        this.onUpdate(stepDt);
        this.accumulator -= scaledFixedDt;
      }
    }

    // Always render, even when paused
    this.onRender();

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
