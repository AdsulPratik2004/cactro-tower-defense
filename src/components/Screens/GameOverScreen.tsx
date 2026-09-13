/**
 * GameOverScreen.tsx
 * Fullscreen game over overlay component.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';

export const GameOverScreen: React.FC = () => {
  const engine = useEngine();
  const status = useGameStore((state) => state.status);
  const wave = useGameStore((state) => state.wave);
  const score = useGameStore((state) => state.score);

  if (status !== 'gameover') return null;

  const handleRestart = () => {
    engine.restartGame();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 17, 26, 0.94)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      <h1 style={{ fontSize: '52px', margin: '0 0 12px 0', color: '#e06c75', letterSpacing: '3px' }}>
        GAME OVER
      </h1>
      <p style={{ fontSize: '18px', color: '#abb2bf', marginBottom: '8px' }}>
        Defeated on <strong>Wave {wave}</strong>
      </p>
      <p style={{ fontSize: '20px', color: '#e5c07b', fontWeight: 'bold', marginBottom: '32px' }}>
        Final Score: {score}
      </p>

      <button
        onClick={handleRestart}
        style={{
          padding: '14px 36px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff',
          background: '#e06c75',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(224, 108, 117, 0.4)',
        }}
      >
        🔄 TRY AGAIN
      </button>
    </div>
  );
};
