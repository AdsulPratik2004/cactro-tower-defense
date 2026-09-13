/**
 * EnemyStore.ts
 * High-performance Structure-of-Arrays (SoA) memory pool for up to 6,000 active enemies.
 */

import { ENEMY_TYPES, ENEMY_TYPE_LIST, ENEMY_TYPE_INDEX_MAP } from '../config/enemies';

export class EnemyStore {
  public readonly capacity: number;

  // SoA Parallel Typed Arrays
  public readonly x: Float32Array;
  public readonly y: Float32Array;
  public readonly hp: Float32Array;
  public readonly maxHp: Float32Array;
  public readonly speed: Float32Array;
  public readonly armor: Float32Array;
  public readonly reward: Float32Array;
  public readonly shieldHp: Float32Array;
  public readonly maxShieldHp: Float32Array;
  public readonly distanceTraveled: Float32Array;
  public readonly slowMultiplier: Float32Array;
  public readonly slowExpiresAt: Float32Array;
  public readonly lastHitTimeMs: Float32Array;

  public readonly active: Uint8Array;
  public readonly typeIndex: Uint8Array;
  public readonly flying: Uint8Array;

  // Active Index Tracking (Swap-and-Pop)
  public readonly activeIndices: Uint16Array;
  public activeCount: number = 0;
  private slotToActiveIndex: Uint16Array;

  // Free List Tracking
  private freeList: Uint16Array;
  private freeCount: number = 0;

  constructor(capacity: number = 6000) {
    this.capacity = capacity;

    this.x = new Float32Array(capacity);
    this.y = new Float32Array(capacity);
    this.hp = new Float32Array(capacity);
    this.maxHp = new Float32Array(capacity);
    this.speed = new Float32Array(capacity);
    this.armor = new Float32Array(capacity);
    this.reward = new Float32Array(capacity);
    this.shieldHp = new Float32Array(capacity);
    this.maxShieldHp = new Float32Array(capacity);
    this.distanceTraveled = new Float32Array(capacity);
    this.slowMultiplier = new Float32Array(capacity);
    this.slowExpiresAt = new Float32Array(capacity);
    this.lastHitTimeMs = new Float32Array(capacity);

    this.active = new Uint8Array(capacity);
    this.typeIndex = new Uint8Array(capacity);
    this.flying = new Uint8Array(capacity);

    this.activeIndices = new Uint16Array(capacity);
    this.slotToActiveIndex = new Uint16Array(capacity);
    this.freeList = new Uint16Array(capacity);

    this.reset();
  }

  public reset(): void {
    this.active.fill(0);
    this.lastHitTimeMs.fill(0);
    this.activeCount = 0;
    this.freeCount = this.capacity;

    for (let i = 0; i < this.capacity; i++) {
      this.freeList[i] = this.capacity - 1 - i;
      this.slotToActiveIndex[i] = 0;
    }
  }

  public spawn(typeId: string, initialDistance: number = 0): number {
    if (this.freeCount === 0) {
      console.warn(`[EnemyStore] Pool capacity of ${this.capacity} exhausted!`);
      return -1;
    }

    const typeDef = ENEMY_TYPES[typeId];
    if (!typeDef) {
      console.error(`[EnemyStore] Unknown enemy typeId: ${typeId}`);
      return -1;
    }

    const typeIdx = ENEMY_TYPE_INDEX_MAP[typeId] ?? 0;

    this.freeCount--;
    const slot = this.freeList[this.freeCount];

    this.active[slot] = 1;
    this.typeIndex[slot] = typeIdx;
    this.hp[slot] = typeDef.baseHp;
    this.maxHp[slot] = typeDef.baseHp;
    this.speed[slot] = typeDef.speed;
    this.armor[slot] = typeDef.armor;
    this.reward[slot] = typeDef.reward;
    this.shieldHp[slot] = typeDef.shieldHp ?? 0;
    this.maxShieldHp[slot] = typeDef.shieldHp ?? 0;
    this.flying[slot] = typeDef.flying ? 1 : 0;
    this.distanceTraveled[slot] = initialDistance;
    this.slowMultiplier[slot] = 1.0;
    this.slowExpiresAt[slot] = 0;
    this.lastHitTimeMs[slot] = 0;
    this.x[slot] = 0;
    this.y[slot] = 0;

    const activeIdx = this.activeCount;
    this.activeIndices[activeIdx] = slot;
    this.slotToActiveIndex[slot] = activeIdx;
    this.activeCount++;

    return slot;
  }

  public kill(slot: number): void {
    if (slot < 0 || slot >= this.capacity || this.active[slot] === 0) {
      return;
    }

    this.active[slot] = 0;

    const activeIdx = this.slotToActiveIndex[slot];
    const lastActiveIdx = this.activeCount - 1;
    const lastSlot = this.activeIndices[lastActiveIdx];

    if (activeIdx !== lastActiveIdx) {
      this.activeIndices[activeIdx] = lastSlot;
      this.slotToActiveIndex[lastSlot] = activeIdx;
    }

    this.activeCount--;

    this.freeList[this.freeCount] = slot;
    this.freeCount++;
  }

  public getTypeDef(slot: number) {
    const idx = this.typeIndex[slot];
    return ENEMY_TYPE_LIST[idx];
  }
}
