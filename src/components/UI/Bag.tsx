import React, { useEffect, useRef, useState } from 'react';
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
  
  // State to track previous values for animation
  const [prevBagCount, setPrevBagCount] = useState(gameState.bag.length);
  const [prevDiscardCount, setPrevDiscardCount] = useState(gameState.discardPile.length);
  
  // Information about bag and discard pile
  const bagCount = gameState.bag.length;
  const discardCount = gameState.discardPile.length;
  
  // Refs for animation elements
  const bagValueRef = useRef<HTMLDivElement>(null);
  const discardValueRef = useRef<HTMLDivElement>(null);
  
  // Add animation when values change
  useEffect(() => {
    if (bagCount !== prevBagCount && bagValueRef.current) {
      bagValueRef.current.classList.add('value-change');
      setTimeout(() => {
        bagValueRef.current?.classList.remove('value-change');
      }, 400);
      setPrevBagCount(bagCount);
    }
    
    if (discardCount !== prevDiscardCount && discardValueRef.current) {
      discardValueRef.current.classList.add('value-change');
      setTimeout(() => {
        discardValueRef.current?.classList.remove('value-change');
      }, 400);
      setPrevDiscardCount(discardCount);
    }
  }, [bagCount, discardCount, prevBagCount, prevDiscardCount]);
  
  return (
    <div className="game-info-panel">
      <div className="info-item">
        <div className="info-label">
          <span className="bag-icon">🎒</span>
          Sac
        </div>
        <div className="info-value" ref={bagValueRef}>
          {bagCount} tuiles
        </div>
      </div>
      <div className="info-item">
        <div className="info-label">
          <span className="discard-icon">♻️</span>
          Défausse
        </div>
        <div className="info-value" ref={discardValueRef}>
          {discardCount} tuiles
        </div>
      </div>
    </div>
  );
};

export default GameInfo;