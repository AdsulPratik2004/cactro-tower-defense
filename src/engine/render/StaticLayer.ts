/**
 * StaticLayer.ts
 * Offscreen canvas layer that pre-renders static background graphics, high-visibility grid layout,
 * and path track lines once. Exposes blit() to quickly copy to the main canvas.
 */

import { Path } from '../path/Path';

export class StaticLayer {
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  public readonly width: number;
  public readonly height: number;
  private isRendered: boolean = false;

  constructor(width: number = 1280, height: number = 720) {
    this.width = width;
    this.height = height;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;

    const ctx = this.offscreenCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to obtain 2D context for StaticLayer offscreen canvas.');
    }
    this.offscreenCtx = ctx;
  }

  /**
   * Pre-renders static elements (background color, crisp grid lines, path line track).
   */
  public renderStatic(path: Path): void {
    const ctx = this.offscreenCtx;

    // 1. Draw dark background
    ctx.fillStyle = '#14161f';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Draw High-Visibility Placement Grid Lines (64x64 grid cells)
    const gridSize = 64;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Grid Intersection Accent Dots
    ctx.fillStyle = 'rgba(97, 175, 239, 0.25)';
    for (let x = 0; x <= this.width; x += gridSize) {
      for (let y = 0; y <= this.height; y += gridSize) {
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }

    // 3. Draw Path Track
    if (path.waypoints.length >= 2) {
      // Outer path border
      ctx.strokeStyle = '#2d3345';
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y);
      for (let i = 1; i < path.waypoints.length; i++) {
        ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y);
      }
      ctx.stroke();

      // Inner path fill
      ctx.strokeStyle = '#3e465e';
      ctx.lineWidth = 34;
      ctx.stroke();

      // Path centerline guide
      ctx.strokeStyle = '#88c0d0';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.isRendered = true;
  }

  /**
   * Blits pre-rendered offscreen canvas directly onto the main canvas context.
   */
  public blit(mainCtx: CanvasRenderingContext2D): void {
    if (!this.isRendered) return;
    mainCtx.drawImage(this.offscreenCanvas, 0, 0);
  }
}
