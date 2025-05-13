import React from 'react';
import Tile from '../../Tile/Tile';
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import './Factory.css';

interface FactoryProps {
  factoryId: number;
  isAISelecting?: boolean;
}

const FactoryClassic = React.forwardRef<HTMLDivElement, FactoryProps>(({ factoryId, isAISelecting = false }, ref) => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  const factory = gameState.factories.find(f => f.id === factoryId);
  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" data-testid={`factory-${factoryId}-empty`} />;
  }
  const handleTileClick = (color: TileColor) => {
    if (gameState.gamePhase === 'drafting' && (!selectedTiles || selectedTiles.length === 0)) {
      selectTiles(factoryId, color);
    }
  };
  const tilesByColor: Record<TileColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    black: 0,
    teal: 0,
    green: 0,
    joker: 0,
  };
  factory.tiles.forEach(tile => {
    tilesByColor[tile.color]++;
  });
  const hasSelection = selectedTiles && selectedTiles.length > 0;
  return (
    <div 
      className={`factory ${!factory || factory.tiles.length === 0 ? 'factory-empty' : ''} ${isAISelecting ? 'ai-selecting' : ''}`} 
      data-testid={`factory-${factoryId}`}
      ref={ref}
    >
      <div className="factory-inner">
        {Object.entries(tilesByColor).map(([color, count]) => {
          if (count === 0) return null;
          const colorKey = color as TileColor;
          return (
            <div 
              key={color} 
              className="factory-color-group"
              data-testid={`factory-${factoryId}-${color}-group`}
            >
              <Tile
                color={colorKey}
                onClick={() => handleTileClick(colorKey)}
                disabled={hasSelection}
                data-testid={`factory-${factoryId}-${color}-tile`}
              />
              {count > 1 && (
                <span className="factory-tile-count" data-testid={`factory-${factoryId}-${color}-count`}>
                  {count}
                </span>
              )}
            </div>
          );
        })}
        <div className="factory-id">Factory {factoryId + 1}</div>
      </div>
    </div>
  );
});

export default FactoryClassic; 