import React, { useState, useEffect, useMemo } from 'react';
import './ScoringAnimation.css';
import { Player, TileColor } from '../../models/types';
import Tile from '../Tile/Tile';

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
  const [currentBonusIndex, setCurrentBonusIndex] = useState(-1);
  const [showFinalButton, setShowFinalButton] = useState(false);
  const [animatingElements, setAnimatingElements] = useState<{
    type: 'row' | 'column' | 'color';
    index?: number;
    color?: TileColor;
  } | null>(null);

  // Calculate winner
  const maxScore = Math.max(...players.map(p => p.board.score));
  const winners = players.filter(p => p.board.score === maxScore);

  // Prepare player data with bonuses and their visual elements
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
        icon: '🧮'
      });
      
      // Row bonuses with elements to highlight
      if (details.rowsCompleted > 0) {
        const rowElements: {row: number}[] = [];
        // Find which rows are complete
        player.board.wall.forEach((row, rowIndex) => {
          if (row.every(space => space.filled)) {
            rowElements.push({ row: rowIndex });
          }
        });
        
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
        // Find which columns are complete
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
      // Start sequence after a short delay
      setTimeout(() => setCurrentStep(0), 1000);
      return;
    }
    
    if (currentStep >= playersWithBonuses.length) {
      // All players' scores shown, show final button
      setShowFinalButton(true);
      return;
    }
    
    // Get current player's bonuses
    const currentPlayer = playersWithBonuses[currentStep];
    if (!currentPlayer) return;
    
    if (currentBonusIndex === -1) {
      // Start with base score
      setTimeout(() => setCurrentBonusIndex(0), 500);
      return;
    }
    
    // Check if we've shown all bonuses for this player
    if (currentBonusIndex >= currentPlayer.bonuses.length) {
      // Move to next player after a delay
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setCurrentBonusIndex(-1);
        setAnimatingElements(null);
      }, 1000);
      return;
    }
    
    // Get current bonus
    const currentBonus = currentPlayer.bonuses[currentBonusIndex];
    
    // Set animation elements based on bonus type
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
    
    // Move to next bonus after a delay
    setTimeout(() => {
      setCurrentBonusIndex(currentBonusIndex + 1);
    }, 2000);
  }, [currentStep, currentBonusIndex, playersWithBonuses]);

  // Create a visual representation of a player's wall
  const renderPlayerWall = (player: Player) => {
    return (
      <div className="final-scoring-wall">
        {player.board.wall.map((row, rowIndex) => 
          row.map((tile, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              className={`final-scoring-tile ${tile.filled ? 'filled' : ''}`}
              style={{ 
                backgroundColor: tile.filled ? 
                  getTileColor(tile.color) : 
                  'rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Show animated highlights based on bonus type */}
              {animatingElements && animatingElements.type === 'row' && 
               animatingElements.index === rowIndex && tile.filled && (
                <div className="row-highlight"></div>
              )}
              
              {animatingElements && animatingElements.type === 'column' && 
               animatingElements.index === colIndex && tile.filled && (
                <div className="column-highlight"></div>
              )}
              
              {animatingElements && animatingElements.type === 'color' && 
               tile.color === animatingElements.color && tile.filled && (
                <div className="color-highlight"></div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  // Helper function to get tile color
  const getTileColor = (color: TileColor): string => {
    const colorMap: Record<TileColor, string> = {
      blue: '#1e88e5',
      yellow: '#fdd835',
      red: '#e53935',
      black: '#424242',
      teal: '#00897b'
    };
    return colorMap[color];
  };

  return (
    <div className="final-scoring-container">
      <h2 className="final-scoring-header">Score Final</h2>
      
      {playersWithBonuses.map(({ player, bonuses }, index) => (
        <div 
          key={player.id}
          className={`final-scoring-player ${
            winners.some(w => w.id === player.id) ? 'final-scoring-winner' : ''
          } ${currentStep >= index ? 'visible' : ''}`}
        >
          <div className="final-scoring-player-header">
            <div className="final-scoring-player-name">{player.name}</div>
            <div className="final-scoring-total">{player.board.score} points</div>
          </div>
          
          <div className="final-scoring-board">
            {renderPlayerWall(player)}
            
            <div className="final-scoring-bonus-list">
              {bonuses.map((bonus, bonusIndex) => (
                <div 
                  key={bonus.type}
                  className={`final-scoring-bonus-item ${
                    currentStep === index && currentBonusIndex === bonusIndex ? 'highlight' : ''
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