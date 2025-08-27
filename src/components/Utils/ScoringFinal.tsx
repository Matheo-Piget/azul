import React, { useState, useEffect, useMemo } from 'react';
import { Player, TileColor } from '../../models/types';
import './ScoringFinal.css';
import { useGame } from '../../state/GameContext';

interface BonusItem {
  type: string;
  label: string;
  value: number;
  icon: string;
  elements?: {row?: number, col?: number, color?: TileColor}[];
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
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBonusIndex, setCurrentBonusIndex] = useState(-1);
  const [showFinalButton, setShowFinalButton] = useState(false);
  const [animatingElements, setAnimatingElements] = useState<{
    type: 'row' | 'column' | 'color';
    index?: number;
    color?: TileColor;
  } | null>(null);
  const { setIsPaused } = useGame();

  // Calculate winner and final standings
  const finalStandings = useMemo(() => {
    const sortedPlayers = [...players].sort((a, b) => b.board.score - a.board.score);
    return sortedPlayers.map((player, index) => ({
      ...player,
      position: index + 1,
      isWinner: index === 0
    }));
  }, [players]);

  // Prepare player data with bonuses
  const playersWithBonuses = useMemo(() => {
    return players.map(player => {
      const details = bonusDetails[player.id];
      
      if (!details) return { player, bonuses: [] };
      
      const bonuses: BonusItem[] = [];
      
      // Base score
      bonuses.push({
        type: 'base',
        label: 'Score de base',
        value: details.baseScore,
        icon: '🏛️'
      });
      
      // Row bonuses
      if (details.rowsCompleted > 0) {
        const rowElements: {row: number}[] = [];
        for (let row = 0; row < 5; row++) {
          if (player.board.wall[row].every(space => space.filled)) {
            rowElements.push({ row });
          }
        }
        
        bonuses.push({
          type: 'rows',
          label: `${details.rowsCompleted} ligne${details.rowsCompleted > 1 ? 's' : ''} complète${details.rowsCompleted > 1 ? 's' : ''}`,
          value: details.rowsCompleted * 2,
          icon: '➡️',
          elements: rowElements
        });
      }
      
      // Column bonuses
      if (details.columnsCompleted > 0) {
        const colElements: {col: number}[] = [];
        for (let col = 0; col < 5; col++) {
          if (player.board.wall.every(row => row[col].filled)) {
            colElements.push({ col });
          }
        }
        
        bonuses.push({
          type: 'columns',
          label: `${details.columnsCompleted} colonne${details.columnsCompleted > 1 ? 's' : ''} complète${details.columnsCompleted > 1 ? 's' : ''}`,
          value: details.columnsCompleted * 7,
          icon: '⬇️',
          elements: colElements
        });
      }
      
      // Color bonuses
      if (details.colorsCompleted > 0) {
        const colorElements: {color: TileColor}[] = [];
        const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
        
        colors.forEach(color => {
          const colorCount = player.board.wall
            .flat()
            .filter(space => space.color === color && space.filled)
            .length;
          
          if (colorCount === 5) {
            colorElements.push({ color });
          }
        });
        
        bonuses.push({
          type: 'colors',
          label: `${details.colorsCompleted} couleur${details.colorsCompleted > 1 ? 's' : ''} complète${details.colorsCompleted > 1 ? 's' : ''}`,
          value: details.colorsCompleted * 10,
          icon: '🎨',
          elements: colorElements
        });
      }
      
      return { player, bonuses };
    });
  }, [players, bonusDetails]);

  // Animation sequence
  useEffect(() => {
    if (currentStep === -1) {
      setTimeout(() => setCurrentStep(0), 800);
      return;
    }
    
    if (currentPlayerIndex >= playersWithBonuses.length) {
      setShowFinalButton(true);
      return;
    }
    
    const currentPlayer = playersWithBonuses[currentPlayerIndex];
    if (!currentPlayer) return;
    
    if (currentBonusIndex === -1) {
      setTimeout(() => setCurrentBonusIndex(0), 600);
      return;
    }
    
    if (currentBonusIndex >= currentPlayer.bonuses.length) {
      setTimeout(() => {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setCurrentBonusIndex(-1);
        setAnimatingElements(null);
      }, 1200);
      return;
    }
    
    const currentBonus = currentPlayer.bonuses[currentBonusIndex];
    
    // Set animation elements
    if (currentBonus.type === 'rows' && currentBonus.elements) {
      setAnimatingElements({
        type: 'row',
        index: currentBonus.elements[0]?.row
      });
    } else if (currentBonus.type === 'columns' && currentBonus.elements) {
      setAnimatingElements({
        type: 'column',
        index: currentBonus.elements[0]?.col
      });
    } else if (currentBonus.type === 'colors' && currentBonus.elements) {
      setAnimatingElements({
        type: 'color',
        color: currentBonus.elements[0]?.color
      });
    } else {
      setAnimatingElements(null);
    }
    
    setTimeout(() => {
      setCurrentBonusIndex(currentBonusIndex + 1);
    }, 2000);
  }, [currentStep, currentPlayerIndex, currentBonusIndex, playersWithBonuses]);

  // Helper function to get tile color
  const getTileColor = (color: TileColor): string => {
    const colorMap: Record<TileColor, string> = {
      blue: '#1e88e5',
      yellow: '#fdd835',
      red: '#e53935',
      black: '#424242',
      teal: '#00897b',
      green: '#43a047',
      purple: '#9c27b0',
      orange: '#ff9800',
    };
    return colorMap[color];
  };

  // Render a player's wall with highlighting
  const renderPlayerWall = (player: Player, isCurrentlyAnimating: boolean) => {
    return (
      <div className="final-scoring-wall">
        {player.board.wall.map((row, rowIdx) => (
          <div key={rowIdx} className="wall-row">
            {row.map((space, colIdx) => {
              const isHighlighted = isCurrentlyAnimating && animatingElements && (
                (animatingElements.type === 'row' && animatingElements.index === rowIdx) ||
                (animatingElements.type === 'column' && animatingElements.index === colIdx) ||
                (animatingElements.type === 'color' && animatingElements.color === space.color)
              );
              
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`wall-space ${space.filled ? 'filled' : 'empty'} ${isHighlighted ? 'bonus-highlight' : ''}`}
                  style={space.filled ? { backgroundColor: getTileColor(space.color) } : {}}
                >
                  {isHighlighted && <div className="bonus-sparkle">✨</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const currentPlayer = playersWithBonuses[currentPlayerIndex];
  const currentBonus = currentPlayer?.bonuses[currentBonusIndex];

  return (
    <div className="final-scoring-overlay">
      <div className="final-scoring-modal">
        <div className="final-scoring-header">
          <h2>🏆 Décompte Final des Points</h2>
          <div className="scoring-progress">
            {playersWithBonuses.map((_, index) => (
              <div 
                key={index} 
                className={`progress-dot ${index < currentPlayerIndex ? 'completed' : index === currentPlayerIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="final-scoring-content">
          {/* Section gauche: Plateau du joueur courant */}
          {currentPlayer && (
            <div className="current-player-section">
              <div className="current-player-header">
                <h3>{currentPlayer.player.name}</h3>
                <div className="current-score">{currentPlayer.player.board.score} pts</div>
              </div>
              
              {renderPlayerWall(currentPlayer.player, true)}
              
              {currentBonus && (
                <div className="bonus-display">
                  <div className="bonus-icon">{currentBonus.icon}</div>
                  <div className="bonus-info">
                    <div className="bonus-label">{currentBonus.label}</div>
                    <div className="bonus-value">+{currentBonus.value} points</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section droite: Liste des bonus */}
          {currentPlayer && (
            <div className="bonuses-section">
              <h4>Détail des points bonus :</h4>
              <div className="bonuses-list">
                {currentPlayer.bonuses.map((bonus, index) => (
                  <div 
                    key={index} 
                    className={`bonus-item ${index < currentBonusIndex ? 'revealed' : index === currentBonusIndex ? 'revealing' : 'hidden'}`}
                  >
                    <span className="bonus-icon-small">{bonus.icon}</span>
                    <span className="bonus-text">{bonus.label}</span>
                    <span className="bonus-points">+{bonus.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showFinalButton && (
          <div className="final-standings">
            <h3>Classement Final</h3>
            <div className="standings-list">
              {finalStandings.map((player, index) => (
                <div key={player.id} className={`standing-item ${player.isWinner ? 'winner' : ''}`}>
                  <div className="standing-position">
                    {player.position === 1 ? '🥇' : player.position === 2 ? '🥈' : player.position === 3 ? '🥉' : `${player.position}.`}
                  </div>
                  <div className="standing-name">{player.name}</div>
                  <div className="standing-score">{player.board.score} points</div>
                </div>
              ))}
            </div>
            
            <button 
              className="continue-button"
              onClick={() => { setIsPaused(false); onComplete(); }}
            >
              Continuer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalScoringAnimation;