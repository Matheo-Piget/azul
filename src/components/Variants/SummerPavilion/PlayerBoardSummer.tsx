import React, { useMemo, useState } from "react";
import "./PlayerBoardSummer.css";
import { Tile, TileColor } from "../../../models/types";
import { useGame } from "../../../state/GameContext";

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
  "purple",
];

// Nombre de tuiles par fleur (6 positions par fleur)
const TILES_PER_FLOWER = 6;

// Coordonnées pour placer les tuiles en fleur hexagonale
const getFlowerPositions = (tileSize: number) => {
  const positions = [];
  const hexRadius = tileSize * 0.85; // Ajusté pour que les tuiles se touchent

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    positions.push({
      left: hexRadius * Math.cos(angle),
      top: hexRadius * Math.sin(angle),
      rotate: angle * (180 / Math.PI) + 90,
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

/**
 * Composant de sac personnel pour le plateau Summer Pavilion
 */
const PersonalBag: React.FC<{ playerId: string }> = ({ playerId }) => {
  const { gameState } = useGame();
  const player = gameState?.players.find((p) => p.id === playerId);

  // Group tiles by color for better visual organization
  const tileGroups = useMemo(() => {
    if (!player || !gameState) return {} as Record<TileColor, number>;

    const colors: TileColor[] = [
      "blue",
      "yellow",
      "red",
      "black",
      "teal",
      "green",
      "purple",
      "orange",
    ];
    const groups: Record<TileColor, number> = {} as Record<TileColor, number>;

    // Initialize counters
    colors.forEach((color) => {
      groups[color] = 0;
    });

    const collectedTiles = player.board.collectedTiles || [];
    collectedTiles.forEach((tile) => {
      groups[tile.color] = (groups[tile.color] || 0) + 1;
    });

    return groups;
  }, [player, gameState]);

  if (!player) return null;

  // Calculer le total des tuiles (simulation)
  const totalTiles = Object.values(tileGroups).reduce(
    (sum, count) => sum + count,
    0
  );

  // Render tile groups for personal bag
  const renderTileGroups = () => {
    const colors: TileColor[] = [
      "blue",
      "yellow",
      "red",
      "black",
      "teal",
      "green",
      "purple",
      "orange",
    ];

    return (
      <div className="personal-bag-tiles">
        {colors.map((color) => {
          const count = tileGroups[color] || 0;
          if (count === 0) return null;

          return (
            <div key={color} className="personal-tile-group">
              <div className="personal-tile-sample">
                <DiamondTile color={color} size="small" />
              </div>
              <div className="personal-tile-count">{count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="personal-bag-container">
      <div className="personal-bag-header">
        <div className="personal-bag-icon">🎒</div>
        <div className="personal-bag-info">
          <span className="personal-bag-title">Sac</span>
          <span className="personal-bag-total">{totalTiles}</span>
        </div>
      </div>
      <div className="personal-bag-content">
        {totalTiles > 0 ? (
          renderTileGroups()
        ) : (
          <div className="personal-bag-empty">Vide</div>
        )}
      </div>
    </div>
  );
};

const PlayerBoardSummer: React.FC<PlayerBoardSummerProps> = ({ playerId }) => {
  const { gameState, placeTiles } = useGame();
  const player = gameState.players.find((p) => p.id === playerId);
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
      return Array(TILES_PER_FLOWER)
        .fill(null)
        .map((_, posIdx) => {
          const found = placed.find(
            (pt) => pt.flower === flowerIdx && pt.pos === posIdx
          );
          return found ? found.color : "empty";
        });
    });
  }, [player]);

  const tileSize = 36; // Augmenté pour correspondre à la nouvelle taille des tuiles

  // Handler : placement sur une case de fleur
  const handlePlaceTile = (flowerIdx: number, posIdx: number) => {
    if (
      selectedBagIdx === null ||
      !player?.board.collectedTiles ||
      !isCurrentPlayer
    )
      return;
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
      cost: cost,
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

    if (tilesToKeep.some((t) => t.id === tile.id)) {
      // Désélectionner une tuile
      setTilesToKeep(tilesToKeep.filter((t) => t.id !== tile.id));
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

  // Pour la transparence avant placement, on vérifie si la tuile sélectionnée est utilisable
  const selectedTileColor =
    selectedBagIdx !== null && player?.board.collectedTiles
      ? player.board.collectedTiles[selectedBagIdx]?.color
      : null;

  // Distribution des tuiles conservées dans les coins
  const cornerTiles: Tile[][] = [[], [], [], []]; // top-left, top-right, bottom-left, bottom-right

  savedTiles.forEach((tile, index) => {
    const cornerIndex = index % 4;
    cornerTiles[cornerIndex].push(tile);
  });

  return (
    <div className="player-board summer-pavilion-board">
      <div className="player-board-header">
        <h3>
          {player?.name || "Joueur"} {player?.board.score || 0} pts
          {isCurrentPlayer && (
            <span className="current-turn-indicator">À votre tour</span>
          )}
        </h3>
        {isCurrentPlayer && gameState.gamePhase === "tiling" && (
          <button
            className="pass-button"
            onClick={handlePass}
            disabled={
              passing || (player?.board.collectedTiles?.length || 0) === 0
            }
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
                className={`diamond-tile tile-${tile.color} keep-option${
                  tilesToKeep.some((t) => t.id === tile.id) ? " selected" : ""
                }`}
                onClick={() => handleKeepTile(tile)}
              />
            ))}
          </div>
          <div className="keep-tiles-actions">
            <span>Sélectionnées: {tilesToKeep.length}/4</span>
            <button className="confirm-pass-button" onClick={handleConfirmPass}>
              Confirmer
            </button>
          </div>
        </div>
      )}

      <div className="summer-stars-container">
        <div className="square-container">
          <div
            className="corner-tile top-left"
            data-count={cornerTiles[0].length || ""}
          >
            {cornerTiles[0].map((tile, idx) => (
              <div
                key={`tl-${idx}`}
                className={`diamond-tile tile-${tile.color} corner-saved-tile`}
                title={`Tuile ${tile.color} conservée pour la prochaine manche`}
              />
            ))}
          </div>
          <div
            className="corner-tile top-right"
            data-count={cornerTiles[1].length || ""}
          >
            {cornerTiles[1].map((tile, idx) => (
              <div
                key={`tr-${idx}`}
                className={`diamond-tile tile-${tile.color} corner-saved-tile`}
                title={`Tuile ${tile.color} conservée pour la prochaine manche`}
              />
            ))}
          </div>
          <div
            className="corner-tile bottom-left"
            data-count={cornerTiles[2].length || ""}
          >
            {cornerTiles[2].map((tile, idx) => (
              <div
                key={`bl-${idx}`}
                className={`diamond-tile tile-${tile.color} corner-saved-tile`}
                title={`Tuile ${tile.color} conservée pour la prochaine manche`}
              />
            ))}
          </div>
          <div
            className="corner-tile bottom-right"
            data-count={cornerTiles[3].length || ""}
          >
            {cornerTiles[3].map((tile, idx) => (
              <div
                key={`br-${idx}`}
                className={`diamond-tile tile-${tile.color} corner-saved-tile`}
                title={`Tuile ${tile.color} conservée pour la prochaine manche`}
              />
            ))}
          </div>
        </div>
        {/* Fleur centrale (neutre) */}
        <div className="summer-star center-star">
          {getFlowerPositions(tileSize).map((pos, i) => {
            const tileColor = placedTiles[6] ? placedTiles[6][i] : "empty";
            const isPlaceable =
              selectedBagIdx !== null &&
              tileColor === "empty" &&
              isCurrentPlayer;

            // On peut placer sur la centrale avec n'importe quelle couleur (règle du jeu)
            const canPlaceSelectedTile = isPlaceable;

            return (
              <div
                key={`center-${i}`}
                className={`star-tile-pos${isPlaceable ? " placeable" : ""}${
                  canPlaceSelectedTile ? " can-place-selected" : ""
                }`}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${pos.left}px - 30px)`, // 30px = moitié de la largeur de la tuile
                  top: `calc(50% + ${pos.top}px - 30px)`, // 30px = moitié de la hauteur de la tuile
                  transform: `rotate(${pos.rotate}deg)`,
                  cursor: isPlaceable ? "pointer" : "default",
                }}
                onClick={() => isPlaceable && handlePlaceTile(6, i)}
                title={
                  tileColor === "empty"
                    ? `Position centrale ${i + 1}`
                    : `Tuile ${tileColor} déjà placée`
                }
              >
                <DiamondTile color={tileColor} size="medium" />
              </div>
            );
          })}
        </div>

        {/* 6 fleurs colorées autour */}
        {FLOWER_COLORS.map((color, flowerIdx) => (
          <div key={`flower-${color}`} className={`summer-star star-${color}`}>
            {getFlowerPositions(tileSize).map((pos, posIdx) => {
              const tileColor = placedTiles[flowerIdx][posIdx];
              const isPlaceable =
                selectedBagIdx !== null &&
                tileColor === "empty" &&
                isCurrentPlayer;

              // Règle du jeu: on peut placer une tuile si elle est de la même couleur que la fleur
              // OU si c'est un joker (tuile de la couleur du joker du tour)
              const canPlaceSelectedTile =
                isPlaceable &&
                (selectedTileColor === color ||
                  selectedTileColor === jokerColor);

              return (
                <div
                  key={`${color}-pos-${posIdx}`}
                  className={`star-tile-pos${isPlaceable ? " placeable" : ""}${
                    canPlaceSelectedTile ? " can-place-selected" : ""
                  }`}
                  style={{
                    position: "absolute",
                    left: `calc(50% + ${pos.left}px)`,
                    top: `calc(50% + ${pos.top}px)`,
                    transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`,
                    cursor:
                      isPlaceable && canPlaceSelectedTile
                        ? "pointer"
                        : "default",
                    zIndex: isPlaceable ? 5 : undefined,
                  }}
                  onClick={() =>
                    isPlaceable &&
                    canPlaceSelectedTile &&
                    handlePlaceTile(flowerIdx, posIdx)
                  }
                  title={
                    tileColor === "empty"
                      ? `Position ${posIdx + 1} - ${color}`
                      : `Tuile ${tileColor} déjà placée`
                  }
                >
                  <DiamondTile color={tileColor} size="medium" />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Ajouter le sac personnel */}
      <PersonalBag playerId={playerId} />
    </div>
  );
};

export default PlayerBoardSummer;
