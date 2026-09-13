/**
 * Renderer.ts
 * Canvas 2D rendering pipeline with high-visibility placement grid highlights,
 * green/red validity snap boxes, ghost tower drag previews, sprite rendering, and draw-call batching.
 */

import { StaticLayer } from './StaticLayer';
import { EnemyStore } from '../entities/EnemyStore';
import { TowerStore } from '../entities/TowerStore';
import { ProjectileStore } from '../entities/ProjectileStore';
import { ParticleStore } from '../entities/ParticleStore';
import { ENEMY_TYPE_LIST } from '../config/enemies';
import { TOWER_COLOR_MAP, TOWER_CONFIGS } from '../config/towers';
import { AssetLoader } from '../assets/AssetLoader';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private staticLayer: StaticLayer;
  public readonly width: number;
  public readonly height: number;

  constructor(
    ctx: CanvasRenderingContext2D,
    staticLayer: StaticLayer,
    width: number = 1280,
    height: number = 720
  ) {
    this.ctx = ctx;
    this.staticLayer = staticLayer;
    this.width = width;
    this.height = height;

    AssetLoader.loadAll();
  }

  private ripples: Array<{ x: number; y: number; startTimeMs: number; color: string }> = [];

  public addRipple(x: number, y: number, color: string = '#98c379'): void {
    this.ripples.push({ x, y, startTimeMs: performance.now(), color });
    if (this.ripples.length > 20) {
      this.ripples.shift();
    }
  }

  public render(
    enemyStore: EnemyStore,
    towerStore: TowerStore,
    projectileStore: ProjectileStore,
    particleStore: ParticleStore,
    selectedTowerSlot: number = -1,
    currentTimeMs: number = 0,
    placementState?: {
      activeTypeId: string | null;
      relocatingSlot: number | null;
      hoverPos: { x: number; y: number } | null;
      isValidPosition: boolean;
      isPathPos?: (x: number, y: number) => boolean;
    }
  ): void {
    const ctx = this.ctx;

    // 1. Blit static offscreen layer
    this.staticLayer.blit(ctx);

    // 2. Render Placement / Relocation Grid Highlight Overlay & Ghost Preview
    if (placementState && (placementState.activeTypeId || placementState.relocatingSlot !== null)) {
      this.renderPlacementGrid(ctx, placementState, towerStore, currentTimeMs);
    }

    // 3. Render Sprite Towers
    this.renderSpriteTowers(towerStore, selectedTowerSlot, placementState?.relocatingSlot ?? -1, currentTimeMs);

    // 4. Render Sprite Enemies
    const isHighDensity = enemyStore.activeCount > 1500;
    this.renderSpriteEnemies(enemyStore, currentTimeMs, isHighDensity);

    // 5. Render Projectiles
    this.renderSpriteProjectiles(projectileStore);

    // 6. Render Particles
    if (!isHighDensity) {
      this.renderParticles(particleStore);
    }

    // 7. Render Placement Shockwave Ripples
    this.renderRipples(currentTimeMs);
  }

  private renderRipples(currentTimeMs: number): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      const elapsed = now - r.startTimeMs;
      if (elapsed > 450) {
        this.ripples.splice(i, 1);
        continue;
      }

      const progress = elapsed / 450;
      const radius = progress * 64;
      const alpha = (1 - progress) * 0.75;

      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = r.color;
      ctx.globalAlpha = alpha * 0.25;
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderPlacementGrid(
    ctx: CanvasRenderingContext2D,
    state: {
      activeTypeId: string | null;
      relocatingSlot: number | null;
      hoverPos: { x: number; y: number } | null;
      isValidPosition: boolean;
      isPathPos?: (x: number, y: number) => boolean;
    },
    towerStore: TowerStore,
    currentTimeMs: number
  ): void {
    const gridSize = 64;

    // A. Dark Blueprint Backdrop Overlay
    ctx.fillStyle = 'rgba(10, 16, 30, 0.65)';
    ctx.fillRect(0, 0, this.width, this.height);

    // B. High-Contrast Blueprint Grid Mesh Overlay
    const pulseAlpha = 0.15 + Math.sin(currentTimeMs / 200) * 0.08;
    ctx.strokeStyle = `rgba(0, 210, 255, ${pulseAlpha})`;
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

    // Grid Intersection Accent Crosshairs (+)
    ctx.fillStyle = '#00d2ff';
    for (let x = 0; x <= this.width; x += gridSize) {
      for (let y = 0; y <= this.height; y += gridSize) {
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    // C. Grid Matrix Cell Boxes (Explicit Green ALLOWED Boxes vs Red NOT ALLOWED Boxes across entire map)
    const activeTowers = towerStore.getActiveTowers();
    const isRelocating = state.relocatingSlot !== null;

    for (let x = 0; x < this.width; x += gridSize) {
      for (let y = 0; y < this.height; y += gridSize) {
        const centerX = x + gridSize / 2;
        const centerY = y + gridSize / 2;
        const cellX = Math.floor(x / gridSize);
        const cellY = Math.floor(y / gridSize);

        const isOnPath = state.isPathPos ? state.isPathPos(centerX, centerY) : false;

        // Exact grid cell matching for occupied towers
        let occupiedSlot = -1;
        for (let t = 0; t < activeTowers.length; t++) {
          const tow = activeTowers[t];
          const towCellX = Math.floor(tow.x / gridSize);
          const towCellY = Math.floor(tow.y / gridSize);
          if (towCellX === cellX && towCellY === cellY) {
            occupiedSlot = tow.slot;
            break;
          }
        }

        const isCurrentRelocatingOrigin = isRelocating && occupiedSlot === state.relocatingSlot;
        const isOccupiedByOther = occupiedSlot !== -1 && !isCurrentRelocatingOrigin;
        const isAllowed = !isOnPath && !isOccupiedByOther;

        if (isCurrentRelocatingOrigin) {
          // Origin Cell Box (Cyan/Gold)
          ctx.fillStyle = 'rgba(97, 175, 239, 0.22)';
          ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
          ctx.strokeStyle = '#61afef';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
        } else if (isAllowed) {
          // ALLOWED BOX (Green Fill + Green Box Border)
          ctx.fillStyle = 'rgba(152, 195, 121, 0.16)';
          ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);
          ctx.strokeStyle = 'rgba(152, 195, 121, 0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

          ctx.fillStyle = 'rgba(152, 195, 121, 0.6)';
          ctx.fillRect(centerX - 1.5, centerY - 1.5, 3, 3);
        } else if (isOccupiedByOther) {
          // OCCUPIED PRESENT TOWER CELL -> VIVID RED NOT ALLOWED BOX
          ctx.fillStyle = 'rgba(224, 108, 117, 0.35)';
          ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

          ctx.strokeStyle = '#e06c75';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

          // Heavy Red X Mark over occupied cell
          ctx.strokeStyle = 'rgba(224, 108, 117, 0.75)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8);
          ctx.lineTo(x + gridSize - 8, y + gridSize - 8);
          ctx.moveTo(x + gridSize - 8, y + 8);
          ctx.lineTo(x + 8, y + gridSize - 8);
          ctx.stroke();

          // Cell Badge
          ctx.fillStyle = '#e06c75';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('OCCUPIED', centerX, y + gridSize - 6);
        } else {
          // PATH CELL -> RED NOT ALLOWED BOX
          ctx.fillStyle = 'rgba(224, 108, 117, 0.22)';
          ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

          ctx.strokeStyle = 'rgba(224, 108, 117, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

          ctx.strokeStyle = 'rgba(224, 108, 117, 0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 8);
          ctx.lineTo(x + gridSize - 8, y + gridSize - 8);
          ctx.moveTo(x + gridSize - 8, y + 8);
          ctx.lineTo(x + 8, y + gridSize - 8);
          ctx.stroke();
        }
      }
    }

    // D. Header Mode Status Banner & Bottom Legend
    const modeText = isRelocating
      ? '⚡ TOWER RELOCATION MODE — Move Tower to New Position'
      : '🔨 TOWER PLACEMENT MODE — Click Cell to Build';
    const modeColor = isRelocating ? '#61afef' : '#98c379';

    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    const textWidth = ctx.measureText(modeText).width;
    const bannerW = textWidth + 36;
    const bannerH = 30;
    const bannerX = (this.width - bannerW) / 2;
    const bannerY = 16;

    ctx.fillStyle = 'rgba(15, 17, 26, 0.9)';
    ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
    ctx.strokeStyle = modeColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

    ctx.fillStyle = modeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeText, this.width / 2, bannerY + bannerH / 2);

    // Bottom Legend Pill
    const legendW = 270;
    const legendH = 26;
    const legendX = this.width - legendW - 16;
    const legendY = this.height - legendH - 16;

    ctx.fillStyle = 'rgba(15, 17, 26, 0.9)';
    ctx.fillRect(legendX, legendY, legendW, legendH);
    ctx.strokeStyle = '#3b4252';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendW, legendH);

    // Legend Allowed Item
    ctx.fillStyle = '#98c379';
    ctx.fillRect(legendX + 12, legendY + 7, 12, 12);
    ctx.fillStyle = '#d8dee9';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Allowed Box', legendX + 30, legendY + 14);

    // Legend Not Allowed Item
    ctx.fillStyle = '#e06c75';
    ctx.fillRect(legendX + 130, legendY + 7, 12, 12);
    ctx.fillStyle = '#d8dee9';
    ctx.fillText('Not Allowed Box', legendX + 148, legendY + 14);

    ctx.restore();

    // E. Origin Tower Footprint & Energy Vector Cable (when relocating)
    let origX = -1;
    let origY = -1;
    let relocTower = isRelocating ? towerStore.getTowerAtSlot(state.relocatingSlot!) : null;

    if (relocTower) {
      origX = relocTower.x;
      origY = relocTower.y;

      // Origin Ring & Ghost Footprint
      ctx.save();
      ctx.beginPath();
      ctx.arc(origX, origY, 28, 0, Math.PI * 2);
      ctx.strokeStyle = '#e5c07b';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.lineDashOffset = (currentTimeMs / 30) % 12;
      ctx.stroke();

      const origSprite = AssetLoader.getSprite(`tower_${relocTower.typeId}`);
      if (origSprite) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(origSprite, origX - 24, origY - 24, 48, 48);
      }

      // Origin Badge
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#e5c07b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('[ORIGIN]', origX, origY + 34);
      ctx.restore();
    }

    // F. Target Hover Snapped Cell & Trajectory Vector
    if (state.hoverPos) {
      const snappedX = Math.floor(state.hoverPos.x / gridSize) * gridSize;
      const snappedY = Math.floor(state.hoverPos.y / gridSize) * gridSize;
      const centerX = snappedX + gridSize / 2;
      const centerY = snappedY + gridSize / 2;

      const isValid = state.isValidPosition;
      const fillColor = isValid ? 'rgba(152, 195, 121, 0.35)' : 'rgba(224, 108, 117, 0.35)';
      const strokeColor = isValid ? '#98c379' : '#e06c75';

      // Motion Trajectory Laser Cable (connecting origin to hover position)
      if (origX !== -1 && origY !== -1) {
        const dx = centerX - origX;
        const dy = centerY - origY;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(origX, origY);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = -(currentTimeMs / 20) % 16;
          ctx.stroke();
          ctx.restore();

          // Distance Pill
          const midX = (origX + centerX) / 2;
          const midY = (origY + centerY) / 2;
          ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
          ctx.fillRect(midX - 45, midY - 11, 90, 22);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - 45, midY - 11, 90, 22);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(dist)}px`, midX, midY);
        }
      }

      // Snapped Cell Fill
      ctx.fillStyle = fillColor;
      ctx.fillRect(snappedX, snappedY, gridSize, gridSize);

      // Tech Corner Brackets on Target Cell
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      const bracketL = 14;

      ctx.beginPath();
      // Top-Left
      ctx.moveTo(snappedX, snappedY + bracketL);
      ctx.lineTo(snappedX, snappedY);
      ctx.lineTo(snappedX + bracketL, snappedY);
      // Top-Right
      ctx.moveTo(snappedX + gridSize - bracketL, snappedY);
      ctx.lineTo(snappedX + gridSize, snappedY);
      ctx.lineTo(snappedX + gridSize, snappedY + bracketL);
      // Bottom-Left
      ctx.moveTo(snappedX, snappedY + gridSize - bracketL);
      ctx.lineTo(snappedX, snappedY + gridSize);
      ctx.lineTo(snappedX + bracketL, snappedY + gridSize);
      // Bottom-Right
      ctx.moveTo(snappedX + gridSize - bracketL, snappedY + gridSize);
      ctx.lineTo(snappedX + gridSize, snappedY + gridSize);
      ctx.lineTo(snappedX + gridSize, snappedY + gridSize - bracketL);
      ctx.stroke();

      // Pulsing Cell Center Box
      const pulse = Math.sin(currentTimeMs / 150) * 2;
      ctx.strokeRect(snappedX - pulse, snappedY - pulse, gridSize + pulse * 2, gridSize + pulse * 2);

      // Tower Type & Range Calculation
      let previewRange = 140;
      let towerTypeId = state.activeTypeId;

      if (relocTower) {
        towerTypeId = relocTower.typeId;
        const tierCfg = towerStore.getTierConfig(relocTower);
        if (tierCfg) previewRange = tierCfg.range;
      } else if (towerTypeId && TOWER_CONFIGS[towerTypeId]) {
        previewRange = TOWER_CONFIGS[towerTypeId].range;
      }

      // Ghost Tower Sprite Preview
      if (towerTypeId) {
        const sprite = AssetLoader.getSprite(`tower_${towerTypeId}`);
        if (sprite) {
          ctx.save();
          ctx.globalAlpha = isValid ? 0.85 : 0.45;
          ctx.drawImage(sprite, centerX - 24, centerY - 24, 48, 48);
          ctx.restore();
        }
      }

      // Tower Range Preview Ring
      const ringColor = TOWER_COLOR_MAP[towerTypeId || 'gunner'] || strokeColor;

      ctx.beginPath();
      ctx.arc(centerX, centerY, previewRange, 0, Math.PI * 2);
      ctx.fillStyle = isValid ? 'rgba(152, 195, 121, 0.08)' : 'rgba(224, 108, 117, 0.08)';
      ctx.fill();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(currentTimeMs / 25) % 14;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private renderSpriteTowers(
    towerStore: TowerStore,
    selectedTowerSlot: number,
    relocatingSlot: number,
    currentTimeMs: number
  ): void {
    const ctx = this.ctx;
    const activeTowers = towerStore.getActiveTowers();
    const spriteSize = 48;
    const halfSize = spriteSize / 2;

    for (let i = 0; i < activeTowers.length; i++) {
      const tower = activeTowers[i];
      const { x, y, typeId, tier, slot, lastKillTimeMs, killCount } = tower;

      if (
        x + halfSize < 0 ||
        x - halfSize > this.width ||
        y + halfSize < 0 ||
        y - halfSize > this.height
      ) {
        continue;
      }

      const isRelocatingThis = slot === relocatingSlot;
      ctx.globalAlpha = isRelocatingThis ? 0.35 : 1.0;

      const tierConfig = towerStore.getTierConfig(tower);

      // Selected Tower Range Ring
      if (slot === selectedTowerSlot && tierConfig) {
        const color = TOWER_COLOR_MAP[typeId] || '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, tierConfig.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Preloaded Sprite
      const sprite = AssetLoader.getSprite(`tower_${typeId}`);
      if (sprite) {
        ctx.drawImage(sprite, x - halfSize, y - halfSize, spriteSize, spriteSize);
      }

      // Red Warning Border on Other Occupied Towers during Relocation Mode
      if (relocatingSlot !== -1 && !isRelocatingThis) {
        ctx.strokeStyle = 'rgba(224, 108, 117, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 28, y - 28, 56, 56);
      }

      // Tier Badge
      ctx.fillStyle = '#181a1f';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`T${tier}`, x, y + 14);

      // Persistent Kill Count Star Badge
      if (killCount > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 17, 26, 0.85)';
        ctx.fillRect(x - 22, y - 30, 44, 16);
        ctx.strokeStyle = '#98c379';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 22, y - 30, 44, 16);

        // Mini Green Star Icon
        this.drawStar(ctx, x - 12, y - 22, 5, 5, 2);
        ctx.fillStyle = '#98c379';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${killCount}`, x - 4, y - 21);
        ctx.restore();
      }

      // Animated Floating Green Star Kill Visual Effect
      const killElapsed = currentTimeMs - lastKillTimeMs;
      if (lastKillTimeMs > 0 && killElapsed >= 0 && killElapsed < 800) {
        const progress = killElapsed / 800;
        const alpha = 1 - progress;
        const floatY = y - 28 - progress * 32;
        const starSize = 10 + Math.sin(progress * Math.PI) * 6;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer Glow Ring
        ctx.beginPath();
        ctx.arc(x, floatY, starSize + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(152, 195, 121, 0.3)';
        ctx.fill();

        // 5-Pointed Neon Green Star
        this.drawStar(ctx, x, floatY, 5, starSize, starSize * 0.45);
        ctx.fillStyle = '#98c379';
        ctx.fill();
        ctx.strokeStyle = '#181a1f';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Floating "+1 KILL" Text Popup
        ctx.fillStyle = '#a6e22e';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+1 KILL', x, floatY - starSize - 4);

        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number = 5,
    outerRadius: number = 10,
    innerRadius: number = 4
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  private renderSpriteEnemies(
    enemyStore: EnemyStore,
    currentTimeMs: number,
    isHighDensity: boolean
  ): void {
    const ctx = this.ctx;
    const activeIndices = enemyStore.activeIndices;
    const activeCount = enemyStore.activeCount;

    for (let t = 0; t < ENEMY_TYPE_LIST.length; t++) {
      const typeDef = ENEMY_TYPE_LIST[t];
      const radius = typeDef.radius;

      ctx.beginPath();
      let countInBatch = 0;

      for (let i = 0; i < activeCount; i++) {
        const slot = activeIndices[i];
        if (enemyStore.typeIndex[slot] !== t) continue;
        if (currentTimeMs - enemyStore.lastHitTimeMs[slot] < 100) continue;

        const x = enemyStore.x[slot];
        const y = enemyStore.y[slot];

        if (
          x + radius < 0 ||
          x - radius > this.width ||
          y + radius < 0 ||
          y - radius > this.height
        ) {
          continue;
        }

        ctx.moveTo(x + radius, y);
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        countInBatch++;
      }

      if (countInBatch > 0) {
        ctx.fillStyle = typeDef.color;
        ctx.fill();
        ctx.strokeStyle = '#1e222a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (let i = 0; i < activeCount; i++) {
      const slot = activeIndices[i];
      const x = enemyStore.x[slot];
      const y = enemyStore.y[slot];
      const typeIdx = enemyStore.typeIndex[slot];
      const typeDef = ENEMY_TYPE_LIST[typeIdx];
      const radius = typeDef.radius;

      if (
        x + radius < 0 ||
        x - radius > this.width ||
        y + radius < 0 ||
        y - radius > this.height
      ) {
        continue;
      }

      const walkWobble = !isHighDensity ? Math.sin((currentTimeMs / 100) + slot) * 0.1 : 0;
      const isHitFlashing = currentTimeMs - enemyStore.lastHitTimeMs[slot] < 100;
      const diameter = radius * 2 + 12;
      const halfSize = diameter / 2;

      const sprite = AssetLoader.getSprite(`enemy_${typeDef.id}`);

      if (sprite) {
        ctx.save();
        ctx.translate(x, y);
        if (walkWobble !== 0) ctx.rotate(walkWobble);

        if (isHitFlashing) {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        } else {
          ctx.drawImage(sprite, -halfSize, -halfSize, diameter, diameter);
        }
        ctx.restore();
      }

      if (enemyStore.flying[slot] === 1) {
        ctx.beginPath();
        ctx.ellipse(x, y + radius + 4, radius * 0.8, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
      }

      const shieldHp = enemyStore.shieldHp[slot];
      if (shieldHp > 0) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      if (enemyStore.slowExpiresAt[slot] > currentTimeMs) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#88c0d0';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const hp = enemyStore.hp[slot];
      const maxHp = enemyStore.maxHp[slot];
      if (hp < maxHp) {
        const barWidth = radius * 2;
        const barHeight = 4;
        const barX = x - radius;
        const barY = y - radius - 8;
        const hpPercent = Math.max(0, hp / maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = hpPercent > 0.5 ? '#98c379' : hpPercent > 0.2 ? '#e5c07b' : '#e06c75';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      }
    }
  }

  private renderSpriteProjectiles(projectileStore: ProjectileStore): void {
    const ctx = this.ctx;
    const activeProjectiles = projectileStore.getActiveProjectiles();

    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      const { x, y, sourceTowerType, splashRadius } = p;

      if (x < 0 || x > this.width || y < 0 || y > this.height) {
        continue;
      }

      const sprite = AssetLoader.getSprite(`proj_${sourceTowerType}`);
      if (sprite) {
        const r = splashRadius > 0 ? 8 : 4;
        ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      }
    }
  }

  private renderParticles(particleStore: ParticleStore): void {
    const ctx = this.ctx;
    const particles = particleStore.getActiveParticles();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
        continue;
      }

      const alpha = Math.max(0, p.lifeMs / p.maxLifeMs);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }
}
