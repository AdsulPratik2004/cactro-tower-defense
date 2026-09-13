/**
 * ProjectileStore.ts
 * Object-pooled manager for active projectile instances (capacity ~1200).
 * Reuses pre-allocated projectile objects to avoid per-shot memory allocations.
 */

export interface ProjectileEntity {
  slot: number;
  x: number;
  y: number;
  speed: number; // pixels per second
  damage: number;
  splashRadius: number;
  slowFactor: number;
  slowDurationMs: number;
  targetEnemyIndex: number;
  targetX: number;
  targetY: number;
  sourceTowerType: string;
  sourceTowerSlot: number;
  active: boolean;
}

export class ProjectileStore {
  public readonly capacity: number;
  private pool: ProjectileEntity[];

  constructor(capacity: number = 1200) {
    this.capacity = capacity;
    this.pool = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        slot: i,
        x: 0,
        y: 0,
        speed: 600,
        damage: 10,
        splashRadius: 0,
        slowFactor: 0,
        slowDurationMs: 0,
        targetEnemyIndex: -1,
        targetX: 0,
        targetY: 0,
        sourceTowerType: 'gunner',
        sourceTowerSlot: -1,
        active: false,
      };
    }
  }

  public reset(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i].active = false;
    }
  }

  public getActiveProjectiles(): ProjectileEntity[] {
    const activeList: ProjectileEntity[] = [];
    for (let i = 0; i < this.capacity; i++) {
      if (this.pool[i].active) {
        activeList.push(this.pool[i]);
      }
    }
    return activeList;
  }

  /**
   * Claims a free projectile slot from the pool.
   * Returns slot index, or -1 if capacity is exhausted.
   */
  public spawn(
    startX: number,
    startY: number,
    targetEnemyIndex: number,
    targetX: number,
    targetY: number,
    damage: number,
    speed: number = 650,
    splashRadius: number = 0,
    slowFactor: number = 0,
    slowDurationMs: number = 0,
    sourceTowerType: string = 'gunner',
    sourceTowerSlot: number = -1
  ): number {
    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = startX;
        p.y = startY;
        p.targetEnemyIndex = targetEnemyIndex;
        p.targetX = targetX;
        p.targetY = targetY;
        p.damage = damage;
        p.speed = speed;
        p.splashRadius = splashRadius;
        p.slowFactor = slowFactor;
        p.slowDurationMs = slowDurationMs;
        p.sourceTowerType = sourceTowerType;
        p.sourceTowerSlot = sourceTowerSlot;
        return i;
      }
    }

    console.warn('[ProjectileStore] Capacity exhausted!');
    return -1;
  }

  /**
   * Deactivates a projectile slot, returning it to the pool.
   */
  public deactivate(slot: number): void {
    if (slot >= 0 && slot < this.capacity) {
      this.pool[slot].active = false;
    }
  }
}
