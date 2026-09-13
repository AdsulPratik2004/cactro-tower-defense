/**
 * TopBar.tsx
 * HUD component rendering currency, base health, wave progression, and score with Orbitron typography and Lucide icons.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Heart, Coins, Flame, Trophy } from 'lucide-react';

export const TopBar: React.FC = () => {
  const currency = useGameStore((state) => state.currency);
  const baseHealth = useGameStore((state) => state.baseHealth);
  const maxBaseHealth = useGameStore((state) => state.maxBaseHealth);
  const wave = useGameStore((state) => state.wave);
  const score = useGameStore((state) => state.score);

  const hpPercent = Math.max(0, (baseHealth / maxBaseHealth) * 100);

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        height: '48px',
        background: 'rgba(24, 26, 31, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3b4252',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#fff',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      {/* Base Health Numeric + Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Heart size={18} color="#e06c75" fill="#e06c75" />
        <span className="font-display" style={{ fontWeight: 'bold', fontSize: '13px', color: '#e06c75' }}>
          {baseHealth} / {maxBaseHealth}
        </span>
        <div
          style={{
            width: '110px',
            height: '10px',
            background: '#21252b',
            borderRadius: '5px',
            overflow: 'hidden',
            border: '1px solid #3b4252',
          }}
        >
          <div
            style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: hpPercent > 50 ? '#98c379' : hpPercent > 20 ? '#e5c07b' : '#e06c75',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Gold Currency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Coins size={18} color="#e5c07b" />
        <span className="font-display" style={{ fontSize: '15px', fontWeight: 'bold', color: '#e5c07b' }}>
          {currency}
        </span>
      </div>

      {/* Wave Number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Flame size={18} color="#61afef" />
        <span className="font-display" style={{ fontSize: '14px', fontWeight: 'bold', color: '#61afef' }}>
          WAVE {wave} / 50
        </span>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Trophy size={18} color="#c678dd" />
        <span className="font-display" style={{ fontSize: '14px', fontWeight: 'bold', color: '#c678dd' }}>
          {score}
        </span>
      </div>
    </div>
  );
};
