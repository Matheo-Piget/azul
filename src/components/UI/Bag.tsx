import React from 'react';
import { useGame } from '../../state/GameContext';
import './Bag.css'

const GameInfo: React.FC = () => {
  const { gameState } = useGame();
  
  // Information about bag and discard pile
  const bagCount = gameState.bag.length;
  const discardCount = gameState.discardPile.length;
  
  return (
    <div className="game-info-panel">
      <div className="info-item">
        <div className="info-label">Sac</div>
        <div className="info-value">{bagCount} tuiles</div>
      </div>
      <div className="info-item">
        <div className="info-label">Défausse</div>
        <div className="info-value">{discardCount} tuiles</div>
      </div>
    </div>
  );
};

export default GameInfo;