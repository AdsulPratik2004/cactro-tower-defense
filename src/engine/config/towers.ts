/**
 * towers.ts
 * Config definitions and upgrade tiers for all tower types.
 *
 * DESIGN NOTE:
 * Gunner is deliberately configured with `targetsFlying: false` to establish a clear role division
 * where Sniper handles anti-air and long-range high-priority targets.
 */

import type { TowerTypeDef, TowerUpgradeDef } from '../types';

export interface TowerTierConfig {
  tier: number;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRateMs: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDurationMs?: number;
}

export interface TowerConfigDefinition extends TowerTypeDef {
  tiers: TowerTierConfig[];
}

export const TOWER_CONFIGS: Record<string, TowerConfigDefinition> = {
  gunner: {
    id: 'gunner',
    cost: 100,
    range: 140,
    fireRateMs: 250,
    damage: 12,
    targetsFlying: false, // Gunner targets ground enemies only; Sniper handles fliers.
    upgrades: ['gunner_t2', 'gunner_t3'],
    tiers: [
      {
        tier: 1,
        name: 'Gatling Gunner T1',
        cost: 100,
        damage: 12,
        range: 140,
        fireRateMs: 250,
      },
      {
        tier: 2,
        name: 'Twin-Barrel Gunner T2',
        cost: 120,
        damage: 22,
        range: 160,
        fireRateMs: 200,
      },
      {
        tier: 3,
        name: 'Minigun Turret T3',
        cost: 200,
        damage: 38,
        range: 180,
        fireRateMs: 150,
      },
    ],
  },
  cannon: {
    id: 'cannon',
    cost: 150,
    range: 130,
    fireRateMs: 1200,
    damage: 45,
    splashRadius: 64,
    targetsFlying: false,
    upgrades: ['cannon_t2', 'cannon_t3'],
    tiers: [
      {
        tier: 1,
        name: 'Mortar Cannon T1',
        cost: 150,
        damage: 45,
        range: 130,
        fireRateMs: 1200,
        splashRadius: 64,
      },
      {
        tier: 2,
        name: 'Heavy Howitzer T2',
        cost: 180,
        damage: 90,
        range: 150,
        fireRateMs: 1000,
        splashRadius: 80,
      },
      {
        tier: 3,
        name: 'Cluster Bomb Battery T3',
        cost: 300,
        damage: 170,
        range: 170,
        fireRateMs: 850,
        splashRadius: 100,
      },
    ],
  },
  frost: {
    id: 'frost',
    cost: 125,
    range: 120,
    fireRateMs: 600,
    damage: 8,
    slowFactor: 0.5, // 50% slow
    slowDurationMs: 2000,
    targetsFlying: true,
    upgrades: ['frost_t2', 'frost_t3'],
    tiers: [
      {
        tier: 1,
        name: 'Cryo Emitter T1',
        cost: 125,
        damage: 8,
        range: 120,
        fireRateMs: 600,
        slowFactor: 0.5,
        slowDurationMs: 2000,
      },
      {
        tier: 2,
        name: 'Blizzard Tower T2',
        cost: 150,
        damage: 18,
        range: 140,
        fireRateMs: 500,
        slowFactor: 0.4, // 60% slow
        slowDurationMs: 2500,
      },
      {
        tier: 3,
        name: 'Absolute Zero Cannon T3',
        cost: 250,
        damage: 35,
        range: 165,
        fireRateMs: 400,
        slowFactor: 0.3, // 70% slow
        slowDurationMs: 3000,
      },
    ],
  },
  sniper: {
    id: 'sniper',
    cost: 200,
    range: 280,
    fireRateMs: 1800,
    damage: 150,
    targetsFlying: true,
    upgrades: ['sniper_t2', 'sniper_t3'],
    tiers: [
      {
        tier: 1,
        name: 'Marksman Sniper T1',
        cost: 200,
        damage: 150,
        range: 280,
        fireRateMs: 1800,
      },
      {
        tier: 2,
        name: 'Anti-Material Rifle T2',
        cost: 250,
        damage: 320,
        range: 340,
        fireRateMs: 1500,
      },
      {
        tier: 3,
        name: 'Railgun Battery T3',
        cost: 400,
        damage: 650,
        range: 400,
        fireRateMs: 1200,
      },
    ],
  },
};

export const TOWER_COLOR_MAP: Record<string, string> = {
  gunner: '#e5c07b', // Gold / Yellow
  cannon: '#e06c75', // Red
  frost: '#00d2ff',  // Cyan
  sniper: '#98c379', // Green
};
