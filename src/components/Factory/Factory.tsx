import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import { TileColor } from '../../models/types';
import './Factory.css';

/**
 * Props for the Factory component
 * @interface FactoryProps
 * @property {number} factoryId - Unique identifier for the factory (0-based index)
 * @property {boolean} [isAISelecting] - Indicates if the AI is selecting tiles (optional)
 */
interface FactoryProps {
  factoryId: number;
  isAISelecting?: boolean;
}

/**
 * Factory component that displays a collection of colored tiles
 * 
 * This component represents a factory display in the Azul board game.
 * It shows colored tiles grouped by color for better visual clarity,
 * and allows players to select tiles during the drafting phase.
 * 
 * @component
 * @param {FactoryProps} props - The component props
 * @returns {React.ReactElement} A factory display with grouped tiles
 */
const Factory = React.forwardRef<HTMLDivElement, FactoryProps>(({
  factoryId,
  isAISelecting = false
}, ref) => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  
  const factory = gameState.factories.find(f => f.id === factoryId);
  
  // If the factory doesn't exist or is empty, render an empty factory display
  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" data-testid={`factory-${factoryId}-empty`} />;
  }
  
  /**
   * Handles tile selection when a player clicks on a tile
   * Selects all tiles of the chosen color from this factory
   * 
   * @param {TileColor} color - The color of tiles to select
   */
  const handleTileClick = (color: TileColor) => {
    // Only allow selection during the drafting phase and if no other selection is active
    if (gameState.gamePhase === 'drafting' && (!selectedTiles || selectedTiles.length === 0)) {
      selectTiles(factoryId, color);
    }
  };
  
  // Group tiles by color for more efficient display
  const tilesByColor: Record<TileColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    black: 0,
    teal: 0
  };
  
  factory.tiles.forEach(tile => {
    tilesByColor[tile.color]++;
  });
  
  // Check if tiles are already selected (to disable other selections)
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

export default Factory;