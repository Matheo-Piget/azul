import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import { TileColor } from '../../models/types';
import './Center.css';

const Center: React.FC = () => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  
  // Vérifier si le centre est vide
  if (gameState.center.length === 0) {
    return (
      <div className="center center-empty">
        <div className="center-placeholder">Centre</div>
      </div>
    );
  }
  
  // Logique pour regrouper les tuiles par couleur
  const tilesByColor: Record<TileColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    black: 0,
    teal: 0
  };
  
  gameState.center.forEach(tile => {
    tilesByColor[tile.color]++;
  });
  
  // Vérifier si certaines tuiles sont déjà sélectionnées pour les mettre en évidence
  const hasSelectedTiles = selectedTiles && selectedTiles.length > 0;
  const selectedColor = hasSelectedTiles ? selectedTiles[0].color : null;
  
  return (
    <div className="center">
      {gameState.firstPlayerToken === null && (
        <div className="first-player-marker">
          <span className="marker-icon">1</span>
        </div>
      )}
      
      <div className="center-tiles">
        {Object.entries(tilesByColor).map(([color, count]) => {
          if (count === 0) return null;
          
          // Déterminer si ces tuiles sont sélectionnables
          const isSelectable = !hasSelectedTiles || gameState.gamePhase !== 'drafting';
          // Déterminer si ces tuiles sont actuellement sélectionnées
          const isSelected = selectedColor === color && hasSelectedTiles;
          
          return (
            <div key={color} className="color-group">
              {Array(count).fill(0).map((_, i) => (
                <Tile
                  key={`center-${color}-${i}`}
                  color={color as TileColor}
                  onClick={() => selectTiles(null, color as TileColor)}
                  selected={isSelected}
                  disabled={!isSelectable}
                />
              ))}
              {count > 1 && <span className="tile-count">{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Center;