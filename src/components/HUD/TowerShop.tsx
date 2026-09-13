/**
 * TowerShop.tsx
 * HUD shop component featuring Lucide icons and Orbitron typography.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { TOWER_CONFIGS } from '../../engine/config/towers';
import { Crosshair, Bomb, Snowflake, Target } from 'lucide-react';

export const TowerShop: React.FC = () => {
  const currency = useGameStore((state) => state.currency);
  const selectedTowerTypeId = useGameStore((state) => state.selectedTowerTypeId);
  const selectTowerType = useGameStore((state) => state.selectTowerType);

  const towerList = Object.values(TOWER_CONFIGS);

  const getTowerIcon = (id: string) => {
    switch (id) {
      case 'gunner':
        return <Crosshair size={20} color="#e5c07b" />;
      case 'cannon':
        return <Bomb size={20} color="#e06c75" />;
      case 'frost':
        return <Snowflake size={20} color="#00d2ff" />;
      case 'sniper':
        return <Target size={20} color="#98c379" />;
      default:
        return <Crosshair size={20} color="#ffffff" />;
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(24, 26, 31, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3b4252',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        gap: '10px',
        zIndex: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      {towerList.map((t) => {
        const isSelected = selectedTowerTypeId === t.id;
        const isAffordable = currency >= t.cost;
        const baseTier = t.tiers[0];

        return (
          <button
            key={t.id}
            onClick={() => selectTowerType(t.id)}
            disabled={!isAffordable}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '104px',
              padding: '10px 8px',
              background: isSelected ? '#3b4252' : isAffordable ? '#21252b' : '#181a1f',
              border: isSelected ? '2px solid #61afef' : '1px solid #3b4252',
              borderRadius: '6px',
              color: isAffordable ? '#fff' : '#5c6370',
              cursor: isAffordable ? 'pointer' : 'not-allowed',
              opacity: isAffordable ? 1 : 0.6,
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ marginBottom: '4px' }}>{getTowerIcon(t.id)}</div>
            <span className="font-display" style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
              {t.id}
            </span>
            <span style={{ fontSize: '11px', margin: '3px 0', color: isSelected ? '#61afef' : '#abb2bf' }}>
              DMG {baseTier.damage}
            </span>
            <span className="font-display" style={{ fontWeight: 'bold', fontSize: '12px', color: '#e5c07b' }}>
              🪙 {t.cost}
            </span>
          </button>
        );
      })}
    </div>
  );
};
