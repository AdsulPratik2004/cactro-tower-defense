/**
 * TowerStore.ts
 * Object-pooled manager for active tower instances (capacity ~150).
 */

import { TOWER_CONFIGS, type TowerTierConfig } from '../config/towers';
import { EconomySystem } from '../systems/EconomySystem';

export interface TowerEntity {
  slot: number;
  x: number;
  y: number;
  typeId: string;
  tier: number; // 1-indexed (1, 2, 3)
  cooldownRemainingMs: number;
  targetEnemyIndex: number;
  totalInvestedCost: number;
  lastKillTimeMs: number;
  killCount: number;
  active: boolean;
}

export class TowerStore {
  public readonly capacity: number;
  private pool: TowerEntity[];
  private activeCountInternal: number = 0;

  constructor(capacity: number = 150) {
    this.capacity = capacity;
    this.pool = new Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.pool[i] = {
        slot: i,
        x: 0,
        y: 0,
        typeId: 'gunner',
        tier: 1,
        cooldownRemainingMs: 0,
        targetEnemyIndex: -1,
        totalInvestedCost: 0,
        lastKillTimeMs: 0,
        killCount: 0,
        active: false,
      };
    }
  }

  public reset(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.pool[i].active = false;
      this.pool[i].lastKillTimeMs = 0;
      this.pool[i].killCount = 0;
    }
    this.activeCountInternal = 0;
  }

  public getActiveTowers(): TowerEntity[] {
    const activeList: TowerEntity[] = [];
    for (let i = 0; i < this.capacity; i++) {
      if (this.pool[i].active) {
        activeList.push(this.pool[i]);
      }
    }
    return activeList;
  }

  public getTowerAtSlot(slot: number): TowerEntity | null {
    if (slot >= 0 && slot < this.capacity && this.pool[slot].active) {
      return this.pool[slot];
    }
    return null;
  }

  public recordKill(slot: number, currentTimeMs: number): void {
    const tower = this.getTowerAtSlot(slot);
    if (tower) {
      tower.lastKillTimeMs = currentTimeMs;
      tower.killCount++;
    }
  }

  /**
   * Places a new tower if capacity and currency permit.
   * Returns slot index or -1 if failed.
   */
  public place(typeId: string, x: number, y: number, economy: EconomySystem): number {
    const config = TOWER_CONFIGS[typeId];
    if (!config) return -1;

    const baseTier = config.tiers[0];
    if (!economy.spendCurrency(baseTier.cost)) {
      return -1; // Insufficient funds
    }

    // Find free slot in pool
    for (let i = 0; i < this.capacity; i++) {
      const tower = this.pool[i];
      if (!tower.active) {
        tower.active = true;
        tower.x = x;
        tower.y = y;
        tower.typeId = typeId;
        tower.tier = 1;
        tower.cooldownRemainingMs = 0;
        tower.targetEnemyIndex = -1;
        tower.totalInvestedCost = baseTier.cost;
        tower.lastKillTimeMs = 0;
        tower.killCount = 0;

        this.activeCountInternal++;
        return i;
      }
    }

    // Refund if pool exhausted
    economy.addCurrency(baseTier.cost);
    console.warn('[TowerStore] Tower pool capacity exhausted!');
    return -1;
  }

  /**
   * Repositions an existing tower to new coordinates (x, y).
   */
  public move(slot: number, newX: number, newY: number): boolean {
    const tower = this.getTowerAtSlot(slot);
    if (!tower) return false;

    tower.x = newX;
    tower.y = newY;
    return true;
  }

  /**
   * Upgrades a tower to its next tier if available and affordable.
   */
  public upgrade(slot: number, economy: EconomySystem): boolean {
    const tower = this.getTowerAtSlot(slot);
    if (!tower) return false;

    const config = TOWER_CONFIGS[tower.typeId];
    if (!config || tower.tier >= config.tiers.length) {
      return false; // Max tier reached
    }

    const nextTierConfig = config.tiers[tower.tier];
    if (!economy.spendCurrency(nextTierConfig.cost)) {
      return false; // Insufficient funds
    }

    tower.tier++;
    tower.totalInvestedCost += nextTierConfig.cost;
    return true;
  }

  /**
   * Sells a tower and refunds a percentage (default 70%) of total invested cost.
   */
  public sell(slot: number, economy: EconomySystem, refundRatio: number = 0.7): boolean {
    const tower = this.getTowerAtSlot(slot);
    if (!tower) return false;

    const refundAmount = Math.floor(tower.totalInvestedCost * refundRatio);
    economy.addCurrency(refundAmount);

    tower.active = false;
    this.activeCountInternal--;
    return true;
  }

  public getTierConfig(tower: TowerEntity): TowerTierConfig | null {
    const config = TOWER_CONFIGS[tower.typeId];
    if (!config) return null;
    return config.tiers[tower.tier - 1] || null;
  }
}
