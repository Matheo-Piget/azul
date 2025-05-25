import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useGame } from '../../state/GameContext';
import { TileColor } from '../../models/types';
import Tile from '../Tile/Tile';
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

  // Group tiles by color for better visual organization
  const tileGroups = useMemo(() => {
    const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal', 'green', 'purple', 'orange'];
    const bagGroups: Record<TileColor, number> = {} as Record<TileColor, number>;
    const discardGroups: Record<TileColor, number> = {} as Record<TileColor, number>;

    // Initialize counters
    colors.forEach(color => {
      bagGroups[color] = 0;
      discardGroups[color] = 0;
    });

    // Count tiles in bag
    gameState.bag.forEach(tile => {
      bagGroups[tile.color]++;
    });

    // Count tiles in discard pile
    gameState.discardPile.forEach(tile => {
      discardGroups[tile.color]++;
    });

    return { bagGroups, discardGroups };
  }, [gameState.bag, gameState.discardPile]);
  
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

  // Render tile groups for a collection
  const renderTileGroups = (groups: Record<TileColor, number>, type: 'bag' | 'discard') => {
    const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal', 'green', 'purple', 'orange'];
    
    return (
      <div className="tile-groups">
        {colors.map(color => {
          const count = groups[color];
          if (count === 0) return null;
          
          return (
            <div key={color} className="tile-group">
              <div className="tile-sample">
                <Tile color={color} size="small" />
              </div>
              <div className="tile-count">{count}</div>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="game-info-panel">
      <div className="info-section bag-section">
        <div className="section-header">
          <div className="section-icon">🎒</div>
          <div className="section-title">
            <h3>Sac</h3>
            <div className="total-count" ref={bagValueRef}>
              {bagCount} tuiles
            </div>
          </div>
        </div>
        <div className="section-content">
          {bagCount > 0 ? (
            renderTileGroups(tileGroups.bagGroups, 'bag')
          ) : (
            <div className="empty-state">Sac vide</div>
          )}
        </div>
      </div>

      <div className="info-section discard-section">
        <div className="section-header">
          <div className="section-icon">♻️</div>
          <div className="section-title">
            <h3>Défausse</h3>
            <div className="total-count" ref={discardValueRef}>
              {discardCount} tuiles
            </div>
          </div>
        </div>
        <div className="section-content">
          {discardCount > 0 ? (
            renderTileGroups(tileGroups.discardGroups, 'discard')
          ) : (
            <div className="empty-state">Défausse vide</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;