import React, { useEffect, useState } from 'react';
import Tile from '../../Tile/Tile';
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import './Center.css';

interface CenterProps {
  isAISelecting?: boolean;
}

const CenterClassic = React.forwardRef<HTMLDivElement, CenterProps>(({ isAISelecting = false }, ref) => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  if (gameState.center.length === 0) {
    return (
      <div className="center-container empty" ref={ref}>
        <div className="center center-empty">
          <div className="center-label">Aucune tuile</div>
        </div>
      </div>
    );
  }
  const tilesByColor: Record<TileColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    black: 0,
    teal: 0,
    green: 0,
    joker: 0,
  };
  gameState.center.forEach(tile => {
    tilesByColor[tile.color]++;
  });
  const hasSelectedTiles = selectedTiles && selectedTiles.length > 0;
  const selectedColor = hasSelectedTiles ? selectedTiles[0].color : null;
  const totalTiles = Object.values(tilesByColor).reduce((sum, count) => sum + count, 0);
  return (
    <div 
      className={`center-container ${gameState.center.length === 0 ? 'empty' : ''} ${isAISelecting ? 'ai-selecting' : ''}`}
      ref={ref}
    >
      <div className={`center ${isVisible ? 'visible' : ''}`}>
        {gameState.firstPlayerToken === null && (
          <div className="first-player-token" title="Premier joueur">
            <span className="marker-icon">1</span>
          </div>
        )}
        <div className="center-tiles">
          {Object.entries(tilesByColor).map(([color, count]) => {
            if (count === 0) return null;
            const isSelectable = !hasSelectedTiles || selectedColor === color || !hasSelectedTiles && gameState.gamePhase === 'drafting';
            const isSelected = selectedColor === color && hasSelectedTiles;
            return (
              <div 
                key={color} 
                className={`tile-group ${isSelected ? 'selected' : ''} ${isSelectable ? 'selectable' : ''}`}
                onClick={() => isSelectable && selectTiles(null, color as TileColor)}
                title={`${count} tuile${count > 1 ? 's' : ''} ${color}`}
              >
                {Array(Math.min(count, 4)).fill(0).map((_, i) => (
                  <Tile 
                    key={`${color}-${i}`}
                    color={color as TileColor}
                    selected={isSelected}
                    disabled={!isSelectable}
                  />
                ))}
                {count > 1 && <div className="tile-count">{count}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default CenterClassic; 