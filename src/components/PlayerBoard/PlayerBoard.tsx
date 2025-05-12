import React, { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import { useGame } from "../../state/GameContext";
import { mustPlaceInFloorLine } from "../../game-logic/moves";
import { audioService } from "../../utils/SoundService";
import "./Playerboard.css";

/**
 * Props for the PlayerBoard component
 * @interface PlayerBoardProps
 * @property {string} playerId - Unique identifier for the player whose board is being displayed
 */
interface PlayerBoardProps {
  playerId: string;
  patternLineRef?: (index: number, element: HTMLDivElement | null) => void;
  floorLineRef?: (element: HTMLDivElement | null) => void;
}

/**
 * PlayerBoard component that displays a player's game board in Azul
 *
 * This component represents a player's board including pattern lines, wall, and floor line.
 * It handles tile placement during the drafting phase and enforces game rules
 * for valid placements. The component also shows player information and score.
 *
 * @component
 * @param {PlayerBoardProps} props - The component props
 * @returns {React.ReactElement} A player's game board with interactive placement areas
 */
const PlayerBoard: React.FC<PlayerBoardProps> = ({
  playerId,
  patternLineRef,
  floorLineRef,
}) => {
  const { gameState, selectedTiles, placeTiles, aiPlayers } = useGame();
  const [mustUseFloorLine, setMustUseFloorLine] = useState(false);

  const player = gameState.players.find((p) => p.id === playerId);
  const isCurrentPlayer = player ? gameState.currentPlayer === playerId : false;
  const canPlace =
    isCurrentPlayer &&
    selectedTiles.length > 0 &&
    gameState.gamePhase === "drafting";

  /**
   * Check if the selected tiles must be placed in the floor line
   * This effect runs whenever relevant game state changes
   */
  useEffect(() => {
    if (player && canPlace && selectedTiles.length > 0) {
      setMustUseFloorLine(mustPlaceInFloorLine(gameState, selectedTiles));
    } else {
      setMustUseFloorLine(false);
    }
  }, [gameState, selectedTiles, canPlace, player]);

  // Return early if player data isn't available
  if (!player) {
    return <div data-testid="player-not-found">Player not found</div>;
  }

  /**
   * Handles tile placement when a player clicks on a pattern line or floor line
   *
   * @param {number} lineIndex - Index of the pattern line to place tiles (-1 for floor line)
   */
  const handlePatternLineClick = (lineIndex: number) => {
    if (!canPlace) return;

    // If tiles must go to the floor line, prevent placing them elsewhere
    if (mustUseFloorLine && lineIndex !== -1) {
      alert(
        "These tiles must be placed in the floor line because no pattern line can accommodate them."
      );
      return;
    }

    audioService.play("tilePlacement");
    placeTiles(lineIndex);
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
            // Determine if this line is available for the selected tile color
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
                {/* Empty spaces */}
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

                {/* Placed tiles */}
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
                // Définir les couleurs pour chaque tuile
                const colorMap = {
                  blue: "#1e88e5",
                  yellow: "#fdd835",
                  red: "#e53935",
                  black: "#424242",
                  teal: "#00897b",
                };

                // Déterminer si cet emplacement est disponible pour un placement
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
    </div>
  );
};

export default PlayerBoard;
