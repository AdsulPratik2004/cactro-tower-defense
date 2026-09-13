/**
 * EngineContext.tsx
 * React Context providing a ref to the single GameEngine instance.
 * Allows UI components to invoke engine methods directly without prop-drilling
 * or causing canvas re-renders.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { GameEngine } from '../engine/GameEngine';

const EngineContext = createContext<GameEngine | null>(null);

export interface EngineProviderProps {
  engine: GameEngine | null;
  children: ReactNode;
}

export function EngineProvider({ engine, children }: EngineProviderProps) {
  return <EngineContext.Provider value={engine}>{children}</EngineContext.Provider>;
}

export function useEngine(): GameEngine {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error('useEngine must be used within an EngineProvider with an initialized engine.');
  }
  return engine;
}
