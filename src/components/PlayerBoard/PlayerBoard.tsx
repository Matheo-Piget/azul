import React from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import './Playerboard.css';

interface PlayerBoardProps {
  playerId: string;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ playerId }) => {
  const { gameState, placeTiles, selectedTiles } = useGame();
  
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!player) {
    return <div>Joueur non trouvé</div>;
  }
  
  const isCurrentPlayer = gameState.currentPlayer === playerId;
  const canPlace = isCurrentPlayer && selectedTiles.length > 0 && gameState.gamePhase === 'drafting';
  
  const handlePatternLineClick = (lineIndex: number) => {
    if (canPlace) {
      placeTiles(lineIndex);
    }
  };
  
  return (
    <div className={`player-board ${isCurrentPlayer ? 'current-player' : ''}`}>
      <h3 className="player-name">{player.name} ({player.board.score} pts)</h3>
      
      <div className="board-content">
        <div className="pattern-lines">
          {player.board.patternLines.map((line, index) => (
            <div 
              key={`line-${index}`} 
              className="pattern-line"
              onClick={() => handlePatternLineClick(index)}
            >
              {/* Espaces vides */}
              {Array(line.spaces - line.tiles.length).fill(0).map((_, i) => (
                <div 
                  key={`empty-${i}`} 
                  className={`tile-space ${canPlace && line.color === null ? 'available' : ''}`}
                />
              ))}
              
              {/* Tuiles placées */}
              {line.tiles.map((tile, i) => (
                <Tile 
                  key={`tile-${i}`}
                  color={tile.color}
                  size="small"
                />
              ))}
            </div>
          ))}
        </div>
        
        <div className="wall">
          {player.board.wall.map((row, rowIndex) => (
            <div key={`wall-row-${rowIndex}`} className="wall-row">
              {row.map((space, colIndex) => (
                <div 
                  key={`wall-${rowIndex}-${colIndex}`} 
                  className={`wall-space ${space.filled ? 'filled' : ''}`}
                  style={space.filled ? { backgroundColor: space.color } : {}}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="floor-line">
        {player.board.floorLine.map((tile, index) => (
          <Tile 
            key={`floor-${index}`}
            color={tile.color}
            size="small"
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerBoard;