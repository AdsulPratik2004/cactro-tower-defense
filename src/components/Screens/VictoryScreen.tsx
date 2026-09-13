/**
 * VictoryScreen.tsx
 * Fullscreen victory overlay component.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';

export const VictoryScreen: React.FC = () => {
  const engine = useEngine();
  const status = useGameStore((state) => state.status);
  const score = useGameStore((state) => state.score);

  if (status !== 'victory') return null;

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
      <h1 style={{ fontSize: '52px', margin: '0 0 12px 0', color: '#98c379', letterSpacing: '3px' }}>
        VICTORY!
      </h1>
      <p style={{ fontSize: '18px', color: '#abb2bf', marginBottom: '8px' }}>
        You successfully conquered all 50 waves!
      </p>
      <p style={{ fontSize: '22px', color: '#e5c07b', fontWeight: 'bold', marginBottom: '32px' }}>
        Final Score: {score}
      </p>

      <button
        onClick={handleRestart}
        style={{
          padding: '14px 36px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#181a1f',
          background: '#98c379',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(152, 195, 121, 0.4)',
        }}
      >
        🏆 PLAY AGAIN
      </button>
    </div>
  );
};
