import React from 'react';
import { useGame } from '../../state/GameContext';
import './Bag.css';

/**
 * GameInfo component displaying information about game elements
 * 
 * Shows the number of tiles in the bag and discard pile during an Azul game.
 * Uses the game state from the GameContext.
 * 
 * @returns {React.ReactElement} Component displaying bag and discard information
 */
const GameInfo: React.FC = () => {
  const { gameState } = useGame();
  
  // Information about bag and discard pile
  const bagCount = gameState.bag.length;
  const discardCount = gameState.discardPile.length;
  
  return (
    <div className="game-info-panel">
      <div className="info-item">
        <div className="info-label">Bag</div>
        <div className="info-value">{bagCount} tiles</div>
      </div>
      <div className="info-item">
        <div className="info-label">Discard</div>
        <div className="info-value">{discardCount} tiles</div>
      </div>
    </div>
  );
};

export default GameInfo;