/**
 * TowerInfoPanel.tsx
 * HUD inspector panel featuring Move/Relocate, Upgrade, and Sell buttons with Lucide icons.
 */

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';
import { TOWER_CONFIGS } from '../../engine/config/towers';
import { ArrowUpCircle, DollarSign, Move, X } from 'lucide-react';

export const TowerInfoPanel: React.FC = () => {
  const engine = useEngine();
  const selectedSlot = useGameStore((state) => state.selectedPlacedTowerIndex);
  const selectPlacedTower = useGameStore((state) => state.selectPlacedTower);
  const setRelocatingTowerSlot = useGameStore((state) => state.setRelocatingTowerSlot);
  const relocatingTowerSlot = useGameStore((state) => state.relocatingTowerSlot);
  const currency = useGameStore((state) => state.currency);

  if (selectedSlot === null) return null;

  const tower = engine.towerStore.getTowerAtSlot(selectedSlot);
  if (!tower) return null;

  const config = TOWER_CONFIGS[tower.typeId];
  if (!config) return null;

  const currentTierConfig = config.tiers[tower.tier - 1];
  const nextTierConfig = config.tiers[tower.tier];
  const isMaxTier = !nextTierConfig;
  const upgradeCost = nextTierConfig ? nextTierConfig.cost : 0;
  const canAffordUpgrade = !isMaxTier && currency >= upgradeCost;

  const sellRefund = Math.floor(tower.totalInvestedCost * 0.7);

  const handleUpgrade = () => {
    engine.upgradeTower(selectedSlot);
  };

  const handleMove = () => {
    setRelocatingTowerSlot(selectedSlot);
  };

  const handleSell = () => {
    engine.sellTower(selectedSlot);
    selectPlacedTower(null);
  };

  const handleClose = () => {
    selectPlacedTower(null);
    setRelocatingTowerSlot(null);
    engine.selectTowerSlot(-1);
  };

  const isRelocating = relocatingTowerSlot === selectedSlot;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '280px',
        background: 'rgba(24, 26, 31, 0.94)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3b4252',
        borderRadius: '8px',
        padding: '16px',
        color: '#fff',
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span className="font-display" style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', color: '#61afef' }}>
          {currentTierConfig?.name || config.id}
        </span>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#5c6370',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ fontSize: '13px', color: '#abb2bf', marginBottom: '12px', lineHeight: '1.5' }}>
        <div>Tier: <strong className="font-display">{tower.tier} / 3</strong></div>
        <div>Damage: <strong>{currentTierConfig?.damage}</strong> {nextTierConfig && <span style={{ color: '#98c379' }}>(➔ {nextTierConfig.damage})</span>}</div>
        <div>Range: <strong>{currentTierConfig?.range}</strong> {nextTierConfig && <span style={{ color: '#98c379' }}>(➔ {nextTierConfig.range})</span>}</div>
        <div>Fire Interval: <strong>{currentTierConfig?.fireRateMs}ms</strong></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleMove}
          style={{
            padding: '8px',
            background: isRelocating ? '#e5c07b' : '#3b4252',
            border: 'none',
            borderRadius: '4px',
            color: isRelocating ? '#181a1f' : '#fff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Move size={14} />
          <span className="font-display">
            {isRelocating ? 'CLICK NEW LOCATION...' : 'RELOCATE TOWER'}
          </span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleUpgrade}
            disabled={!canAffordUpgrade || isMaxTier}
            style={{
              flex: 1,
              padding: '8px',
              background: canAffordUpgrade && !isMaxTier ? '#98c379' : '#21252b',
              border: 'none',
              borderRadius: '4px',
              color: canAffordUpgrade && !isMaxTier ? '#181a1f' : '#5c6370',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: canAffordUpgrade && !isMaxTier ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <ArrowUpCircle size={14} />
            <span className="font-display">{isMaxTier ? 'MAX' : `UPGRADE 🪙${upgradeCost}`}</span>
          </button>

          <button
            onClick={handleSell}
            style={{
              padding: '8px 12px',
              background: '#e06c75',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <DollarSign size={14} />
            <span className="font-display">SELL 🪙{sellRefund}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
