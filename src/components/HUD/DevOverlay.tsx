/**
 * DevOverlay.tsx
 * Developer metrics panel displaying FPS, frame time, active pool counts,
 * and stress test execution.
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';

export const DevOverlay: React.FC = () => {
  const engine = useEngine();
  const visible = useGameStore((state) => state.devOverlayVisible);
  const toggleDevOverlay = useGameStore((state) => state.toggleDevOverlay);

  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTimeMs: 0,
    activeEnemies: 0,
    activeTowers: 0,
    activeProjectiles: 0,
  });

  // Global keydown listener for `~` key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        toggleDevOverlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDevOverlay]);

  // Polling metrics interval
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const m = engine.getMetrics();
      setMetrics({
        fps: m.fps,
        frameTimeMs: Math.round(m.frameTimeMs * 100) / 100,
        activeEnemies: engine.getEnemyCount(),
        activeTowers: engine.getTowerCount(),
        activeProjectiles: engine.getProjectileCount(),
      });
    }, 250);

    return () => clearInterval(interval);
  }, [visible, engine]);

  if (!visible) return null;

  const handleRunStressTest = () => {
    engine.runStressTest();
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '118px',
        right: '12px',
        width: '245px',
        background: 'rgba(15, 17, 26, 0.95)',
        border: '1px solid #c678dd',
        borderRadius: '8px',
        padding: '14px',
        color: '#abb2bf',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 20,
        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c678dd', fontWeight: 'bold', marginBottom: '8px' }}>
        <span>🛠 DEV DIAGNOSTICS</span>
        <button onClick={toggleDevOverlay} style={{ background: 'none', border: 'none', color: '#5c6370', cursor: 'pointer' }}>✕</button>
      </div>

      <div style={{ lineHeight: '1.6', marginBottom: '12px' }}>
        <div>FPS: <strong style={{ color: '#98c379' }}>{metrics.fps}</strong></div>
        <div>Frame Time: <strong>{metrics.frameTimeMs} ms</strong></div>
        <div>Enemies (SoA): <strong style={{ color: '#e5c07b' }}>{metrics.activeEnemies} / 6000</strong></div>
        <div>Towers Pool: <strong>{metrics.activeTowers} / 150</strong></div>
        <div>Projectiles: <strong>{metrics.activeProjectiles} / 1200</strong></div>
      </div>

      <button
        onClick={handleRunStressTest}
        style={{
          width: '100%',
          padding: '8px',
          background: '#e06c75',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '11px',
        }}
      >
        💥 5,000 Enemy Stress Test
      </button>
    </div>
  );
};
