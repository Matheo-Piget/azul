import React from "react";
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import '../Classics/Factory.css';

interface FactorySummerProps {
  factoryId: number;
}

const FactorySummer: React.FC<FactorySummerProps> = ({ factoryId }) => {
  const { gameState } = useGame();
  const factory = gameState.factories.find(f => f.id === factoryId);

  // Regrouper les tuiles par couleur pour affichage
  const tilesByColor: Record<TileColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    black: 0,
    teal: 0,
    green: 0,
    joker: 0,
  };
  factory?.tiles.forEach(tile => {
    tilesByColor[tile.color]++;
  });

  if (!factory || factory.tiles.length === 0) {
    return <div className="factory factory-empty" data-testid={`factory-summer-${factoryId}-empty`} />;
  }

  return (
    <div className="factory" data-testid={`factory-summer-${factoryId}`}> 
      <div className="factory-inner">
        {Object.entries(tilesByColor).map(([color, count]) => {
          if (count === 0) return null;
          return (
            <div key={color} className="factory-color-group">
              {/* Affichage losange pour Summer Pavilion */}
              {Array(count).fill(0).map((_, i) => (
                <div
                  key={`${color}-${i}`}
                  className={`diamond-tile tile-${color}`}
                  style={{ width: 32, height: 32, margin: 2 }}
                />
              ))}
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