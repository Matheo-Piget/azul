import React, { useMemo } from "react";
import "./PlayerBoardSummer.css";
import { TileColor } from "../../../models/types";
import { useGame } from '../../../state/GameContext';

interface PlayerBoardSummerProps {
  playerId: string;
}

// Couleurs des 6 fleurs du Azul Summer Pavilion
const FLOWER_COLORS: TileColor[] = [
  "blue",
  "yellow",
  "red",
  "black",
  "teal",
  "green"
];

// Nombre de tuiles par fleur (6 positions, pas de centre)
const TILES_PER_FLOWER = 6;

// Coordonnées pour placer les tuiles en fleur avec les tuiles collées côte à côte
const getFlowerPositions = (centerX: number, centerY: number, tileSize: number) => {
  const positions = [];
  const hexRadius = tileSize * 0.866; // Distance du centre aux sommets pour un hexagone régulier
  
  // Positions des 6 tuiles formant une fleur collée par un côté
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    
    // Ajuster pour que les losanges se touchent par un côté
    positions.push({
      left: centerX + hexRadius * Math.cos(angle),
      top: centerY + hexRadius * Math.sin(angle),
      rotate: angle * (180 / Math.PI), // Orientation pour que les côtés se touchent
    });
  }
  
  return positions;
};

// Composant pour une tuile en losange
const DiamondTile: React.FC<{
  color: TileColor | "empty";
  size: "small" | "medium";
  rotate?: number;
}> = ({ color, size, rotate = 0 }) => {
  return (
    <div 
      className={`diamond-tile tile-${color} tile-${size}`}
      style={{ 
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
};

const PlayerBoardSummer: React.FC<PlayerBoardSummerProps> = ({ playerId }) => {
  const { gameState } = useGame();
  const player = gameState.players.find(p => p.id === playerId);
  const jokerColor = gameState.jokerColor;

  // Construction du plateau avec les vraies tuiles placées (si disponibles)
  // Pour la démo, si le plateau est vide, on place quelques tuiles factices
  const placedTiles = useMemo(() => {
    const collected = player?.board.collectedTiles || [];
    let hasRealTiles = collected.length > 0;
    if (hasRealTiles) {
      return FLOWER_COLORS.map((color) => {
        const tilesOfColor = collected.filter(t => t.color === color);
        return Array(TILES_PER_FLOWER).fill(null).map((_, i) =>
          tilesOfColor[i] ? color : "empty"
        );
      });
    } else {
      // Démo : placer quelques tuiles sur différentes fleurs
      return [
        ["blue", "blue", "empty", "empty", "empty", "empty"], // 2 bleues
        ["yellow", "empty", "empty", "empty", "empty", "empty"], // 1 jaune
        ["red", "empty", "empty", "empty", "empty", "empty"], // 1 rouge
        ["black", "empty", "empty", "empty", "empty", "empty"], // 1 noire
        ["teal", "empty", "empty", "empty", "empty", "empty"], // 1 turquoise
        ["green", "empty", "empty", "empty", "empty", "empty"], // 1 verte
      ] as (TileColor | 'empty')[][];
    }
  }, [player]);

  // Vérifier si une fleur est complète
  const isFlowerComplete = (flowerIdx: number) => {
    if (!placedTiles[flowerIdx]) return false;
    return placedTiles[flowerIdx].every(tile => tile !== "empty");
  };

  // Dimensions et positionnement
  const boardSize = 480; // Augmenté pour plus d'espace
  const centerPoint = boardSize / 2;
  const flowerRadius = 110; // Rayon augmenté pour espacer davantage les fleurs
  const tileSize = 32; // Taille d'une tuile losange
  
  return (
    <div className="player-board summer-pavilion-board">
      <div className="player-board-header">
        Azul Summer Pavilion - <b>{player?.name || 'Joueur'}</b>
        {jokerColor && (
          <span className="joker-badge">
            Joker : {jokerColor}
          </span>
        )}
      </div>
      
      <div className="summer-stars-container">
        {/* Fleur centrale (sans coloris spécifique) */}
        <div
          className="summer-star center-star"
          style={{
            position: 'absolute',
            left: centerPoint,
            top: centerPoint,
            width: 0,
            height: 0,
            zIndex: 10
          }}
        >
          {getFlowerPositions(0, 0, tileSize).map((pos, i) => (
            <div
              key={`center-${i}`}
              className="star-tile-pos"
              style={{
                position: 'absolute',
                left: pos.left - tileSize/2,
                top: pos.top - tileSize/2,
              }}
            >
              <DiamondTile 
                color="empty" 
                size="medium" 
                rotate={pos.rotate}
              />
            </div>
          ))}
        </div>
        
        {/* 6 fleurs colorées autour */}
        {FLOWER_COLORS.map((color, flowerIdx) => {
          // Calculer la position de cette fleur autour du centre
          const angle = (Math.PI / 3) * flowerIdx;
          const flowerCenterX = centerPoint + flowerRadius * Math.cos(angle);
          const flowerCenterY = centerPoint + flowerRadius * Math.sin(angle);
          
          // Obtenir les positions des tuiles pour cette fleur
          const positions = getFlowerPositions(0, 0, tileSize);
          
          return (
            <div
              key={`flower-${color}`}
              className={`summer-star star-${color} ${jokerColor === color ? 'joker-glow' : ''} ${isFlowerComplete(flowerIdx) ? 'rosette-glow' : ''}`}
              style={{
                position: 'absolute',
                left: flowerCenterX,
                top: flowerCenterY,
                width: 0,
                height: 0,
              }}
            >
              {positions.map((pos, posIdx) => {
                // Déterminer si une tuile est placée à cette position
                const tileColor = placedTiles[flowerIdx][posIdx];
                
                return (
                  <div
                    key={`${color}-pos-${posIdx}`}
                    className="star-tile-pos"
                    style={{
                      position: 'absolute',
                      left: pos.left - tileSize/2,
                      top: pos.top - tileSize/2,
                    }}
                  >
                    <DiamondTile 
                      color={tileColor} 
                      size="medium" 
                      rotate={pos.rotate}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerBoardSummer;