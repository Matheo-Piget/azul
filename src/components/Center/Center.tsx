import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import './Center.css';

const Center: React.FC = () => {
  const { gameState, selectTiles } = useGame();
  
  // Vérifier si le centre est vide
  if (gameState.center.length === 0) {
    return <div className="center center-empty">
      <p>Le centre est vide</p>
    </div>;
  }
  
  // Logique pour regrouper les tuiles par couleur
  const tilesByColor: Record<string, number> = {};
  
  gameState.center.forEach(tile => {
    if (!tilesByColor[tile.color]) {
      tilesByColor[tile.color] = 0;
    }
    tilesByColor[tile.color]++;
  });
  
  return (
    <div className="center">
      {gameState.firstPlayerToken && (
        <div className="first-player-token">1er</div>
      )}
      
      <div className="center-tiles">
        {Object.entries(tilesByColor).map(([color, count]) => (
          <div key={color} className="color-group">
            {Array(count).fill(0).map((_, i) => (
              <Tile 
                key={`center-${color}-${i}`}
                color={color as any}
                onClick={() => selectTiles(null, color as any)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Center;