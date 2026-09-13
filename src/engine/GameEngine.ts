/**
 * GameEngine.ts
 * Core game engine orchestrating GameLoop, Path, StaticLayer, Renderer, SpatialGrid,
 * EnemyStore, TowerStore, ProjectileStore, ParticleStore, SpawnSystem, MovementSystem,
 * TargetingSystem, CombatSystem, EconomySystem, and SoundManager.
 */

import { GameLoop, type LoopMetrics } from './loop';
import { Path } from './path/Path';
import { DEFAULT_PATH_WAYPOINTS } from './config/pathConfig';
import { SpatialGrid } from './spatial/SpatialGrid';
import { StaticLayer } from './render/StaticLayer';
import { Renderer } from './render/Renderer';

import { EnemyStore } from './entities/EnemyStore';
import { TowerStore } from './entities/TowerStore';
import { ProjectileStore } from './entities/ProjectileStore';
import { ParticleStore } from './entities/ParticleStore';

import { SpawnSystem } from './systems/SpawnSystem';
import { MovementSystem } from './systems/MovementSystem';
import { TargetingSystem } from './systems/TargetingSystem';
import { CombatSystem } from './systems/CombatSystem';
import { EconomySystem } from './systems/EconomySystem';
import { SoundManager } from './audio/SoundManager';

import { getWave } from './config/waves';
import { runStressTest } from './devtools/StressTest';
import type { GameStatus } from './types';
import { useGameStore } from '../store/gameStore';

export class GameEngine {
  private loop: GameLoop;
  private path: Path;
  public readonly spatialGrid: SpatialGrid<number>;
  private staticLayer: StaticLayer;
  private renderer: Renderer | null = null;

  // Stores
  public readonly enemyStore: EnemyStore;
  public readonly towerStore: TowerStore;
  public readonly projectileStore: ProjectileStore;
  public readonly particleStore: ParticleStore;

  // Systems
  private spawnSystem: SpawnSystem;
  private movementSystem: MovementSystem;
  private targetingSystem: TargetingSystem;
  private combatSystem: CombatSystem;
  public readonly economy: EconomySystem;

  // Wave & Engine State
  private currentWaveNumber: number = 1;
  private maxWaves: number = 50;
  private waveTransitionTimerMs: number = 0;
  private waveTransitionDelayMs: number = 2000;
  private isWaitingForNextWave: boolean = false;
  private selectedTowerSlot: number = -1;
  private gameStatus: GameStatus = 'menu';

  // Status Change Callbacks
  public onStatusChange?: (status: GameStatus) => void;
  public onWaveChange?: (wave: number) => void;

  private width: number;
  private height: number;
  private totalElapsedMs: number = 0;

  constructor(width: number = 1280, height: number = 720) {
    this.width = width;
    this.height = height;

    SoundManager.init();

    this.path = new Path(DEFAULT_PATH_WAYPOINTS);
    this.spatialGrid = new SpatialGrid<number>(64);
    this.staticLayer = new StaticLayer(width, height);
    this.staticLayer.renderStatic(this.path);

    this.enemyStore = new EnemyStore(6000);
    this.towerStore = new TowerStore(150);
    this.projectileStore = new ProjectileStore(1200);
    this.particleStore = new ParticleStore(300);

    this.economy = new EconomySystem(500, 20);
    this.spawnSystem = new SpawnSystem();
    this.movementSystem = new MovementSystem(this.path, this.onEnemyReachedEnd);
    this.targetingSystem = new TargetingSystem();
    this.combatSystem = new CombatSystem(this.particleStore);

    this.economy.onGameOver = () => {
      SoundManager.play('game_over');
      this.setStatus('gameover');
    };

    this.loop = new GameLoop(this.update, this.render);

    this.initTestTowers();
  }

  private initTestTowers(): void {
    this.towerStore.place('gunner', 120, 90, this.economy);
    this.towerStore.place('frost', 180, 220, this.economy);
    this.towerStore.place('cannon', 330, 300, this.economy);
    this.towerStore.place('sniper', 450, 350, this.economy);
  }

  private onEnemyReachedEnd = (_slot: number): void => {
    SoundManager.play('base_damage');
    this.economy.damageBase(1);
  };

