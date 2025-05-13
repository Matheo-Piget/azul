import React, { useEffect, useState } from "react";
import Tile from "../../Tile/Tile";
import { useGame } from "../../../state/GameContext";
import { audioService } from "../../../utils/SoundService";
import "./Playerboard.css";
import { TileColor } from "../../../models/types";
import { useNotification } from "../../../components/UI/NotificationSystem";
import ScoringAnimation from "../../../components/Utils/ScoringAnimation";

interface PlayerBoardProps {
  playerId: string;
  patternLineRef?: (index: number, element: HTMLDivElement | null) => void;
  floorLineRef?: (element: HTMLDivElement | null) => void;
}

const PlayerBoardClassic: React.FC<PlayerBoardProps> = ({
  playerId,
  patternLineRef,
  floorLineRef,
}) => {
  const { gameState, selectedTiles, placeTiles, aiPlayers, scoringAnimations, clearScoringAnimations, addScoringAnimation, mustPlaceInFloorLine } = useGame();
  const [mustUseFloorLine, setMustUseFloorLine] = useState(false);
  const { showNotification } = useNotification();

  const player = gameState.players.find((p) => p.id === playerId);
  const isCurrentPlayer = player ? gameState.currentPlayer === playerId : false;
  const canPlace =
    isCurrentPlayer &&
    selectedTiles.length > 0 &&
    gameState.gamePhase === "drafting";

  const playerAnimations = scoringAnimations.filter(a => a.playerId === playerId);

  useEffect(() => {
    if (player && canPlace && selectedTiles.length > 0) {
      setMustUseFloorLine(mustPlaceInFloorLine(selectedTiles));
    } else {
      setMustUseFloorLine(false);
    }
  }, [gameState, selectedTiles, canPlace, player]);

  if (!player) {
    return <div data-testid="player-not-found">Player not found</div>;
  }

  const handlePatternLineClick = (lineIndex: number) => {
    if (!canPlace) return;
    if (mustUseFloorLine && lineIndex !== -1) {
      showNotification(
        'error',
        'Ces tuiles doivent être placées dans la ligne de pénalité car aucune ligne de motif ne peut les accueillir.',
        5000
      );
      return;
    }
    if (lineIndex !== -1) {
      const patternLine = player.board.patternLines[lineIndex];
      const tileColor = selectedTiles[0]?.color;
      if (patternLine.tiles.length >= patternLine.spaces) {
        showNotification('error', `Cette ligne est déjà complète (${patternLine.spaces}/${patternLine.spaces} tuiles).`);
        return;
      }
      if (patternLine.color && patternLine.color !== tileColor) {
        showNotification(
          'error',
          `Cette ligne contient déjà des tuiles de couleur ${translateColor(patternLine.color)}. Vous ne pouvez y placer que des tuiles de cette couleur.`
        );
        return;
      }
      const wallRowHasColor = player.board.wall[lineIndex].some(
        space => space.color === tileColor && space.filled
      );
      if (wallRowHasColor) {
        showNotification(
          'error',
          `Une tuile ${translateColor(tileColor)} est déjà placée sur cette ligne du mur. Vous ne pouvez pas collecter plus de tuiles de cette couleur pour cette ligne.`
        );
        return;
      }
    }
    placeTiles(lineIndex);
  };

  const translateColor = (color: TileColor): string => {
    const colorTranslations: Record<TileColor, string> = {
      'blue': 'bleue',
      'yellow': 'jaune',
      'red': 'rouge',
      'black': 'noire',
      'teal': 'turquoise',
      'green': 'verte',
      'joker': 'joker',
    };
    return colorTranslations[color] || color;
  };

  return (
    <div
      className={`player-board ${isCurrentPlayer ? "current-player" : ""}`}
      data-testid={`player-board-${playerId}`}
    >
      <h3 className="player-name" data-testid={`player-name-${playerId}`}>
        {player.name} ({player.board.score} pts)
        {aiPlayers[player.id] && (
          <span
            className="ai-badge"
            title={`AI - Level ${aiPlayers[player.id]}`}
            data-testid={`ai-badge-${playerId}`}
          >
            🤖{" "}
            {aiPlayers[player.id] === "easy"
              ? "I"
              : aiPlayers[player.id] === "medium"
              ? "II"
              : "III"}
          </span>
        )}
      </h3>
      <div className="board-content">
        <div className="pattern-lines">
          {player.board.patternLines.map((line, index) => {
            const lineAvailable =
              canPlace &&
              line.tiles.length < line.spaces &&
              (line.color === null || line.color === selectedTiles[0]?.color) &&
              !player.board.wall[index].some(
                (space) =>
                  space.color === selectedTiles[0]?.color && space.filled
              );
            return (
              <div
                  key={`line-${index}`}
                  className="pattern-line"
                  onClick={() => handlePatternLineClick(index)}
                  data-testid={`pattern-line-${index}-${playerId}`}
                  ref={(el) => patternLineRef && patternLineRef(index, el)}
                  aria-label={`Pattern line ${index + 1} with ${line.tiles.length} of ${line.spaces} spaces filled`}
                  role="button"
                  tabIndex={canPlace && lineAvailable ? 0 : -1}
                >
                {Array(line.spaces - line.tiles.length)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className={`tile-space ${
                        lineAvailable && !mustUseFloorLine ? "available" : ""
                      }`}
                      data-testid={`empty-space-${index}-${i}-${playerId}`}
                    />
                  ))}
                {line.tiles.map((tile, i) => (
                  <Tile
                    key={`tile-${i}`}
                    color={tile.color}
                    size="small"
                    data-testid={`placed-tile-${index}-${i}-${playerId}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div className="wall" data-testid={`wall-${playerId}`}> 
          {player.board.wall.map((row, rowIndex) => (
            <div
              key={`wall-row-${rowIndex}`}
              className="wall-row"
              data-testid={`wall-row-${rowIndex}-${playerId}`}
            >
              {row.map((space, colIndex) => {
                const colorMap = {
                  blue: "#1e88e5",
                  yellow: "#fdd835",
                  red: "#e53935",
                  black: "#424242",
                  teal: "#00897b",
                  green: "#43a047",
                  joker: "#b388ff",
                };
                const isAvailablePlacement =
                  isCurrentPlayer &&
                  selectedTiles.length > 0 &&
                  gameState.gamePhase === "drafting" &&
                  space.color === selectedTiles[0].color &&
                  !space.filled &&
                  player.board.patternLines[rowIndex].tiles.length ===
                    player.board.patternLines[rowIndex].spaces;
                return (
                  <div
                    key={`wall-${rowIndex}-${colIndex}`}
                    className={`wall-space ${space.filled ? "filled" : ""} ${
                      isAvailablePlacement ? "available-placement" : ""
                    }`}
                    style={
                      space.filled
                        ? { backgroundColor: colorMap[space.color] }
                        : ({
                            "--tile-color": colorMap[space.color],
                            "--highlight-opacity": isAvailablePlacement ? "0.5" : "0.25"
                          } as React.CSSProperties)
                    }
                    data-testid={`wall-space-${rowIndex}-${colIndex}-${playerId}`}
                    aria-label={
                      space.filled
                        ? `Filled ${space.color} tile`
                        : `Empty space for ${space.color} tile`
                    }
                    onClick={() => {
                      if (isAvailablePlacement && gameState.gamePhase === "tiling") {
                        audioService.play("completeLine");
                      }
                    }}
                    role={isAvailablePlacement ? "button" : undefined}
                    tabIndex={isAvailablePlacement ? 0 : -1}
                  >
                    {isAvailablePlacement && (
                      <div className="placement-indicator" aria-hidden="true">
                        <span className="placement-icon">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div
        className={`floor-line ${mustUseFloorLine && canPlace ? "must-use-floor" : ""}`}
        onClick={() => canPlace && handlePatternLineClick(-1)}
        data-testid={`floor-line-${playerId}`}
        ref={(el) => floorLineRef && floorLineRef(el)}
        role="button"
        tabIndex={canPlace ? 0 : -1}
        aria-label={`Floor line with ${player.board.floorLine.length} penalty tiles`}
            >
        {player.board.floorLine.map((tile, index) => (
          <Tile
            key={`floor-${index}`}
            color={tile.color}
            size="small"
            data-testid={`floor-tile-${index}-${playerId}`}
          />
        ))}
        {mustUseFloorLine && canPlace && (
          <div className="floor-line-hint" data-testid="floor-line-hint">
            You must place here!
          </div>
        )}
      </div>
      {playerAnimations.map((animation, index) => (
      <ScoringAnimation
        key={`${animation.playerId}-${index}`}
        points={animation.points}
        x={animation.position.x}
        y={animation.position.y}
        type={animation.type}
        label={animation.label}
        onComplete={() => {
          const newAnimations = [...scoringAnimations];
          newAnimations.splice(scoringAnimations.indexOf(animation), 1);
          clearScoringAnimations();
          if (newAnimations.length > 0) {
            newAnimations.forEach(a => addScoringAnimation(a));
          }
        }}
      />
    ))}
    </div>
  );
};

export default PlayerBoardClassic; 