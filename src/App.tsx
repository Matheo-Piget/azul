import React, { useState } from "react";
import GameBoard from './components/Board/GameBoard';
import GameBoardSummer from './components/Variants/SummerPavilion/GameBoardSummer';
import { GameProvider } from './state/GameContext';
import { NotificationProvider } from './components/UI/NotificationSystem';
import { TutorialProvider } from './components/Tutorial/TutorialSystem';
import './App.css';

const VARIANTS = [
  { value: "classic", label: "Azul Classique" },
  { value: "summer", label: "Azul : Pavillon d'été" },
  // { value: "sintra", label: "Azul : Les vitraux de Sintra" },
];

const App: React.FC = () => {
  const [variant, setVariant] = useState("classic");

  return (
    <div className="App">
      <NotificationProvider>
        <TutorialProvider>
          <div className="variant-selector-container" style={{ padding: 16, background: '#f7f7f7', borderBottom: '1px solid #e1e8ed' }}>
            <label htmlFor="variant-select" style={{ marginRight: 8, fontWeight: 600 }}>Variante :</label>
            <select
              id="variant-select"
              value={variant}
              onChange={e => setVariant(e.target.value)}
              style={{ padding: 6, borderRadius: 4, border: '1px solid #d0d9e1', fontSize: 15 }}
            >
              {VARIANTS.map(v => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>
          <GameProvider initialVariant={variant}>
            {variant === 'summer' ? <GameBoardSummer /> : <GameBoard />}
          </GameProvider>
        </TutorialProvider>
      </NotificationProvider>
    </div>
  );
};

export default App;