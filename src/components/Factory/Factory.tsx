import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import { TileColor } from '../../models/types';
import './Factory.css';

interface FactoryProps {
  factoryId: number;
}

const Factory: React.FC<FactoryProps> = ({ factoryId }) => {
  const { gameState, selectTiles } = useGame();
  
  const factory = gameState.factories.find(f => f.id === factoryId);
  
  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" />;
  }
  
  // Fonction pour sélectionner toutes les tuiles d'une certaine couleur
  const handleTileClick = (color: TileColor) => {
    selectTiles(factoryId, color);
  };
  
  // Regrouper les tuiles par couleur pour l'affichage
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
  
  return (
    <div className="factory">
      {Object.entries(tilesByColor).map(([color, count]) => {
        if (count === 0) return null;
        
        return Array(count).fill(0).map((_, index) => (
          <Tile 
            key={`${factoryId}-${color}-${index}`}
            color={color as TileColor}
            onClick={() => handleTileClick(color as TileColor)}
          />
        ));
      })}
    </div>
  );
};

export default Factory;