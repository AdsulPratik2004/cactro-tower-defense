/**
 * Core engine TypeScript interfaces and types for the Tower Defense game.
 */

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface SplitOnDeathDef {
  into: string;
  count: number;
}

export interface EnemyTypeDef {
  id: string;
  name: string;
  baseHp: number;
  speed: number;
  armor: number;
  reward: number;
  flying: boolean;
  shieldHp?: number;
  splitOnDeath?: SplitOnDeathDef | string[];
  color: string;
  radius: number;
}

export interface TowerUpgradeDef {
  id: string;
  name: string;
  cost: number;
  damage?: number;
  range?: number;
  fireRateMs?: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDurationMs?: number;
}

export interface TowerTypeDef {
  id: string;
  cost: number;
  range: number;
  fireRateMs: number;
  damage: number;
  splashRadius?: number;
  slowFactor?: number;
  slowDurationMs?: number;
  targetsFlying: boolean;
  upgrades: (TowerUpgradeDef | string)[];
}

export interface WaveEnemyGroup {
  enemyType: string;
  count: number;
  spawnIntervalMs: number;
  delayMs: number;
}

export interface WaveDef {
  wave: number;
  groups: WaveEnemyGroup[];
}
