/**
 * MainMenu.tsx
 * Fullscreen main menu overlay component.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';

export const MainMenu: React.FC = () => {
  const engine = useEngine();
  const status = useGameStore((state) => state.status);

  if (status !== 'menu') return null;

  const handleStartGame = () => {
    engine.startGame();
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(15, 17, 26, 0.92)',
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
      <h1 style={{ fontSize: '48px', margin: '0 0 12px 0', color: '#61afef', letterSpacing: '2px' }}>
        TOWER DEFENSE
      </h1>
      <p style={{ fontSize: '16px', color: '#abb2bf', marginBottom: '32px' }}>
        High-Performance Structure-of-Arrays (SoA) Simulation Engine
      </p>

      <button
        onClick={handleStartGame}
        style={{
          padding: '16px 40px',
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#181a1f',
          background: '#98c379',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(152, 195, 121, 0.4)',
          transition: 'transform 0.15s ease',
        }}
      >
        ▶ START GAME
      </button>
    </div>
  );
};
