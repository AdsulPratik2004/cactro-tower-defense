/**
 * SpawnSystem.ts
 * Numeric cooldown-based wave spawn system. Manages group delays, intervals,
 * and completion status without setTimeout allocations.
 */

import { EnemyStore } from '../entities/EnemyStore';
import type { WaveDef, WaveEnemyGroup } from '../types';

interface GroupSpawnState {
  group: WaveEnemyGroup;
  spawnedCount: number;
  timerMs: number;
  initialDelayDone: boolean;
}

export class SpawnSystem {
  private currentWave: WaveDef | null = null;
  private groupStates: GroupSpawnState[] = [];
  private isSpawningActive: boolean = false;

  /**
   * Initializes state for a new wave definition.
   */
  public startWave(waveDef: WaveDef): void {
    this.currentWave = waveDef;
    this.groupStates = waveDef.groups.map((group) => ({
      group,
      spawnedCount: 0,
      timerMs: 0,
      initialDelayDone: false,
    }));
    this.isSpawningActive = true;
  }

  /**
   * Numeric cooldown update tick for wave spawning.
   */
  public update(enemyStore: EnemyStore, dtMs: number): void {
    if (!this.isSpawningActive || !this.currentWave) return;

    let allGroupsFinished = true;

    for (let i = 0; i < this.groupStates.length; i++) {
      const state = this.groupStates[i];
      const { group } = state;

      if (state.spawnedCount < group.count) {
        allGroupsFinished = false;
        state.timerMs += dtMs;

        // Check initial group delay
        if (!state.initialDelayDone) {
          if (state.timerMs >= group.delayMs) {
            state.initialDelayDone = true;
            state.timerMs -= group.delayMs; // Reset timer for interval counting

            // Spawn first enemy in group immediately upon delay expiry
            enemyStore.spawn(group.enemyType);
            state.spawnedCount++;
          }
        } else {
          // Check repeat spawn interval
          if (state.timerMs >= group.spawnIntervalMs) {
            state.timerMs -= group.spawnIntervalMs;
            enemyStore.spawn(group.enemyType);
            state.spawnedCount++;
          }
        }
      }
    }

    if (allGroupsFinished) {
      this.isSpawningActive = false;
    }
  }

  /**
   * Returns true if all enemies in all groups have finished spawning
   * AND no active enemies remain on the playfield.
   */
  public isWaveComplete(enemyStore: EnemyStore): boolean {
    if (this.isSpawningActive) return false;

    // Check if any group still has unspawned enemies
    for (let i = 0; i < this.groupStates.length; i++) {
      if (this.groupStates[i].spawnedCount < this.groupStates[i].group.count) {
        return false;
      }
    }

    // Check if any active enemies remain alive
    return enemyStore.activeCount === 0;
  }

  public getCurrentWaveNumber(): number {
    return this.currentWave ? this.currentWave.wave : 0;
  }

  public isSpawning(): boolean {
    return this.isSpawningActive;
  }
}
