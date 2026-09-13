/**
 * MovementSystem.ts
 * System handling enemy movement along path waypoints, slow debuffs,
 * and end-of-path goal completion.
 */

import { EnemyStore } from '../entities/EnemyStore';
import { Path } from '../path/Path';

export type EnemyReachedEndCallback = (slot: number) => void;

export class MovementSystem {
  private path: Path;
  public onEnemyReachedEnd?: EnemyReachedEndCallback;

  constructor(path: Path, onEnemyReachedEnd?: EnemyReachedEndCallback) {
    this.path = path;
    this.onEnemyReachedEnd = onEnemyReachedEnd;
  }

  /**
   * Updates distance and positions for all active enemies.
   * Iterates backwards to safely handle O(1) swap-and-pop deletions.
   */
  public update(enemyStore: EnemyStore, dtMs: number, currentTimeMs: number): void {
    const dtSeconds = dtMs / 1000;
    const activeIndices = enemyStore.activeIndices;

    for (let i = enemyStore.activeCount - 1; i >= 0; i--) {
      const slot = activeIndices[i];

      // 1. Calculate effective speed considering slow debuffs
      let speed = enemyStore.speed[slot];
      if (enemyStore.slowExpiresAt[slot] > currentTimeMs) {
        speed *= enemyStore.slowMultiplier[slot];
      }

      // 2. Advance cumulative distance
      enemyStore.distanceTraveled[slot] += speed * dtSeconds;

      // 3. Query Path position
      const pos = this.path.getPositionAtDistance(enemyStore.distanceTraveled[slot]);
      enemyStore.x[slot] = pos.x;
      enemyStore.y[slot] = pos.y;

      // 4. Handle end-of-path reach
      if (pos.finished) {
        if (this.onEnemyReachedEnd) {
          this.onEnemyReachedEnd(slot);
        }
        enemyStore.kill(slot);
      }
    }
  }
}
