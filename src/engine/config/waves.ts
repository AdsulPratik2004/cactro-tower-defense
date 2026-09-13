/**
 * waves.ts
 * Authored wave definitions for waves 1-15 and procedural wave generator for waves 16-50.
 */

import type { WaveDef } from '../types';

/**
 * Hand-authored waves 1-15 providing a curated learning ramp.
 */
export const AUTHORED_WAVES: WaveDef[] = [
  // Wave 1
  {
    wave: 1,
    groups: [{ enemyType: 'runner', count: 8, spawnIntervalMs: 1200, delayMs: 0 }],
  },
  // Wave 2
  {
    wave: 2,
    groups: [{ enemyType: 'runner', count: 14, spawnIntervalMs: 900, delayMs: 0 }],
  },
  // Wave 3
  {
    wave: 3,
    groups: [{ enemyType: 'runner', count: 20, spawnIntervalMs: 700, delayMs: 0 }],
  },
  // Wave 4: Introduce Brute
  {
    wave: 4,
    groups: [
      { enemyType: 'runner', count: 10, spawnIntervalMs: 800, delayMs: 0 },
      { enemyType: 'brute', count: 3, spawnIntervalMs: 2000, delayMs: 4000 },
    ],
  },
  // Wave 5
  {
    wave: 5,
    groups: [
      { enemyType: 'runner', count: 16, spawnIntervalMs: 650, delayMs: 0 },
      { enemyType: 'brute', count: 5, spawnIntervalMs: 1800, delayMs: 3000 },
    ],
  },
  // Wave 6
  {
    wave: 6,
    groups: [
      { enemyType: 'runner', count: 24, spawnIntervalMs: 500, delayMs: 0 },
      { enemyType: 'brute', count: 8, spawnIntervalMs: 1500, delayMs: 5000 },
    ],
  },
  // Wave 7: Introduce Flier
  {
    wave: 7,
    groups: [
      { enemyType: 'flier', count: 8, spawnIntervalMs: 1000, delayMs: 0 },
      { enemyType: 'runner', count: 15, spawnIntervalMs: 600, delayMs: 3000 },
    ],
  },
  // Wave 8
  {
    wave: 8,
    groups: [
      { enemyType: 'flier', count: 12, spawnIntervalMs: 850, delayMs: 0 },
      { enemyType: 'brute', count: 6, spawnIntervalMs: 1400, delayMs: 4000 },
    ],
  },
  // Wave 9
  {
    wave: 9,
    groups: [
      { enemyType: 'runner', count: 20, spawnIntervalMs: 450, delayMs: 0 },
      { enemyType: 'flier', count: 10, spawnIntervalMs: 800, delayMs: 2000 },
      { enemyType: 'brute', count: 8, spawnIntervalMs: 1200, delayMs: 6000 },
    ],
  },
  // Wave 10: First Boss + Shielded Intro
  {
    wave: 10,
    groups: [
      { enemyType: 'shielded', count: 6, spawnIntervalMs: 1500, delayMs: 0 },
      { enemyType: 'boss', count: 1, spawnIntervalMs: 1000, delayMs: 5000 },
      { enemyType: 'runner', count: 15, spawnIntervalMs: 400, delayMs: 8000 },
    ],
  },
  // Wave 11
  {
    wave: 11,
    groups: [
      { enemyType: 'shielded', count: 10, spawnIntervalMs: 1200, delayMs: 0 },
      { enemyType: 'flier', count: 14, spawnIntervalMs: 700, delayMs: 3000 },
    ],
  },
  // Wave 12
  {
    wave: 12,
    groups: [
      { enemyType: 'brute', count: 10, spawnIntervalMs: 1200, delayMs: 0 },
      { enemyType: 'shielded', count: 8, spawnIntervalMs: 1100, delayMs: 4000 },
      { enemyType: 'runner', count: 25, spawnIntervalMs: 350, delayMs: 8000 },
    ],
  },
  // Wave 13
  {
    wave: 13,
    groups: [
      { enemyType: 'flier', count: 18, spawnIntervalMs: 600, delayMs: 0 },
      { enemyType: 'shielded', count: 12, spawnIntervalMs: 1000, delayMs: 3000 },
    ],
  },
  // Wave 14
  {
    wave: 14,
    groups: [
      { enemyType: 'runner', count: 35, spawnIntervalMs: 300, delayMs: 0 },
      { enemyType: 'brute', count: 12, spawnIntervalMs: 1000, delayMs: 4000 },
      { enemyType: 'flier', count: 15, spawnIntervalMs: 500, delayMs: 7000 },
    ],
  },
  // Wave 15
  {
    wave: 15,
    groups: [
      { enemyType: 'boss', count: 2, spawnIntervalMs: 4000, delayMs: 0 },
      { enemyType: 'shielded', count: 15, spawnIntervalMs: 900, delayMs: 3000 },
      { enemyType: 'runner', count: 30, spawnIntervalMs: 250, delayMs: 6000 },
    ],
  },
];

/**
 * Procedural wave generator for waves 16 to 50.
 */
export function generateWave(waveNumber: number): WaveDef {
  const levelFactor = waveNumber - 15;
  const groups: WaveDef['groups'] = [];

  // Group 1: Runners
  const runnerCount = Math.floor(30 + levelFactor * 4);
  const runnerInterval = Math.max(150, Math.floor(300 - levelFactor * 5));
  groups.push({
    enemyType: 'runner',
    count: runnerCount,
    spawnIntervalMs: runnerInterval,
    delayMs: 0,
  });

  // Group 2: Brutes or Shielded
  const heavyType = waveNumber % 2 === 0 ? 'shielded' : 'brute';
  const heavyCount = Math.floor(12 + levelFactor * 2);
  const heavyInterval = Math.max(400, Math.floor(900 - levelFactor * 10));
  groups.push({
    enemyType: heavyType,
    count: heavyCount,
    spawnIntervalMs: heavyInterval,
    delayMs: 2000,
  });

  // Group 3: Fliers
  const flierCount = Math.floor(15 + levelFactor * 3);
  const flierInterval = Math.max(250, Math.floor(600 - levelFactor * 8));
  groups.push({
    enemyType: 'flier',
    count: flierCount,
    spawnIntervalMs: flierInterval,
    delayMs: 5000,
  });

  // Group 4: Boss every 10th wave (or wave 20, 30, 40, 50)
  if (waveNumber % 10 === 0) {
    const bossCount = Math.floor(1 + (waveNumber - 10) / 10);
    groups.push({
      enemyType: 'boss',
      count: bossCount,
      spawnIntervalMs: 3000,
      delayMs: 8000,
    });
  }

  return {
    wave: waveNumber,
    groups,
  };
}

/**
 * Single accessor function to retrieve wave definition for any wave 1-50.
 */
export function getWave(n: number): WaveDef {
  if (n >= 1 && n <= 15) {
    return AUTHORED_WAVES[n - 1];
  }
  return generateWave(n);
}
