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

// Coordonnées pour placer les tuiles en fleur (6 positions sans centre)
const getFlowerPositions = (radius: number, centerX: number, centerY: number) => {
  const positions = [];
  
  // Positions des 6 pétales autour
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    positions.push({
      left: centerX + radius * Math.cos(angle),
      top: centerY + radius * Math.sin(angle),
      rotate: angle * (180 / Math.PI) + 45, // +45° pour orienter le losange
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

  // Dans un vrai jeu, on récupérerait les tuiles placées du state
  // Pour cette démo, on génère un plateau partiellement rempli
  const placedTiles = useMemo(() => {
    return FLOWER_COLORS.map((color, idx) => {
      // Simuler des tuiles placées au hasard
      return Array(TILES_PER_FLOWER).fill(null).map((_, i) => {
        // 40% de chance d'avoir une tuile placée
        return Math.random() < 0.4 ? color : "empty";
      });
    });
  }, []);

  // Vérifier si une fleur est complète
  const isFlowerComplete = (flowerIdx: number) => {
    if (!placedTiles[flowerIdx]) return false;
    return placedTiles[flowerIdx].every(tile => tile !== "empty");
  };

  // Dimensions et positionnement
  const boardSize = 380;
  const centerPoint = boardSize / 2;
  const flowerRadius = 75; // Rayon pour les fleurs satellites
  const petalRadius = 40; // Distance entre le centre d'une fleur et ses pétales
  
  return (
    <div className="player-board summer-pavilion-board">
      <div className="player-board-header">
        Azul Summer Pavilion - <b>{player?.name || 'Joueur'}</b>
        {jokerColor && (
          <span className="joker-badge" style={{ background: '#b388ff', color: '#fff', marginLeft: 12, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>
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
            left: centerPoint - 50,
            top: centerPoint - 50,
            width: 100,
            height: 100,
            zIndex: 10
          }}
        >
          {getFlowerPositions(petalRadius, 50, 50).map((pos, i) => (
            <div
              key={`center-${i}`}
              className="star-tile-pos"
              style={{
                position: 'absolute',
                left: pos.left - 16,
                top: pos.top - 16,
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
          const positions = getFlowerPositions(petalRadius, 50, 50);
          
          return (
            <div
              key={`flower-${color}`}
              className={`summer-star star-${color} ${jokerColor === color ? 'joker-glow' : ''} ${isFlowerComplete(flowerIdx) ? 'rosette-glow' : ''}`}
              style={{
                position: 'absolute',
                left: flowerCenterX - 50,
                top: flowerCenterY - 50,
                width: 100,
                height: 100,
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
                      left: pos.left - 16,
                      top: pos.top - 16,
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