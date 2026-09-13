/**
 * ParticleStore.ts
 * Fixed-capacity object pool (capped at 300) for zero-allocation particle burst visual effects.
 */

export interface ParticleEntity {
  slot: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  lifeMs: number;
  maxLifeMs: number;
  size: number;
  active: boolean;
}

export class ParticleStore {
  public readonly capacity: number;
  private pool: ParticleEntity[];

  constructor(capacity: number = 300) {
    this.capacity = capacity;
    this.pool = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        slot: i,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        lifeMs: 0,
        maxLifeMs: 400,
        size: 3,
        active: false,
      };
    }
  }

  public reset(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i].active = false;
    }
  }

  public getActiveParticles(): ParticleEntity[] {
    const activeList: ParticleEntity[] = [];
    for (let i = 0; i < this.capacity; i++) {
      if (this.pool[i].active) {
        activeList.push(this.pool[i]);
      }
    }
    return activeList;
  }

  /**
   * Spawns a radial burst of particles at impact/death location.
   */
  public spawnBurst(x: number, y: number, color: string, count: number = 6): void {
    let spawned = 0;

    for (let i = 0; i < this.capacity && spawned < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.color = color;

        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 140; // 60 to 200 px/sec
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;

        p.lifeMs = 250 + Math.random() * 250; // 250ms to 500ms
        p.maxLifeMs = p.lifeMs;
        p.size = 2 + Math.random() * 2.5;

        spawned++;
      }
    }
  }

  /**
   * Updates positions and lifetimes of all active particles.
   */
  public update(dtMs: number): void {
    const dtSeconds = dtMs / 1000;

    for (let i = 0; i < this.capacity; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.lifeMs -= dtMs;
      if (p.lifeMs <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx * dtSeconds;
      p.y += p.vy * dtSeconds;
    }
  }
}
