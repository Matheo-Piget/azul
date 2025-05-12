import React, { useState, useEffect } from 'react';
import './ScoringAnimation.css';
import { Player } from '../../models/types';

interface BonusItem {
  type: string;
  label: string;
  value: number;
  icon: string;
}

interface FinalScoringAnimationProps {
  players: Player[];
  bonusDetails: {
    [playerId: string]: {
      rowsCompleted: number;
      columnsCompleted: number;
      colorsCompleted: number;
      baseScore: number;
    }
  };
  onComplete: () => void;
}

const FinalScoringAnimation: React.FC<FinalScoringAnimationProps> = ({ 
  players, 
  bonusDetails,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [showFinalButton, setShowFinalButton] = useState(false);
  const [highlightedBonus, setHighlightedBonus] = useState<{ [playerId: string]: string }>({});

  // Calculate winner
  const maxScore = Math.max(...players.map(p => p.board.score));
  const winners = players.filter(p => p.board.score === maxScore);

  // Prepare player data with bonuses
  const playersWithBonuses = players.map(player => {
    const details = bonusDetails[player.id];
    
    if (!details) return { player, bonuses: [] };
    
    const bonuses: BonusItem[] = [];
    
    // Base score
    bonuses.push({
      type: 'base',
      label: 'Score de base',
      value: details.baseScore,
      icon: '🧮'
    });
    
    // Row bonuses
    if (details.rowsCompleted > 0) {
      bonuses.push({
        type: 'rows',
        label: `${details.rowsCompleted} ligne${details.rowsCompleted > 1 ? 's' : ''} complète${details.rowsCompleted > 1 ? 's' : ''}`,
        value: details.rowsCompleted * 2,
        icon: '➡️'
      });
    }
    
    // Column bonuses
    if (details.columnsCompleted > 0) {
      bonuses.push({
        type: 'columns',
        label: `${details.columnsCompleted} colonne${details.columnsCompleted > 1 ? 's' : ''} complète${details.columnsCompleted > 1 ? 's' : ''}`,
        value: details.columnsCompleted * 7,
        icon: '⬇️'
      });
    }
    
    // Color bonuses
    if (details.colorsCompleted > 0) {
      bonuses.push({
        type: 'colors',
        label: `${details.colorsCompleted} couleur${details.colorsCompleted > 1 ? 's' : ''} complète${details.colorsCompleted > 1 ? 's' : ''}`,
        value: details.colorsCompleted * 10,
        icon: '🎨'
      });
    }
    
    return { player, bonuses };
  });

  // Animation sequence
  useEffect(() => {
    if (currentStep === -1) {
      // Start sequence after a short delay
      setTimeout(() => setCurrentStep(0), 1000);
      return;
    }
    
    if (currentStep >= playersWithBonuses.length) {
      // All players' scores shown, show final button
      setShowFinalButton(true);
      return;
    }
    
    // Animate the bonuses for the current player
    const currentPlayer = playersWithBonuses[currentStep];
    if (!currentPlayer) return;
    
    // Wait a bit, then show base score
    setTimeout(() => {
      setHighlightedBonus(prev => ({ ...prev, [currentPlayer.player.id]: 'base' }));
      
      // Then highlight each bonus in sequence
      if (currentPlayer.bonuses.length > 1) {
        const timePerBonus = 1500;
        
        currentPlayer.bonuses.slice(1).forEach((bonus, i) => {
          setTimeout(() => {
            setHighlightedBonus(prev => ({ ...prev, [currentPlayer.player.id]: bonus.type }));
          }, (i + 1) * timePerBonus);
        });
        
        // Move to next player after all bonuses shown plus buffer
        setTimeout(() => {
          setCurrentStep(current => current + 1);
        }, (currentPlayer.bonuses.length + 0.5) * timePerBonus);
      } else {
        // No bonus items, move to next player quickly
        setTimeout(() => {
          setCurrentStep(current => current + 1);
        }, 1500);
      }
    }, 500);
  }, [currentStep, playersWithBonuses]);

  return (
    <div className="final-scoring-container">
      <h2 className="final-scoring-header">Score Final</h2>
      
      {playersWithBonuses.map(({ player, bonuses }, index) => (
        <div 
          key={player.id}
          className={`final-scoring-player ${
            winners.some(w => w.id === player.id) ? 'final-scoring-winner' : ''
          } ${currentStep >= index ? 'visible' : 'hidden'}`}
          style={{ 
            opacity: currentStep >= index ? 1 : 0,
            transform: `translateY(${currentStep >= index ? 0 : 30}px)`,
            transition: 'opacity 0.5s ease, transform 0.5s ease'
          }}
        >
          <div className="final-scoring-player-header">
            <div className="final-scoring-player-name">{player.name}</div>
            <div className="final-scoring-total">{player.board.score} points</div>
          </div>
          
          <div className="final-scoring-bonus-list">
            {bonuses.map(bonus => (
              <div 
                key={bonus.type}
                className={`final-scoring-bonus-item ${
                  highlightedBonus[player.id] === bonus.type ? 'highlight' : ''
                }`}
              >
                <div className="final-scoring-bonus-label">
                  <span className="final-scoring-bonus-icon">{bonus.icon}</span>
                  <span>{bonus.label}</span>
                </div>
                <div className="final-scoring-bonus-value">+{bonus.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {showFinalButton && (
        <button 
          className="final-scoring-button"
          onClick={onComplete}
        >
          Terminer
        </button>
      )}
    </div>
  );
};

export default FinalScoringAnimation;