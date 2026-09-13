/**
 * WaveBanner.tsx
 * Event-driven HUD banner overlay displaying "WAVE X — INCOMING" for 1.5 seconds on wave transitions.
 */

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export const WaveBanner: React.FC = () => {
  const wave = useGameStore((state) => state.wave);
  const status = useGameStore((state) => state.status);
  const [visible, setVisible] = useState(false);
  const [displayWave, setDisplayWave] = useState(1);

  useEffect(() => {
    if (status !== 'playing') return;

    setDisplayWave(wave);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [wave, status]);

  if (!visible || status !== 'playing') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(24, 26, 31, 0.92)',
        backdropFilter: 'blur(10px)',
        border: '2px solid #61afef',
        borderRadius: '8px',
        padding: '12px 32px',
        color: '#61afef',
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        zIndex: 25,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        animation: 'fadeInOut 1.5s ease',
        pointerEvents: 'none',
      }}
    >
      🌊 WAVE {displayWave} — INCOMING!
    </div>
  );
};
