/**
 * TargetingSystem.ts
 * Spatial grid-based target acquisition system for active towers with SFX triggers.
 */

import { TowerStore, type TowerEntity } from '../entities/TowerStore';
import { EnemyStore } from '../entities/EnemyStore';
import { ProjectileStore } from '../entities/ProjectileStore';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { TOWER_CONFIGS } from '../config/towers';
import { SoundManager } from '../audio/SoundManager';

export class TargetingSystem {
  public update(
    towerStore: TowerStore,
    enemyStore: EnemyStore,
    projectileStore: ProjectileStore,
    spatialGrid: SpatialGrid<number>,
    dtMs: number
  ): void {
    const activeTowers = towerStore.getActiveTowers();

    for (let i = 0; i < activeTowers.length; i++) {
      const tower = activeTowers[i];
      const tierConfig = towerStore.getTierConfig(tower);
      if (!tierConfig) continue;

      if (tower.cooldownRemainingMs > 0) {
        tower.cooldownRemainingMs -= dtMs;
      }

      if (tower.cooldownRemainingMs <= 0) {
        const targetSlot = this.acquireTarget(tower, tierConfig.range, enemyStore, spatialGrid);

        if (targetSlot !== -1) {
          const targetX = enemyStore.x[targetSlot];
          const targetY = enemyStore.y[targetSlot];
          const projectileSpeed = tower.typeId === 'sniper' ? 1200 : 700;

          projectileStore.spawn(
            tower.x,
            tower.y,
            targetSlot,
            targetX,
            targetY,
            tierConfig.damage,
            projectileSpeed,
            tierConfig.splashRadius || 0,
            tierConfig.slowFactor || 0,
            tierConfig.slowDurationMs || 0,
            tower.typeId,
            tower.slot
          );

          // SFX Trigger with max-concurrency instance capping
          SoundManager.play(`fire_${tower.typeId}`);

          tower.cooldownRemainingMs += tierConfig.fireRateMs;
          tower.targetEnemyIndex = targetSlot;
        }
      }
    }
  }

  private acquireTarget(
    tower: TowerEntity,
    range: number,
    enemyStore: EnemyStore,
    spatialGrid: SpatialGrid<number>
  ): number {
    const baseConfig = TOWER_CONFIGS[tower.typeId];
    if (!baseConfig) return -1;

    const candidates = spatialGrid.queryRadius(tower.x, tower.y, range);
    let bestTargetSlot = -1;
    let maxDistanceTraveled = -1;
    const rangeSq = range * range;

    for (let i = 0; i < candidates.length; i++) {
      const enemySlot = candidates[i];

      if (enemyStore.active[enemySlot] === 0) continue;

      if (!baseConfig.targetsFlying && enemyStore.flying[enemySlot] === 1) {
        continue;
      }

      const dx = enemyStore.x[enemySlot] - tower.x;
      const dy = enemyStore.y[enemySlot] - tower.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= rangeSq) {
        const distTraveled = enemyStore.distanceTraveled[enemySlot];
        if (distTraveled > maxDistanceTraveled) {
          maxDistanceTraveled = distTraveled;
          bestTargetSlot = enemySlot;
        }
      }
    }

    return bestTargetSlot;
  }
}
