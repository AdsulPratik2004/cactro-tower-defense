import { GameCanvas } from './components/GameCanvas';
import { TopBar } from './components/HUD/TopBar';
import { TowerShop } from './components/HUD/TowerShop';
import { TowerInfoPanel } from './components/HUD/TowerInfoPanel';
import { Controls } from './components/HUD/Controls';
import { DevOverlay } from './components/HUD/DevOverlay';
import { WaveBanner } from './components/HUD/WaveBanner';
import { MainMenu } from './components/Screens/MainMenu';
import { GameOverScreen } from './components/Screens/GameOverScreen';
import { VictoryScreen } from './components/Screens/VictoryScreen';

export default function App() {
  return (
    <div
      style={{
        background: '#0a0c10',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        color: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      <GameCanvas>
        <TopBar />
        <Controls />
        <WaveBanner />
        <TowerShop />
        <TowerInfoPanel />
        <DevOverlay />
        <MainMenu />
        <GameOverScreen />
        <VictoryScreen />
      </GameCanvas>
    </div>
  );
}
