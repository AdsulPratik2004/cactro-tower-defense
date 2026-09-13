/**
 * enemies.ts
 * Definitions for all enemy types available in the game.
 */

import type { EnemyTypeDef } from '../types';

export const ENEMY_TYPES: Record<string, EnemyTypeDef> = {
  runner: {
    id: 'runner',
    name: 'Scout Runner',
    baseHp: 40,
    speed: 210,
    armor: 0,
    reward: 5,
    flying: false,
    color: '#e5c07b', // Warm Yellow
    radius: 10,
  },
  brute: {
    id: 'brute',
    name: 'Armored Brute',
    baseHp: 350,
    speed: 85,
    armor: 5,
    reward: 20,
    flying: false,
    color: '#e06c75', // Red
    radius: 18,
  },
  flier: {
    id: 'flier',
    name: 'Sky Flier',
    baseHp: 85,
    speed: 160,
    armor: 0,
    reward: 10,
    flying: true,
    color: '#61afef', // Cyan Blue
    radius: 12,
  },
  shielded: {
    id: 'shielded',
    name: 'Shield Guardian',
    baseHp: 120,
    speed: 130,
    armor: 0,
    reward: 15,
    flying: false,
    shieldHp: 100,
    color: '#c678dd', // Purple
    radius: 14,
  },
  boss: {
    id: 'boss',
    name: 'Grand Colossus',
    baseHp: 1200,
    speed: 60,
    armor: 10,
    reward: 100,
    flying: false,
    splitOnDeath: { into: 'runner', count: 2 },
    color: '#98c379', // Green
    radius: 24,
  },
};

export const ENEMY_TYPE_LIST: EnemyTypeDef[] = Object.values(ENEMY_TYPES);

/**
 * Array mapping for fast numeric index lookup in SoA EnemyStore.
 */
export const ENEMY_TYPE_INDEX_MAP: Record<string, number> = Object.keys(ENEMY_TYPES).reduce(
  (acc, key, idx) => {
    acc[key] = idx;
    return acc;
  },
  {} as Record<string, number>
);
