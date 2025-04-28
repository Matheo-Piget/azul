import React, { useEffect, useState } from 'react';
import Tile from '../Tile/Tile';
import { useGame } from '../../state/GameContext';
import { mustPlaceInFloorLine } from '../../game-logic/moves';
import { audioService } from '../../utils/SoundService';
import './Playerboard.css';

interface PlayerBoardProps {
  playerId: string;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ playerId }) => {
  const { gameState, selectedTiles, placeTiles, aiPlayers } = useGame();
  const [mustUseFloorLine, setMustUseFloorLine] = useState(false);
  
  const player = gameState.players.find(p => p.id === playerId);
  const isCurrentPlayer = player ? gameState.currentPlayer === playerId : false;
  const canPlace = isCurrentPlayer && selectedTiles.length > 0 && gameState.gamePhase === 'drafting';
  
  // Vérifier si les tuiles doivent obligatoirement aller dans la ligne de plancher
  // Hook placé avant tout return pour éviter l'erreur
  useEffect(() => {
    if (player && canPlace && selectedTiles.length > 0) {
      setMustUseFloorLine(mustPlaceInFloorLine(gameState, selectedTiles));
    } else {
      setMustUseFloorLine(false);
    }
  }, [gameState, selectedTiles, canPlace, player]);
  
  if (!player) {
    return <div>Joueur non trouvé</div>;
  }
  
  const handlePatternLineClick = (lineIndex: number) => {
    if (!canPlace) return;
    
    // Si les tuiles doivent aller dans la ligne de plancher, empêcher de les placer ailleurs
    if (mustUseFloorLine && lineIndex !== -1) {
      alert("Ces tuiles doivent être placées dans la ligne de plancher car aucune ligne de motif ne peut les accueillir.");
      return;
    }
    
    audioService.play('tilePlacement');
    placeTiles(lineIndex);
  };
  
  return (
    <div className={`player-board ${isCurrentPlayer ? 'current-player' : ''}`}>
      <h3 className="player-name">
        {player.name} ({player.board.score} pts)
        {aiPlayers[player.id] && (
          <span className="ai-badge" title={`IA - Niveau ${aiPlayers[player.id]}`}>
            🤖 {aiPlayers[player.id] === 'easy' ? 'I' : aiPlayers[player.id] === 'medium' ? 'II' : 'III'}
          </span>
        )}
      </h3>
      <div className="board-content">
        <div className="pattern-lines">
          {player.board.patternLines.map((line, index) => {
            // Déterminer si cette ligne est disponible pour la couleur sélectionnée
            const lineAvailable = canPlace && 
              line.tiles.length < line.spaces && 
              (line.color === null || line.color === selectedTiles[0]?.color) &&
              !player.board.wall[index].some(space => 
                space.color === selectedTiles[0]?.color && space.filled
              );
            
            return (
              <div 
                key={`line-${index}`} 
                className="pattern-line"
                onClick={() => handlePatternLineClick(index)}
              >
                {/* Espaces vides */}
                {Array(line.spaces - line.tiles.length).fill(0).map((_, i) => (
                  <div 
                    key={`empty-${i}`} 
                    className={`tile-space ${lineAvailable && !mustUseFloorLine ? 'available' : ''}`}
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
            );
          })}
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
      
      <div 
        className={`floor-line ${mustUseFloorLine && canPlace ? 'must-use-floor' : ''}`}
        onClick={() => canPlace && handlePatternLineClick(-1)}
      >
        {player.board.floorLine.map((tile, index) => (
          <Tile 
            key={`floor-${index}`}
            color={tile.color}
            size="small"
          />
        ))}
        {mustUseFloorLine && canPlace && (
          <div className="floor-line-hint">Vous devez placer ici!</div>
        )}
      </div>
    </div>
  );
};

export default PlayerBoard;