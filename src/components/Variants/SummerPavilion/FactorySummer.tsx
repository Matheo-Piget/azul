import React, { useMemo } from "react";
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import '../Classics/Factory.css';

interface FactorySummerProps {
  factoryId: number;
}

const FactorySummer: React.FC<FactorySummerProps> = ({ factoryId }) => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  const factory = gameState.factories.find(f => f.id === factoryId);
  const isCurrentPlayer = gameState.currentPlayer === gameState.players.find(p => p.id === gameState.currentPlayer)?.id;
  const jokerColor = gameState.jokerColor || 'joker';

  // Regrouper les tuiles par couleur pour affichage
  const tilesByColor = useMemo(() => {
    const groupedTiles: Record<TileColor, number> = {
      blue: 0,
      yellow: 0,
      red: 0,
      black: 0,
      teal: 0,
      green: 0,
      purple: 0,
      orange: 0,
    };
    
    factory?.tiles.forEach(tile => {
      groupedTiles[tile.color]++;
    });
    
    return groupedTiles;
  }, [factory?.tiles]);

  // Vérifier si des tuiles sont déjà sélectionnées
  const hasSelectedTiles = selectedTiles && selectedTiles.length > 0;

  // Handler pour sélectionner des tuiles
  const handleSelectTiles = (color: TileColor) => {
    // Ne peut sélectionner que si c'est la phase drafting, aucune tuile n'est déjà sélectionnée, et c'est le tour du joueur
    if (gameState.gamePhase !== 'drafting' || hasSelectedTiles || !isCurrentPlayer) return;
    
    // Ne peut pas sélectionner la couleur joker directement, sauf exception
    const hasOnlyJokers = factory?.tiles.every(t => t.color === jokerColor);
    
    // Si on essaie de sélectionner directement des jokers:
    if (color === jokerColor && !hasOnlyJokers) {
      // Ne peut pas sélectionner directement la couleur joker, sauf si c'est tout ce qui reste
      return;
    }
    
    selectTiles(factoryId, color);
  };

  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" data-testid={`factory-summer-${factoryId}-empty`} />;
  }

  return (
    <div className="factory" data-testid={`factory-summer-${factoryId}`}> 
      <div className="factory-inner">
        {Object.entries(tilesByColor).map(([color, count]) => {
          if (count === 0) return null;
          const tileColor = color as TileColor;
          
          // Vérifier si cette couleur peut être sélectionnée
          const canSelect = gameState.gamePhase === 'drafting' && !hasSelectedTiles && isCurrentPlayer;
          
          // Règles spéciales pour le joker:
          // 1. Si ce sont uniquement des jokers, on peut en prendre un seul
          // 2. Sinon, on ne peut pas sélectionner directement des jokers
          const isJokerColor = tileColor === jokerColor;
          const onlyJokers = isJokerColor && factory.tiles.every(t => t.color === jokerColor);
          const isSelectable = canSelect && (!isJokerColor || onlyJokers);
          
          return (
            <div 
              key={color} 
              className={`factory-color-group ${isSelectable ? 'selectable' : ''}`}
              onClick={() => isSelectable && handleSelectTiles(tileColor)}
              style={{ cursor: isSelectable ? 'pointer' : 'default' }}
              title={isJokerColor && !onlyJokers ? 
                "Vous ne pouvez pas sélectionner directement des tuiles joker" : 
                `Sélectionner les tuiles ${tileColor}${isJokerColor ? " (une seule)" : ""}`}
            >
              {/* Affichage losange pour Summer Pavilion */}
              <div
                className={`diamond-tile tile-${color}`}
                style={{ width: 32, height: 32, margin: 2 }}
              />
              {count > 1 && (
                <span className="factory-tile-count">{count}</span>
              )}
            </div>
          );
        })}
        <div className="factory-id">Fabrique {factoryId + 1}</div>
      </div>
    </div>
  );
};

export default FactorySummer; 