import React, { useMemo, useState } from "react";
import "./PlayerBoardSummer.css";
import { TileColor, Tile } from "../../../models/types";
import { useGame } from '../../../state/GameContext';

interface PlayerBoardSummerProps {
  playerId: string;
}

// Couleurs des 6 fleurs extérieures du Azul Summer Pavilion (+ la centrale)
const FLOWER_COLORS: TileColor[] = [
  "blue",
  "yellow",
  "red",
  "black",
  "teal",
  "purple"
];

// Nombre de tuiles par fleur (6 positions par fleur)
const TILES_PER_FLOWER = 6;

// Coordonnées pour placer les tuiles en fleur hexagonale
const getFlowerPositions = (centerX: number, centerY: number, tileSize: number) => {
  const positions = [];
  // Ajuster hexRadius en fonction de la nouvelle taille des tuiles tout en gardant les tuiles collées
  const hexRadius = tileSize * 0.82; // Légèrement ajusté pour maintenir le même effet de tuiles collées
  
  // Positions des 6 tuiles formant une fleur hexagonale
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    
    // Ajuster pour que les losanges se touchent complètement
    positions.push({
      left: centerX + hexRadius * Math.cos(angle),
      top: centerY + hexRadius * Math.sin(angle),
      rotate: angle * (180 / Math.PI) + 90, // Orientation pour que les côtés se touchent
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

// Composant pour afficher le sac du joueur (bag personnel)
const BagSummer: React.FC<{ tiles: { color: TileColor }[] }> = ({ tiles }) => {
  return (
    <div className="bag-summer">
      <span className="bag-label">Sac :</span>
      <div className="bag-tiles">
        {tiles.length === 0 ? (
          <span className="bag-empty">(vide)</span>
        ) : (
          tiles.map((tile, i) => (
            <div key={i} className={`diamond-tile tile-${tile.color} bag-tile`} />
          ))
        )}
      </div>
    </div>
  );
};

const PlayerBoardSummer: React.FC<PlayerBoardSummerProps> = ({ playerId }) => {
  const { gameState, placeTiles } = useGame();
  const player = gameState.players.find(p => p.id === playerId);
  const jokerColor = gameState.jokerColor;
  const isCurrentPlayer = gameState.currentPlayer === playerId;

  // État local : tuile sélectionnée dans le bag
  const [selectedBagIdx, setSelectedBagIdx] = useState<number | null>(null);
  // État local : passer son tour et conserver des tuiles
  const [passing, setPassing] = useState<boolean>(false);
  const [tilesToKeep, setTilesToKeep] = useState<Tile[]>([]);

  // Construction du plateau avec les vraies tuiles placées
  const placedTiles = useMemo(() => {
    // On construit la matrice des fleurs à partir de board.placedTiles
    const placed = player?.board.placedTiles || [];
    
    // Pour chaque fleur (6 extérieures + 1 centrale), pour chaque position (6 par fleur)
    // Les 6 premières sont les fleurs extérieures, la 7ème (indice 6) est la centrale
    const flowerColors = [...FLOWER_COLORS, "white"]; // On ajoute la centrale (blanche/neutre)
    
    return flowerColors.map((color, flowerIdx) => {
      return Array(TILES_PER_FLOWER).fill(null).map((_, posIdx) => {
        const found = placed.find(pt => pt.flower === flowerIdx && pt.pos === posIdx);
        return found ? found.color : "empty";
      });
    });
  }, [player]);

  // Vérifier si une fleur est complète
  const isFlowerComplete = (flowerIdx: number) => {
    if (!placedTiles[flowerIdx]) return false;
    return placedTiles[flowerIdx].every(tile => tile !== "empty");
  };

  // Dimensions et positionnement amélioré
  const boardSize = 600; // Augmenté pour correspondre à la nouvelle taille du plateau
  const centerPoint = boardSize / 2;
  // Réduire le rayon pour rapprocher les fleurs
  const flowerRadius = 111; // Augmenté proportionnellement
  const tileSize = 37; // Augmenté pour correspondre à la nouvelle taille des tuiles
  
  // Handler : sélection d'une tuile du sac
  const handleSelectBagTile = (idx: number) => {
    // Ne peut pas sélectionner si on est en mode "passer"
    if (passing) return;
    setSelectedBagIdx(idx);
  };

  // Handler : placement sur une case de fleur
  const handlePlaceTile = (flowerIdx: number, posIdx: number) => {
    if (selectedBagIdx === null || !player?.board.collectedTiles || !isCurrentPlayer) return;
    const tile = player.board.collectedTiles[selectedBagIdx];
    if (!tile) return;
    
    // Déterminer le coût de l'espace (1-6)
    // Pour la démo, on simplifie en utilisant la position comme coût
    const cost = Math.min(6, Math.max(1, posIdx + 1));
    
    // Appel à la logique de placement (move Summer Pavilion)
    placeTiles({ 
      color: tile.color, 
      targetFlower: flowerIdx, 
      targetPos: posIdx,
      cost: cost
    });
    setSelectedBagIdx(null);
  };

  // Handler : passer son tour
  const handlePass = () => {
    if (!isCurrentPlayer) return;
    setPassing(true);
    setSelectedBagIdx(null);
  };

  // Handler : sélectionner/désélectionner une tuile à conserver
  const handleKeepTile = (tile: Tile) => {
    if (!passing) return;
    
    if (tilesToKeep.some(t => t.id === tile.id)) {
      // Désélectionner une tuile
      setTilesToKeep(tilesToKeep.filter(t => t.id !== tile.id));
    } else if (tilesToKeep.length < 4) {
      // Sélectionner une tuile (max 4)
      setTilesToKeep([...tilesToKeep, tile]);
    }
  };

  // Handler : confirmer la sélection et passer
  const handleConfirmPass = () => {
    if (!isCurrentPlayer) return;
    placeTiles({ pass: true, keepTiles: tilesToKeep });
    setPassing(false);
    setTilesToKeep([]);
  };

  // Afficher les tuiles sauvegardées de la manche précédente
  const savedTiles = player?.board.savedTiles || [];

  return (
    <div className="player-board summer-pavilion-board">
      <div className="player-board-header">
        <h3>{player?.name || 'Joueur'} {player?.board.score || 0} pts 
          {isCurrentPlayer && <span className="current-turn-indicator">À votre tour</span>}
        </h3>
        {isCurrentPlayer && gameState.gamePhase === 'tiling' && (
          <button 
            className="pass-button" 
            onClick={handlePass}
            disabled={passing || (player?.board.collectedTiles?.length || 0) === 0}
          >
            Passer
          </button>
        )}
      </div>

      {/* Mode passer - Sélection des tuiles à conserver */}
      {passing && (
        <div className="keep-tiles-dialog">
          <h4>Conserver jusqu'à 4 tuiles pour la prochaine manche:</h4>
          <div className="keep-tiles-options">
            {player?.board.collectedTiles?.map((tile, idx) => (
              <div 
                key={tile.id}
                className={`diamond-tile tile-${tile.color} keep-option${tilesToKeep.some(t => t.id === tile.id) ? ' selected' : ''}`}
                onClick={() => handleKeepTile(tile)}
              />
            ))}
          </div>
          <div className="keep-tiles-actions">
            <span>Sélectionnées: {tilesToKeep.length}/4</span>
            <button 
              className="confirm-pass-button"
              onClick={handleConfirmPass}
            >
              Confirmer
            </button>
          </div>
        </div>
      )}

      <div className="summer-stars-container">
        {/* Fleur centrale (neutre) */}
        <div
          className="summer-star center-star"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-33%, 94%)',
            rotate: '90deg',
            zIndex: 5
          }}
        >
          {getFlowerPositions(0, 0, tileSize).map((pos, i) => {
            const tileColor = placedTiles[6] ? placedTiles[6][i] : "empty";
            
            // Highlight si une tuile du bag est sélectionnée et la case est vide
            const isPlaceable = selectedBagIdx !== null && tileColor === "empty" && isCurrentPlayer;
            
            // Pour la transparence avant placement
            const selectedTileColor = selectedBagIdx !== null && player?.board.collectedTiles ?
              player.board.collectedTiles[selectedBagIdx]?.color : null;
            
            // On peut placer sur la centrale avec n'importe quelle couleur (règle du jeu)
            const canPlaceSelectedTile = isPlaceable;
            
            return (
              <div
                key={`center-${i}`}
                className={`star-tile-pos${isPlaceable ? ' placeable' : ''}${canPlaceSelectedTile ? ' can-place-selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: pos.left - tileSize/2,
                  top: pos.top - tileSize/2,
                  cursor: isPlaceable ? 'pointer' : 'default'
                }}
                onClick={() => isPlaceable && handlePlaceTile(6, i)}
                title={tileColor === "empty" ? `Position centrale ${i+1}` : `Tuile ${tileColor} déjà placée`}
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
        
        {/* 6 fleurs colorées autour */}
        {FLOWER_COLORS.map((color, flowerIdx) => {
          // Calculer la position de cette fleur autour du centre (répartition hexagonale)
          const angle = (2 * Math.PI / FLOWER_COLORS.length) * flowerIdx;
          const flowerCenterX = centerPoint + flowerRadius * Math.cos(angle);
          const flowerCenterY = centerPoint + flowerRadius * Math.sin(angle);
          
          // Obtenir les positions des tuiles pour cette fleur
          const positions = getFlowerPositions(0, 0, tileSize);
          
          return (
            <div
              key={`flower-${color}`}
              className={`summer-star star-${color}`}
              style={{
                position: 'absolute',
                left: `${flowerCenterX}px`,
                top: `${flowerCenterY}px`,
                transform: 'translate(-100%, 125%)',
                rotate: '90deg'
              }}
            >
              {positions.map((pos, posIdx) => {
                const tileColor = placedTiles[flowerIdx][posIdx];
                
                // Highlight si une tuile du bag est sélectionnée et la case est vide
                const isPlaceable = selectedBagIdx !== null && tileColor === "empty" && isCurrentPlayer;
                
                // Pour la transparence avant placement, on vérifie si la tuile sélectionnée est utilisable sur cette fleur
                const selectedTileColor = selectedBagIdx !== null && player?.board.collectedTiles ?
                  player.board.collectedTiles[selectedBagIdx]?.color : null;
                
                // Règle du jeu: on peut placer une tuile si elle est de la même couleur que la fleur
                // OU si c'est un joker (tuile de la couleur du joker du tour)
                const canPlaceSelectedTile = isPlaceable && 
                  (selectedTileColor === color || selectedTileColor === jokerColor);
                
                return (
                  <div
                    key={`${color}-pos-${posIdx}`}
                    className={`star-tile-pos${isPlaceable ? ' placeable' : ''}${canPlaceSelectedTile ? ' can-place-selected' : ''}`}
                    style={{
                      position: 'absolute',
                      left: pos.left - tileSize/2,
                      top: pos.top - tileSize/2,
                      cursor: isPlaceable && canPlaceSelectedTile ? 'pointer' : 'default',
                      zIndex: isPlaceable ? 5 : undefined,
                    }}
                    onClick={() => isPlaceable && canPlaceSelectedTile && handlePlaceTile(flowerIdx, posIdx)}
                    title={tileColor === "empty" ? `Position ${posIdx+1} - ${color}` : `Tuile ${tileColor} déjà placée`}
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

      {/* Bag personnel avec sélection */}
      <div className="player-status">
        {savedTiles.length > 0 && (
          <div className="saved-tiles">
            <span className="saved-label">Conservées :</span>
            <div className="saved-tiles-container">
              {savedTiles.map((tile, i) => (
                <div
                  key={i}
                  className={`diamond-tile tile-${tile.color} saved-tile`}
                  title={`Tuile ${tile.color} conservée de la manche précédente`}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="bag-summer">
          <span className="bag-label">Sac :</span>
          <div className="bag-tiles">
            {player?.board.collectedTiles && player.board.collectedTiles.length === 0 ? (
              <span className="bag-empty">(vide)</span>
            ) : (
              player?.board.collectedTiles?.map((tile, i) => (
                <div
                  key={i}
                  className={`diamond-tile tile-${tile.color} bag-tile${selectedBagIdx === i ? ' selected' : ''}${passing ? ' disabled' : ''}`}
                  style={{ cursor: passing ? 'default' : 'pointer' }}
                  onClick={() => !passing && handleSelectBagTile(i)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBoardSummer;