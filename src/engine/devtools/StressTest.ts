/**
 * StressTest.ts
 * Devtool harness for stress testing engine performance at scale.
 * Bypasses normal wave/economy limits to populate:
 * - 5,000 active enemies (mix of runner, brute, flier, shielded, boss)
 * - 100 active towers (mix of gunner, cannon, frost, sniper)
 * - 1,000 active projectiles
 */

import type { GameEngine } from '../GameEngine';

export function runStressTest(engine: GameEngine): void {
  console.log('[StressTest] Populating 5,000 enemies, 100 towers, and 1,000 projectiles...');

  const enemyStore = engine.enemyStore;
  const towerStore = engine.towerStore;
  const projectileStore = engine.projectileStore;
  const economy = engine.economy;

  // 1. Force-fill 5,000 enemies
  enemyStore.reset();
  const enemyTypes = ['runner', 'brute', 'flier', 'shielded', 'boss'];

  for (let i = 0; i < 5000; i++) {
    const type = enemyTypes[i % enemyTypes.length];
    // Random distance along path track (-100 to 2000px)
    const randomDistance = Math.random() * 2100 - 100;
    enemyStore.spawn(type, randomDistance);
  }

  // 2. Force-fill 100 towers
  towerStore.reset();
  const towerTypes = ['gunner', 'cannon', 'frost', 'sniper'];
  let towersPlaced = 0;

  // Grid layout (cols 2..18, rows 2..10)
  for (let col = 2; col < 18 && towersPlaced < 100; col++) {
    for (let row = 1; row < 11 && towersPlaced < 100; row++) {
      const gx = col * 64 + 32;
      const gy = row * 64 + 32;

      // Skip if on path track
      if (engine.isPositionOnPath(gx, gy)) continue;

      const type = towerTypes[towersPlaced % towerTypes.length];
      economy.addCurrency(1000); // Ensure economy has funds
      const slot = towerStore.place(type, gx, gy, economy);

      if (slot !== -1) {
        // Upgrade some towers for variety
        if (towersPlaced % 3 === 0) {
          economy.addCurrency(1000);
          towerStore.upgrade(slot, economy);
        }
        towersPlaced++;
      }
    }
  }

  // 3. Force-fill 1,000 projectiles
  projectileStore.reset();
  const activeEnemyCount = enemyStore.activeCount;

  if (activeEnemyCount > 0) {
    const activeTowerList = towerStore.getActiveTowers();
    const towerCount = activeTowerList.length || 1;

    for (let i = 0; i < 1000; i++) {
      const sourceTower = activeTowerList[i % towerCount];
      const targetSlot = enemyStore.activeIndices[i % activeEnemyCount];
      const targetX = enemyStore.x[targetSlot];
      const targetY = enemyStore.y[targetSlot];

      projectileStore.spawn(
        sourceTower ? sourceTower.x : 100,
        sourceTower ? sourceTower.y : 100,
        targetSlot,
        targetX,
        targetY,
        25,
        700,
        i % 4 === 1 ? 64 : 0,
        i % 4 === 2 ? 0.5 : 0,
        i % 4 === 2 ? 2000 : 0,
        sourceTower ? sourceTower.typeId : 'gunner'
      );
    }
  }

  console.log(`[StressTest] Complete! Active Enemies: ${enemyStore.activeCount}, Towers: ${towerStore.getActiveTowers().length}, Projectiles: ${projectileStore.getActiveProjectiles().length}`);
}
