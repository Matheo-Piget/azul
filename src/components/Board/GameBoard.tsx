import React, { useEffect, useState } from 'react';
import Factory from '../Factory/Factory';
import PlayerBoard from '../PlayerBoard/PlayerBoard';
import Center from '../Center/Center';
import { useGame } from '../../state/GameContext';

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
  
  return (
    <div className="game-board">
      <div className="game-info">
        <h2>Azul - Round {gameState.roundNumber}</h2>
        <div className="game-controls">
          <select 
            value={playerCount} 
            onChange={(e) => setPlayerCount(parseInt(e.target.value))}
          >
            <option value="2">2 joueurs</option>
            <option value="3">3 joueurs</option>
            <option value="4">4 joueurs</option>
          </select>
          <button onClick={handleNewGame}>Nouvelle partie</button>
        </div>
        <div className="game-phase">
          Phase: {gameState.gamePhase === 'drafting' ? 'Sélection des tuiles' : 
                  gameState.gamePhase === 'tiling' ? 'Placement des tuiles' :
                  gameState.gamePhase === 'scoring' ? 'Décompte des points' : 'Fin de partie'}
        </div>
      </div>
      
      <div className="factories-container">
        {gameState.factories.map(factory => (
          <Factory key={factory.id} factoryId={factory.id} />
        ))}
      </div>
      
      <Center />
      
      <div className="players-container">
        {gameState.players.map(player => (
          <PlayerBoard key={player.id} playerId={player.id} />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;