import React from 'react';
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import './PlayerBoardSummer.css';

/**
 * Composant qui affiche la couleur joker de la manche en cours
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

  return (
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
  );
};

export default JokerIndicator; 