/**
 * Controls.tsx
 * HUD controls featuring Lucide icons, Orbitron display font, Play/Pause, Speed multiplier,
 * Restart, DevOverlay toggle, and SoundManager mute toggle.
 */

import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useEngine } from '../../context/EngineContext';
import { SoundManager } from '../../engine/audio/SoundManager';
import { Play, Pause, RotateCcw, Wrench, Volume2, VolumeX } from 'lucide-react';

export const Controls: React.FC = () => {
  const engine = useEngine();
  const status = useGameStore((state) => state.status);
  const setStatus = useGameStore((state) => state.setStatus);
  const speedMultiplier = useGameStore((state) => state.speedMultiplier);
  const setSpeed = useGameStore((state) => state.setSpeed);
  const toggleDevOverlay = useGameStore((state) => state.toggleDevOverlay);
  const [isMuted, setIsMuted] = useState(SoundManager.isMuted());

  const isPaused = status === 'paused';

  const handleTogglePause = () => {
    if (isPaused) {
      engine.resume();
      setStatus('playing');
    } else {
      engine.pause();
      setStatus('paused');
    }
  };

  const handleSpeedChange = (speed: number) => {
    engine.setSpeed(speed);
    setSpeed(speed);
  };

  const handleRestart = () => {
    engine.restartGame();
  };

  const handleToggleMute = () => {
    const muted = SoundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '68px',
        right: '12px',
        background: 'rgba(24, 26, 31, 0.88)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #3b4252',
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <button
        onClick={handleTogglePause}
        style={{
          padding: '6px 12px',
          background: isPaused ? '#98c379' : '#e5c07b',
          border: 'none',
          borderRadius: '4px',
          color: '#181a1f',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {isPaused ? <Play size={15} fill="#181a1f" /> : <Pause size={15} fill="#181a1f" />}
        <span className="font-display" style={{ fontSize: '11px' }}>
          {isPaused ? 'RESUME' : 'PAUSE'}
        </span>
      </button>

      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
            className="font-display"
            style={{
              padding: '5px 9px',
              background: speedMultiplier === s ? '#61afef' : '#21252b',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontWeight: speedMultiplier === s ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {s}X
          </button>
        ))}
      </div>

      <button
        onClick={handleToggleMute}
        title="Toggle Audio Mute"
        style={{
          padding: '6px 8px',
          background: isMuted ? '#e06c75' : '#21252b',
          border: '1px solid #3b4252',
          borderRadius: '4px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      <button
        onClick={handleRestart}
        title="Restart Game"
        style={{
          padding: '6px 8px',
          background: '#21252b',
          border: '1px solid #3b4252',
          borderRadius: '4px',
          color: '#abb2bf',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <RotateCcw size={15} />
      </button>

      <button
        onClick={toggleDevOverlay}
        title="Toggle Dev Diagnostics"
        style={{
          padding: '6px 8px',
          background: '#21252b',
          border: '1px solid #3b4252',
          borderRadius: '4px',
          color: '#c678dd',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Wrench size={15} />
      </button>
    </div>
  );
};
