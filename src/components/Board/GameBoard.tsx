import React, { useEffect, useState } from 'react';
import Factory from '../Factory/Factory';
import PlayerBoard from '../PlayerBoard/PlayerBoard';
import Center from '../Center/Center';
import { useGame } from '../../state/GameContext';
import './Gameboard.css';

const GameBoard: React.FC = () => {
  const { gameState, startNewGame } = useGame();
  const [playerCount, setPlayerCount] = useState(2);
  
  useEffect(() => {
    // Démarrer une nouvelle partie si le plateau est vide
    if (!gameState || gameState.players.length === 0) {
      startNewGame(2);
    }
  }, [gameState, startNewGame]);
  
  const handleNewGame = () => {
    startNewGame(playerCount);
  };
  
  if (!gameState || gameState.players.length === 0) {
    return <div>Chargement...</div>;
  }
  
  // Trouver le joueur actif
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  
  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Azul</h1>
        <div className="game-info">
          <div className="game-status">
            <p className="round-info">Round {gameState.roundNumber}</p>
            <p className="player-info">
              Joueur actif: <span className="current-player">{currentPlayer?.name}</span>
            </p>
            <p className="phase-info">
              Phase: {gameState.gamePhase === 'drafting' ? 'Sélection des tuiles' :
                     gameState.gamePhase === 'tiling' ? 'Placement des tuiles' :
                     gameState.gamePhase === 'scoring' ? 'Décompte des points' : 'Fin de partie'}
            </p>
          </div>
          
          <div className="game-controls">
            <select
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="player-select"
            >
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
            </select>
            <button onClick={handleNewGame} className="new-game-btn">Nouvelle partie</button>
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
          </div>
        </div>
        
        <div className="players-area">
          <h2>Plateaux des joueurs</h2>
          <div className="players-container">
            {gameState.players.map(player => (
              <div 
                key={player.id} 
                className={`player-board-container ${player.id === gameState.currentPlayer ? 'active-player' : ''}`}
              >
                <h3>{player.name} {player.id === gameState.currentPlayer && '(actif)'}</h3>
                <PlayerBoard playerId={player.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;