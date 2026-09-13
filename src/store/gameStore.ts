/**
 * gameStore.ts
 * Global UI state management using Zustand.
 * Kept strictly UI-facing (no engine internal structures or typed arrays).
 */

import { create } from 'zustand';
import type { GameStatus } from '../engine/types';

export interface GameState {
  status: GameStatus;
  currency: number;
  baseHealth: number;
  maxBaseHealth: number;
  wave: number;
  score: number;
  speedMultiplier: number;
  selectedTowerTypeId: string | null;
  selectedPlacedTowerIndex: number | null;
  relocatingTowerSlot: number | null;
  mouseHoverPos: { x: number; y: number } | null;
  devOverlayVisible: boolean;

  // Actions
  setStatus: (status: GameStatus) => void;
  setEconomy: (data: { currency: number; baseHealth: number; score: number }) => void;
  setWave: (wave: number) => void;
  setSpeed: (speed: number) => void;
  selectTowerType: (typeId: string | null) => void;
  selectPlacedTower: (slotIndex: number | null) => void;
  setRelocatingTowerSlot: (slotIndex: number | null) => void;
  setMouseHoverPos: (pos: { x: number; y: number } | null) => void;
  toggleDevOverlay: () => void;
  resetStore: () => void;
}

const INITIAL_STATE = {
  status: 'menu' as GameStatus,
  currency: 500,
  baseHealth: 20,
  maxBaseHealth: 20,
  wave: 1,
  score: 0,
  speedMultiplier: 1,
  selectedTowerTypeId: null as string | null,
  selectedPlacedTowerIndex: null as number | null,
  relocatingTowerSlot: null as number | null,
  mouseHoverPos: null as { x: number; y: number } | null,
  devOverlayVisible: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL_STATE,

  setStatus: (status) => set({ status }),

  setEconomy: ({ currency, baseHealth, score }) => set({ currency, baseHealth, score }),

  setWave: (wave) => set({ wave }),

  setSpeed: (speedMultiplier) => set({ speedMultiplier }),

  selectTowerType: (typeId) =>
    set((state) => ({
      selectedTowerTypeId: state.selectedTowerTypeId === typeId ? null : typeId,
      selectedPlacedTowerIndex: null, // Deselect placed tower when entering placement mode
      relocatingTowerSlot: null,
    })),

  selectPlacedTower: (slotIndex) =>
    set({
      selectedPlacedTowerIndex: slotIndex,
      selectedTowerTypeId: null,
      relocatingTowerSlot: null,
    }),

  setRelocatingTowerSlot: (slotIndex) =>
    set({
      relocatingTowerSlot: slotIndex,
      selectedTowerTypeId: null,
    }),

  setMouseHoverPos: (pos) => set({ mouseHoverPos: pos }),

  toggleDevOverlay: () => set((state) => ({ devOverlayVisible: !state.devOverlayVisible })),

  resetStore: () => set({ ...INITIAL_STATE }),
}));