  public attachCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context from canvas element.');
    }

    this.renderer = new Renderer(ctx, this.staticLayer, this.width, this.height);
  }

  public start(): void {
    this.loop.start();
  }

  public stop(): void {
    this.loop.stop();
  }

  public pause(): void {
    this.loop.pause();
    this.gameStatus = 'paused';
  }

  public resume(): void {
    this.loop.resume();
    this.gameStatus = 'playing';
  }

  public setStatus(status: GameStatus): void {
    this.gameStatus = status;
    if (status === 'playing') {
      if (this.loop.isGamePaused()) {
        this.loop.resume();
      }
    } else if (status === 'paused') {
      this.loop.pause();
    }

    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  public startGame(): void {
    this.currentWaveNumber = 1;
    this.enemyStore.reset();
    this.projectileStore.reset();
    this.particleStore.reset();
    this.spawnSystem.startWave(getWave(1));
    this.isWaitingForNextWave = false;
    this.waveTransitionTimerMs = 0;
    this.totalElapsedMs = 0;

    SoundManager.play('wave_start');

    if (this.onWaveChange) {
      this.onWaveChange(1);
    }

    this.setStatus('playing');
  }

  public restartGame(): void {
    this.economy.reset(500, 20);
    this.towerStore.reset();
    this.initTestTowers();
    this.startGame();
  }

  public setSpeed(multiplier: number): void {
    this.loop.setSpeed(multiplier);
  }

  public selectTowerSlot(slot: number): void {
    this.selectedTowerSlot = slot;
  }

  public placeTower(typeId: string, rawX: number, rawY: number): boolean {
    const gridSize = 64;
    const snappedX = Math.floor(rawX / gridSize) * gridSize + gridSize / 2;
    const snappedY = Math.floor(rawY / gridSize) * gridSize + gridSize / 2;

    if (this.isPositionOnPath(snappedX, snappedY)) {
      return false;
    }

    if (this.getTowerAt(snappedX, snappedY) !== -1) {
      return false;
    }

    const slot = this.towerStore.place(typeId, snappedX, snappedY, this.economy);
    if (slot !== -1) {
      SoundManager.play('tower_place');
      this.particleStore.spawnBurst(snappedX, snappedY, '#98c379', 18);
      if (this.renderer) {
        this.renderer.addRipple(snappedX, snappedY, '#98c379');
      }
      return true;
    }
    return false;
  }

  /**
   * Repositions an existing placed tower to a new snapped grid coordinate.
   */
  public moveTower(slot: number, rawX: number, rawY: number): boolean {
    const gridSize = 64;
    const snappedX = Math.floor(rawX / gridSize) * gridSize + gridSize / 2;
    const snappedY = Math.floor(rawY / gridSize) * gridSize + gridSize / 2;

    const tower = this.towerStore.getTowerAtSlot(slot);
    if (!tower) return false;

    const oldX = tower.x;
    const oldY = tower.y;

    if (this.isPositionOnPath(snappedX, snappedY)) {
      return false;
    }

    const existingSlot = this.getTowerAt(snappedX, snappedY);
    if (existingSlot !== -1 && existingSlot !== slot) {
      return false;
    }

    if (oldX === snappedX && oldY === snappedY) {
      return true;
    }

    const success = this.towerStore.move(slot, snappedX, snappedY);
    if (success) {
      SoundManager.play('tower_place');
      this.particleStore.spawnBurst(oldX, oldY, '#e5c07b', 14);
      this.particleStore.spawnBurst(snappedX, snappedY, '#61afef', 22);
      if (this.renderer) {
        this.renderer.addRipple(oldX, oldY, '#e5c07b');
        this.renderer.addRipple(snappedX, snappedY, '#61afef');
      }
      return true;
    }
    return false;
  }

  public isPlacementPositionValid(relocatingSlot: number | null, rawX: number, rawY: number): boolean {
    const gridSize = 64;
    const snappedX = Math.floor(rawX / gridSize) * gridSize + gridSize / 2;
    const snappedY = Math.floor(rawY / gridSize) * gridSize + gridSize / 2;

    if (this.isPositionOnPath(snappedX, snappedY)) return false;

    const existingSlot = this.getTowerAt(snappedX, snappedY);
    if (existingSlot !== -1 && existingSlot !== relocatingSlot) return false;

    return true;
  }

  public upgradeTower(slot: number): boolean {
    return this.towerStore.upgrade(slot, this.economy);
  }

  public sellTower(slot: number): boolean {
    const success = this.towerStore.sell(slot, this.economy, 0.7);
    if (success && this.selectedTowerSlot === slot) {
      this.selectedTowerSlot = -1;
    }
    return success;
  }

  public getTowerAt(x: number, y: number): number {
    const activeTowers = this.towerStore.getActiveTowers();
    for (let i = 0; i < activeTowers.length; i++) {
      const t = activeTowers[i];
      if (Math.hypot(t.x - x, t.y - y) <= 24) {
        return t.slot;
      }
    }
    return -1;
  }

  public isPositionOnPath(x: number, y: number): boolean {
    const waypoints = this.path.waypoints;
    const pathWidthThreshold = 38;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const dist = this.distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= pathWidthThreshold) {
        return true;
      }
    }
    return false;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  public runStressTest(): void {
    this.setStatus('playing');
    runStressTest(this);
  }

  public getMetrics(): LoopMetrics {
    return this.loop.getMetrics();
  }

  public getEnemyCount(): number {
    return this.enemyStore.activeCount;
  }

  public getTowerCount(): number {
    return this.towerStore.getActiveTowers().length;
  }

  public getProjectileCount(): number {
    return this.projectileStore.getActiveProjectiles().length;
  }

  public getWaveNumber(): number {
    return this.currentWaveNumber;
  }

  private update = (dtMs: number): void => {
    if (this.gameStatus !== 'playing') {
      return;
    }

    this.totalElapsedMs += dtMs;

    this.spawnSystem.update(this.enemyStore, dtMs);
    this.movementSystem.update(this.enemyStore, dtMs, this.totalElapsedMs);

    this.spatialGrid.clear();
    const activeIndices = this.enemyStore.activeIndices;
    const activeCount = this.enemyStore.activeCount;
    for (let i = 0; i < activeCount; i++) {
      const slot = activeIndices[i];
      this.spatialGrid.insert(slot, this.enemyStore.x[slot], this.enemyStore.y[slot]);
    }

    this.targetingSystem.update(
      this.towerStore,
      this.enemyStore,
      this.projectileStore,
      this.spatialGrid,
      dtMs
    );

    this.combatSystem.update(
      this.projectileStore,
      this.enemyStore,
      this.economy,
      this.spatialGrid,
      dtMs,
      this.totalElapsedMs,
      this.particleStore,
      this.towerStore
    );

    this.particleStore.update(dtMs);

    if (this.spawnSystem.isWaveComplete(this.enemyStore)) {
      if (!this.isWaitingForNextWave) {
        this.isWaitingForNextWave = true;
        this.waveTransitionTimerMs = 0;
      } else {
        this.waveTransitionTimerMs += dtMs;
        if (this.waveTransitionTimerMs >= this.waveTransitionDelayMs) {
          if (this.currentWaveNumber < this.maxWaves) {
            this.currentWaveNumber++;
            this.spawnSystem.startWave(getWave(this.currentWaveNumber));
            this.isWaitingForNextWave = false;
            this.waveTransitionTimerMs = 0;

            SoundManager.play('wave_start');

            if (this.onWaveChange) {
              this.onWaveChange(this.currentWaveNumber);
            }
          } else {
            SoundManager.play('victory');
            this.setStatus('victory');
          }
        }
      }
    }
  };

  private render = (): void => {
    if (!this.renderer) return;

    const state = useGameStore.getState();
    const activeTypeId = state.selectedTowerTypeId;
    const relocatingSlot = state.relocatingTowerSlot;
    const hoverPos = state.mouseHoverPos;

    let isValidPosition = false;
    if (hoverPos) {
      isValidPosition = this.isPlacementPositionValid(relocatingSlot, hoverPos.x, hoverPos.y);
    }

    this.renderer.render(
      this.enemyStore,
      this.towerStore,
      this.projectileStore,
      this.particleStore,
      this.selectedTowerSlot,
      this.totalElapsedMs,
      {
        activeTypeId,
        relocatingSlot,
        hoverPos,
        isValidPosition,
        isPathPos: (x: number, y: number) => this.isPositionOnPath(x, y),
      }
    );
  };
}
