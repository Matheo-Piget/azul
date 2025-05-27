import React, { useState, useEffect, useRef } from "react";
import GameBoard from './components/Board/GameBoard';
import GameBoardSummer from './components/Variants/SummerPavilion/GameBoardSummer';
import { GameProvider, useGame } from './state/GameContext';
import { NotificationProvider } from './components/UI/NotificationSystem';
import { TutorialProvider } from './components/Tutorial/TutorialSystem';
import RoomLobby from "./online/components/RoomLobby";
import './App.css';

const VARIANTS = [
  { value: "classic", label: "Azul Classique" },
  { value: "summer", label: "Azul : Pavillon d'été" },
  // { value: "sintra", label: "Azul : Les vitraux de Sintra" },
];

// Composant conteneur pour gérer le changement de variante
const GameContainer: React.FC<{ variant: string }> = ({ variant }) => {
  const { setVariant, startNewGame } = useGame();
  const prevVariantRef = useRef(variant);
  
  // Effet pour changer la variante et démarrer une nouvelle partie
  useEffect(() => {
    if (variant !== prevVariantRef.current) {
      setVariant(variant);
      // Démarrer une nouvelle partie avec 2 joueurs par défaut
      startNewGame(2);
      prevVariantRef.current = variant;
    }
  }, [variant, setVariant, startNewGame]);

  return variant === 'summer' ? <GameBoardSummer /> : <GameBoard />;
};

const App: React.FC = () => {
  const [variant, setVariant] = useState("classic");
  const [gameMode, setGameMode] = useState<'local' | 'online'>('local');

  return (
    <div className="App">
      <div className="mode-selector">
        <button 
          className={`mode-btn ${gameMode === 'local' ? 'active' : ''}`}
          onClick={() => setGameMode('local')}
        >
          🏠 Jeu Local
        </button>
        <button 
          className={`mode-btn ${gameMode === 'online' ? 'active' : ''}`}
          onClick={() => setGameMode('online')}
        >
          🌐 Multijoueur
        </button>
      </div>

      {gameMode === 'local' ? (
        

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
            <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
              Changer de variante lancera automatiquement une nouvelle partie.
              Chaque variante a ses propres règles et mécaniques.
            </div>
          </div>
          <GameProvider initialVariant={variant}>
            <GameContainer variant={variant} />
          </GameProvider>
        </TutorialProvider>
      </NotificationProvider>

      ) : (
        <RoomLobby />
      )}
    </div>
  );
};

export default App;