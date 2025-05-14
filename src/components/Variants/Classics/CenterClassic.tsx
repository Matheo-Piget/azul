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
  if (gameState.center.length === 0 && gameState.firstPlayerToken !== null) {
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
    purple: 0,
    orange: 0,
  };
  gameState.center.forEach(tile => {
    tilesByColor[tile.color]++;
  });
  const hasSelectedTiles = selectedTiles && selectedTiles.length > 0;
  const selectedColor = hasSelectedTiles ? selectedTiles[0].color : null;
  const totalTiles = Object.values(tilesByColor).reduce((sum, count) => sum + count, 0);
  const hasFirstPlayerToken = gameState.firstPlayerToken === null;
  return (
    <div 
      className={`center-container ${gameState.center.length === 0 && !hasFirstPlayerToken ? 'empty' : ''} ${isAISelecting ? 'ai-selecting' : ''}`}
      ref={ref}
    >
      <div className={`center ${isVisible ? 'visible' : ''}`}>
        <div className="center-tiles">
          {/* First Player Tile */}
          {hasFirstPlayerToken && (
            <div 
              className="first-player-tile-group"
              title="Tuile Premier Joueur - Le joueur qui la prend commencera le prochain tour"
            >
              <div className="first-player-tile">1</div>
            </div>
          )}
          
          {Object.entries(tilesByColor).map(([color, count]) => {
            if (count === 0) return null;
            const isSelectable = !hasSelectedTiles || selectedColor === color || (!hasSelectedTiles && gameState.gamePhase === 'drafting');
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