/**
 * AssetLoader.ts
 * In-memory preloader and cache for tower, enemy, and projectile sprite assets.
 * Pre-renders crisp top-down sprite graphics to offscreen canvases / ImageBitmaps
 * at startup so zero image loading occurs inside the 60 FPS render loop.
 */

import { TOWER_COLOR_MAP } from '../config/towers';
import { ENEMY_TYPES } from '../config/enemies';

export type SpriteCache = Record<string, HTMLCanvasElement>;

class AssetLoaderClass {
  private cache: SpriteCache = {};
  private isLoaded: boolean = false;

  /**
   * Preloads and caches all sprite assets once at startup.
   */
  public async loadAll(): Promise<SpriteCache> {
    if (this.isLoaded) return this.cache;

    // 1. Generate Enemy Sprites
    Object.keys(ENEMY_TYPES).forEach((typeId) => {
      const enemy = ENEMY_TYPES[typeId];
      this.cache[`enemy_${typeId}`] = this.createEnemySprite(enemy.color, enemy.radius, enemy.flying, typeId);
    });

    // 2. Generate Tower Sprites
    Object.keys(TOWER_COLOR_MAP).forEach((typeId) => {
      const color = TOWER_COLOR_MAP[typeId];
      this.cache[`tower_${typeId}`] = this.createTowerSprite(color, typeId);
    });

    // 3. Generate Projectile Sprites
    this.cache['proj_gunner'] = this.createProjectileSprite('#e5c07b', 4);
    this.cache['proj_cannon'] = this.createProjectileSprite('#e06c75', 8);
    this.cache['proj_frost'] = this.createProjectileSprite('#00d2ff', 5);
    this.cache['proj_sniper'] = this.createProjectileSprite('#98c379', 6);

    this.isLoaded = true;
    return this.cache;
  }

  public getSprite(assetId: string): HTMLCanvasElement | null {
    return this.cache[assetId] || null;
  }

  /**
   * Creates a top-down enemy sprite with metallic plating, direction indicator, and glow.
   */
  private createEnemySprite(color: string, radius: number, flying: boolean, typeId: string): HTMLCanvasElement {
    const size = radius * 2 + 12;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    // Base body circle with radial gradient
    const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, '#181a1f');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#101216';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner armor plate or wing detailing
    if (flying) {
      // Flier wings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(cx - radius * 0.8, cy, radius * 0.5, radius * 0.2, -0.3, 0, Math.PI * 2);
      ctx.ellipse(cx + radius * 0.8, cy, radius * 0.5, radius * 0.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (typeId === 'brute' || typeId === 'boss') {
      // Heavy armor plates
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(cx - radius * 0.5, cy - radius * 0.5, radius, radius);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - radius * 0.5, cy - radius * 0.5, radius, radius);
    }

    // Directional visor dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + radius * 0.4, cy, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  /**
   * Creates a detailed top-down turret tower sprite with barrel and base plate.
   */
  private createTowerSprite(color: string, typeId: string): HTMLCanvasElement {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    // Base square mount
    ctx.fillStyle = '#21252b';
    ctx.fillRect(4, 4, size - 8, size - 8);
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#181a1f';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Turret Barrel
    ctx.fillStyle = color;
    if (typeId === 'cannon') {
      ctx.fillRect(cx - 5, cy - 18, 10, 16);
    } else if (typeId === 'sniper') {
      ctx.fillRect(cx - 3, cy - 22, 6, 20);
    } else if (typeId === 'frost') {
      ctx.beginPath();
      ctx.arc(cx, cy - 10, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gunner (Twin barrels)
      ctx.fillRect(cx - 6, cy - 16, 4, 14);
      ctx.fillRect(cx + 2, cy - 16, 4, 14);
    }

    // Center dome cap
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    return canvas;
  }

  private createProjectileSprite(color: string, radius: number): HTMLCanvasElement {
    const size = radius * 2 + 4;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
  }
}

export const AssetLoader = new AssetLoaderClass();
