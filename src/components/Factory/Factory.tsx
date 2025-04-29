import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import { TileColor } from '../../models/types';
import './Factory.css';

interface FactoryProps {
  factoryId: number;
}

const Factory: React.FC<FactoryProps> = ({ factoryId }) => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  
  const factory = gameState.factories.find(f => f.id === factoryId);
  
  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" />;
  }
  
  // Fonction pour sélectionner toutes les tuiles d'une certaine couleur
  const handleTileClick = (color: TileColor) => {
    // Ne permettre la sélection que pendant la phase de draft et si aucune autre sélection n'est active
    if (gameState.gamePhase === 'drafting' && (!selectedTiles || selectedTiles.length === 0)) {
      selectTiles(factoryId, color);
    }
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
  
  // Vérifier si des tuiles sont déjà sélectionnées (pour désactiver les autres)
  const hasSelection = selectedTiles && selectedTiles.length > 0;
  
  return (
    <div className="factory">
      <div className="factory-inner">
        {Object.entries(tilesByColor).map(([color, count]) => {
          if (count === 0) return null;
          
          // Optimisation : afficher un groupe avec un nombre plutôt que plusieurs tuiles identiques
          return (
            <div key={color} className="factory-color-group">
              <Tile
                color={color as TileColor}
                onClick={() => handleTileClick(color as TileColor)}
                disabled={hasSelection}
              />
              {count > 1 && (
                <span className="factory-tile-count">{count}</span>
              )}
            </div>
          );
        })}
        <div className="factory-id">Factory {factoryId + 1}</div>
      </div>
      
    </div>
  );
};

export default Factory;