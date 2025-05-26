import React from 'react';
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import './JokerIndicator.css';

/**
 * Composant qui affiche la couleur joker de la manche en cours et les tuiles de bonus
 */
const JokerIndicator: React.FC = () => {
  const { gameState } = useGame();
  const jokerColor = gameState.jokerColor || 'joker';
  
  // Traduction des couleurs en français
  const colorNames: Record<TileColor, string> = {
    blue: 'Bleu',
    yellow: 'Jaune',
    red: 'Rouge',
    black: 'Noir',
    teal: 'Turquoise',
    green: 'Vert',
    purple: 'Violet',
    orange: 'Orange',
  };

  // Tuiles de bonus disponibles (10 tuiles en cercle)
  const bonusTiles = gameState.bonusTiles || [];
  const maxBonusTiles = 10;

  // Positions en cercle pour les tuiles de bonus
  const getBonusTilePositions = () => {
    const positions = [];
    const radius = 60;
    const centerX = 80;
    const centerY = 80;
    
    for (let i = 0; i < maxBonusTiles; i++) {
      const angle = (i / maxBonusTiles) * 2 * Math.PI - Math.PI / 2; // Commence en haut
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.push({ x, y });
    }
    return positions;
  };

  const bonusPositions = getBonusTilePositions();

  return (
    <div className="joker-indicator-container">
      {/* Couleur joker de la manche */}
      <div className="joker-indicator">
        <div className="joker-indicator-label">
          Couleur Joker pour la manche {gameState.roundNumber}:
        </div>
        <div className="joker-color-container">
          <div className={`diamond-tile tile-${jokerColor} joker-display-tile`} />
          <div className="joker-color-name">{colorNames[jokerColor as TileColor]}</div>
        </div>
        <div className="joker-info">
          Les tuiles de cette couleur peuvent remplacer n'importe quelle couleur lors du placement
        </div>
      </div>

      {/* Tuiles de bonus en cercle */}
      <div className="bonus-tiles-container">
        <div className="bonus-tiles-header">
          <h4>Tuiles de Bonus</h4>
          <p>Récompenses pour les réalisations (Statues, Fenêtres, Piliers)</p>
        </div>
        
        <div className="bonus-tiles-circle">
          <svg width="160" height="160" className="bonus-circle-bg">
            <circle 
              cx="80" 
              cy="80" 
              r="60" 
              fill="none" 
              stroke="rgba(26, 60, 91, 0.2)" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
          </svg>
          
          {bonusPositions.map((position, index) => {
            const tile = bonusTiles[index];
            const isEmpty = !tile;
            
            return (
              <div
                key={index}
                className={`bonus-tile-slot ${isEmpty ? 'empty' : 'filled'}`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                title={
                  isEmpty 
                    ? `Emplacement ${index + 1} (vide)` 
                    : `Tuile bonus: ${colorNames[tile.color as TileColor]}`
                }
              >
                {!isEmpty && (
                  <div className={`diamond-tile tile-${tile.color} bonus-tile`} />
                )}
                <div className="slot-number">{index + 1}</div>
              </div>
            );
          })}
        </div>

        {/* Légende des récompenses */}
        <div className="bonus-rewards-legend">
          <div className="reward-item">
            <span className="reward-icon">🏛️</span>
            <span className="reward-text">Pilier: 3 tuiles</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">🪟</span>
            <span className="reward-text">Fenêtre: 3 tuiles</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">🗿</span>
            <span className="reward-text">Statue: 2 tuiles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JokerIndicator;