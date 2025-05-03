import React, { useEffect, useState } from 'react';
import Factory from '../Factory/Factory';
import PlayerBoard from '../PlayerBoard/PlayerBoard';
import Center from '../Center/Center';
import History from '../Utils/GameHistory';
import { useGame } from '../../state/GameContext';
import './Gameboard.css';
import AIPlayerConfig from '../AI/AIPlayerConfig';
import GameInfo from '../UI/Bag';

/**
 * GameBoard Component
 * 
 * @component
 * @description Main game interface that renders the entire Azul game board.
 * This component manages:
 * - Game initialization
 * - Display of factories, center area, and player boards
 * - Game status information
 * - Controls for starting a new game
 * 
 * @returns {React.ReactElement} The complete game board UI or a loading screen
 */
const GameBoard: React.FC = (): React.ReactElement => {
  const { gameState, startNewGame } = useGame();
  const [playerCount, setPlayerCount] = useState(2);
  
  /**
   * Effect to initialize a new game if none exists
   */
  useEffect(() => {
    // Start a new game if the board is empty
    if (!gameState || gameState.players.length === 0) {
      startNewGame(2);
    }
  }, [gameState, startNewGame]);
  
  /**
   * Handles starting a new game with the selected player count
   */
  const handleNewGame = () => {
    startNewGame(playerCount);
  };

  if (gameState && gameState.gamePhase === 'gameEnd') {
    return (
      <div className="game-over-screen">
        <h2>Partie terminée</h2>
        <p>Voir les résultats ci-dessous :</p>
        <History />
        <button onClick={handleNewGame} className="new-game-btn">Nouvelle partie</button>
      </div>
    );
  }
  
  // Show loading screen while game initializes
  if (!gameState || gameState.players.length === 0) {
    return <div className="loading-screen">Chargement du jeu...</div>;
  }
  
  // Find the active player
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  
  return (
    <div className="game-board">
      <div className="game-header">
        <div className="logo-container">
          <h1>Azul</h1>
          <div className="azulejo-pattern"></div>
        </div>
        
        <div className="game-banner">
          <div className="game-status">
            <div className="status-item">
              <span className="status-label">Tour</span>
              <span className="status-value">{gameState.roundNumber}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Phase</span>
              <span className="status-value">
                {gameState.gamePhase === 'drafting' ? 'Sélection' :
                 gameState.gamePhase === 'tiling' ? 'Placement' :
                 gameState.gamePhase === 'scoring' ? 'Décompte' : 'Fin de partie'}
              </span>
            </div>
            <div className="status-item current-player-info">
              <span className="status-label">Joueur actif</span>
              <span className="status-value">{currentPlayer?.name}</span>
            </div>
          </div>
          
          <div className="game-controls">
            <select
              id="player-count-select"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="player-select"
              aria-label="Sélectionner le nombre de joueurs"
            >
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
            </select>
            <button 
              onClick={handleNewGame} 
              className="new-game-btn"
              aria-label="Démarrer une nouvelle partie"
            >
              <span className="btn-icon">+</span>
              <span>Nouvelle partie</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="main-area">
        <div className="factories-area">
          <h2>Fabriques</h2>
          <div className="factories-container">
            {gameState.factories.map(factory => (
              <Factory key={factory.id} factoryId={factory.id} />
            ))}
          </div>
          
          <div className="center-area">
            <h2>Centre</h2>
            <Center />
            <GameInfo />
          </div>
        </div>
        
        <div className="players-area">
          <AIPlayerConfig />
          <h2>Plateaux des joueurs</h2>
          <div className="players-container">
            {gameState.players.map(player => (
              <div 
                key={player.id} 
                className={`player-board-container ${player.id === gameState.currentPlayer ? 'active-player' : ''}`}
              >
                <div className="player-header">
                  <h3>{player.name} {player.id === gameState.currentPlayer && '(actif)'}</h3>
                  <div className="player-score">
                    <span className="score-value">{player.board.score}</span>
                    <span className="score-label">points</span>
                  </div>
                </div>
                <PlayerBoard playerId={player.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="game-footer">
        <div className="game-signature">Azul - Inspiré du jeu de société créé par Michael Kiesling</div>
      </footer>
    </div>
  );
};

export default GameBoard;