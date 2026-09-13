/**
 * GameCanvas.tsx
 * Canvas host component supporting direct drag-and-drop tower relocation, click placement,
 * mouse hover tracking, and high-visibility grid snap feedback.
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { EngineProvider } from '../context/EngineContext';
import { useGameStore } from '../store/gameStore';

interface GameCanvasProps {
  children?: React.ReactNode;
}

interface DragState {
  slot: number;
  startX: number;
  startY: number;
  isDragging: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine(1280, 720);
  }
  const engine = engineRef.current;

  // Zustand selectors
  const selectedTowerTypeId = useGameStore((state) => state.selectedTowerTypeId);
  const relocatingTowerSlot = useGameStore((state) => state.relocatingTowerSlot);
  const selectTowerType = useGameStore((state) => state.selectTowerType);
  const selectPlacedTower = useGameStore((state) => state.selectPlacedTower);
  const setRelocatingTowerSlot = useGameStore((state) => state.setRelocatingTowerSlot);
  const setMouseHoverPos = useGameStore((state) => state.setMouseHoverPos);
  const setEconomy = useGameStore((state) => state.setEconomy);
  const setWave = useGameStore((state) => state.setWave);
  const setStatus = useGameStore((state) => state.setStatus);

  useEffect(() => {
    if (!canvasRef.current || !engineRef.current) return;
    const engineInstance = engineRef.current;

    engineInstance.attachCanvas(canvasRef.current);
    engineInstance.start();

    setEconomy({
      currency: engineInstance.economy.getCurrency(),
      baseHealth: engineInstance.economy.getLives(),
      score: engineInstance.economy.getScore(),
    });

    const unsubscribeEconomy = engineInstance.economy.subscribe(() => {
      setEconomy({
        currency: engineInstance.economy.getCurrency(),
        baseHealth: engineInstance.economy.getLives(),
        score: engineInstance.economy.getScore(),
      });
    });

    engineInstance.onWaveChange = (wave) => {
      setWave(wave);
    };

    engineInstance.onStatusChange = (status) => {
      setStatus(status);
    };

    return () => {
      unsubscribeEconomy();
      engineInstance.stop();
    };
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  /**
   * Mouse Down: Initiates direct drag-and-drop relocation for placed towers.
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engine || selectedTowerTypeId) return;

    const { x, y } = getCanvasCoords(e);
    const towerSlot = engine.getTowerAt(x, y);

    if (towerSlot !== -1) {
      dragStateRef.current = {
        slot: towerSlot,
        startX: x,
        startY: y,
        isDragging: false,
      };
      setRelocatingTowerSlot(towerSlot);
      selectPlacedTower(towerSlot);
      engine.selectTowerSlot(towerSlot);
    }
  };

  /**
   * Mouse Move: Updates cursor hover position and marks drag active.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMouseHoverPos({ x, y });

    if (dragStateRef.current) {
      const dx = x - dragStateRef.current.startX;
      const dy = y - dragStateRef.current.startY;
      if (Math.hypot(dx, dy) > 5) {
        dragStateRef.current.isDragging = true;
      }
    }
  };

  const handleMouseLeave = () => {
    setMouseHoverPos(null);
    if (dragStateRef.current) {
      dragStateRef.current = null;
      setRelocatingTowerSlot(null);
    }
  };

  /**
   * Mouse Up: Resolves drag-and-drop relocation, build placement, or tower selection.
   */
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engine) return;

    const { x, y } = getCanvasCoords(e);

    if (dragStateRef.current) {
      const { slot, isDragging } = dragStateRef.current;
      dragStateRef.current = null;

      if (isDragging) {
        // Direct Canvas Drag-and-Drop Relocation
        const success = engine.moveTower(slot, x, y);
        setRelocatingTowerSlot(null);
        if (success) {
          selectPlacedTower(slot);
          engine.selectTowerSlot(slot);
        }
        return;
      }
    }

    if (relocatingTowerSlot !== null) {
      // Inspector Button Relocation
      const success = engine.moveTower(relocatingTowerSlot, x, y);
      setRelocatingTowerSlot(null);
      if (success) {
        selectPlacedTower(relocatingTowerSlot);
        engine.selectTowerSlot(relocatingTowerSlot);
      }
    } else if (selectedTowerTypeId) {
      // Build Placement
      const success = engine.placeTower(selectedTowerTypeId, x, y);
      if (success) {
        selectTowerType(null);
      }
    } else {
      // Selection Check
      const towerSlot = engine.getTowerAt(x, y);
      if (towerSlot !== -1) {
        selectPlacedTower(towerSlot);
        engine.selectTowerSlot(towerSlot);
      } else {
        selectPlacedTower(null);
        engine.selectTowerSlot(-1);
      }
    }
  };

  const isCursorActive = selectedTowerTypeId || relocatingTowerSlot !== null;

  return (
    <EngineProvider engine={engine}>
      <div style={{ position: 'relative', width: '1280px', height: '720px', margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            width: '1280px',
            height: '720px',
            border: '2px solid #3b4252',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            cursor: isCursorActive ? 'grab' : 'pointer',
            display: 'block',
            background: '#1a1c23',
          }}
        />
        {children}
      </div>
    </EngineProvider>
  );
};
