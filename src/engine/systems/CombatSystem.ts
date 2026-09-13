/**
 * CombatSystem.ts
 * Manages projectile tracking, collision detection, damage calculations,
 * SFX triggers, hit flash timestamps, particle bursts, and splitOnDeath.
 */

import { ProjectileStore, type ProjectileEntity } from '../entities/ProjectileStore';
import { EnemyStore } from '../entities/EnemyStore';
import { TowerStore } from '../entities/TowerStore';
import { ParticleStore } from '../entities/ParticleStore';
import { EconomySystem } from './EconomySystem';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { ENEMY_TYPE_LIST } from '../config/enemies';
import { SoundManager } from '../audio/SoundManager';

export class CombatSystem {
  private particleStore: ParticleStore | null = null;

  constructor(particleStore?: ParticleStore) {
    if (particleStore) {
      this.particleStore = particleStore;
    }
  }

  public update(
    projectileStore: ProjectileStore,
    enemyStore: EnemyStore,
    economy: EconomySystem,
    spatialGrid: SpatialGrid<number>,
    dtMs: number,
    currentTimeMs: number,
    particleStore?: ParticleStore,
    towerStore?: TowerStore
  ): void {
    if (particleStore) {
      this.particleStore = particleStore;
    }

    const dtSeconds = dtMs / 1000;
    const activeProjectiles = projectileStore.getActiveProjectiles();

    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      const targetSlot = p.targetEnemyIndex;

      const isTargetAlive = targetSlot >= 0 && enemyStore.active[targetSlot] === 1;

      if (isTargetAlive) {
        p.targetX = enemyStore.x[targetSlot];
        p.targetY = enemyStore.y[targetSlot];
      } else {
        if (p.splashRadius <= 0) {
          projectileStore.deactivate(p.slot);
          continue;
        }
      }

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      const moveDist = p.speed * dtSeconds;

      if (dist <= moveDist || dist < 10) {
        p.x = p.targetX;
        p.y = p.targetY;

        this.resolveImpact(p, targetSlot, isTargetAlive, enemyStore, economy, spatialGrid, currentTimeMs, towerStore);
        projectileStore.deactivate(p.slot);
      } else {
        p.x += (dx / dist) * moveDist;
        p.y += (dy / dist) * moveDist;
      }
    }
  }

  private resolveImpact(
    p: ProjectileEntity,
    targetSlot: number,
    isTargetAlive: boolean,
    enemyStore: EnemyStore,
    economy: EconomySystem,
    spatialGrid: SpatialGrid<number>,
    currentTimeMs: number,
    towerStore?: TowerStore
  ): void {
    if (p.splashRadius > 0) {
      const candidates = spatialGrid.queryRadius(p.x, p.y, p.splashRadius);
      const splashSq = p.splashRadius * p.splashRadius;

      for (let j = 0; j < candidates.length; j++) {
        const enemySlot = candidates[j];
        if (enemyStore.active[enemySlot] === 0) continue;

        const edx = enemyStore.x[enemySlot] - p.x;
        const edy = enemyStore.y[enemySlot] - p.y;
        if (edx * edx + edy * edy <= splashSq) {
          this.applyDamageToEnemy(enemySlot, p.damage, p.slowFactor, p.slowDurationMs, enemyStore, economy, currentTimeMs, p.sourceTowerSlot, towerStore);
        }
      }
    } else if (isTargetAlive) {
      this.applyDamageToEnemy(targetSlot, p.damage, p.slowFactor, p.slowDurationMs, enemyStore, economy, currentTimeMs, p.sourceTowerSlot, towerStore);
    }
  }

  private applyDamageToEnemy(
    slot: number,
    rawDamage: number,
    slowFactor: number,
    slowDurationMs: number,
    enemyStore: EnemyStore,
    economy: EconomySystem,
    currentTimeMs: number,
    sourceTowerSlot: number = -1,
    towerStore?: TowerStore
  ): void {
    if (enemyStore.active[slot] === 0) return;

    enemyStore.lastHitTimeMs[slot] = currentTimeMs;
    let remainingDamage = rawDamage;

    if (enemyStore.shieldHp[slot] > 0) {
      if (enemyStore.shieldHp[slot] >= remainingDamage) {
        enemyStore.shieldHp[slot] -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= enemyStore.shieldHp[slot];
        enemyStore.shieldHp[slot] = 0;
      }
    }

    if (remainingDamage > 0) {
      const armor = enemyStore.armor[slot];
      const netDamage = Math.max(1, remainingDamage - armor);
      enemyStore.hp[slot] -= netDamage;
    }

    if (slowFactor > 0) {
      enemyStore.slowMultiplier[slot] = slowFactor;
      enemyStore.slowExpiresAt[slot] = currentTimeMs + slowDurationMs;
    }

    if (enemyStore.hp[slot] <= 0) {
      const typeIdx = enemyStore.typeIndex[slot];
      const typeDef = ENEMY_TYPE_LIST[typeIdx];

      economy.addCurrency(typeDef.reward);
      economy.addScore(typeDef.reward * 10);

      const deathX = enemyStore.x[slot];
      const deathY = enemyStore.y[slot];
      const deathDistance = enemyStore.distanceTraveled[slot];
      const splitDef = typeDef.splitOnDeath;

      // Particle Burst & Death SFX
      if (this.particleStore) {
        this.particleStore.spawnBurst(deathX, deathY, typeDef.color, 6);
      }
      SoundManager.play('enemy_death');

      // Record Tower Kill for Green Star Visual Effect
      if (sourceTowerSlot >= 0 && towerStore) {
        towerStore.recordKill(sourceTowerSlot, currentTimeMs);
      }

      enemyStore.kill(slot);

      if (splitDef) {
        let childType = 'runner';
        let childCount = 2;

        if (Array.isArray(splitDef)) {
          childType = splitDef[0] || 'runner';
          childCount = splitDef.length;
        } else if (typeof splitDef === 'object') {
          childType = splitDef.into;
          childCount = splitDef.count;
        }

        for (let k = 0; k < childCount; k++) {
          enemyStore.spawn(childType, deathDistance - k * 15);
        }
      }
    }
  }
}
