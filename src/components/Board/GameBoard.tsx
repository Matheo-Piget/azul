import React, { useEffect, useRef, useState } from "react";
import Factory from "../Variants/Classics/FactoryClassic";
import PlayerBoard from "../Variants/Classics/PlayerBoardClassic";
import Center from "../Variants/Classics/CenterClassic";
import History from "../Utils/GameHistory";
import { useGame } from "../../state/GameContext";
import "./Gameboard.css";
import AIPlayerConfig from "../AI/AIPlayerConfig";
import GameInfo from "../UI/Bag";
import { TileColor } from "../../models/types";
import AIAnimation from "../AI/AIAnimation";
import { useTutorial } from "../Tutorial/TutorialSystem";
import FinalScoringAnimation from "./../Utils/ScoringFinal";
import RoundTransition from "../Utils/RoundTransition";
import RoundScoringAnimation, {
  AnimationStep,
} from "../Utils/RoundScoringAnimation";

/**
 * GameBoard Component
 *
 * @component
 * @description Main game interface that renders the entire Azul game board.
 * This component manages:
 * - Game initialization
 * - Display of factories, center area, and player boards
 * - Game status information
 * - Controls for starting a new game
 *
 * @returns {React.ReactElement} The complete game board UI or a loading screen
 */
const GameBoard: React.FC = (): React.ReactElement => {
  const { gameState, startNewGame } = useGame();
  const [playerCount, setPlayerCount] = useState(2);
  const [aiPlayers, setAiPlayers] = useState<Record<string, boolean>>({});

  const [keepAiSettings, setKeepAiSettings] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const factoryRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const centerRef = useRef<HTMLDivElement | null>(null);
  const patternLineRefs = useRef<
    Record<string, Record<number, HTMLDivElement | null>>
  >({});
  const floorLineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [animationSource, setAnimationSource] = useState<HTMLElement | null>(
    null
  );
  const [animationTarget, setAnimationTarget] = useState<HTMLElement | null>(
    null
  );

  const { isRoundTransition } = useGame();
  const [isRoundTransitioning, setIsRoundTransitioning] = useState(false);

  const { aiAnimation } = useGame();

  const [scoringSteps, setScoringSteps] = useState<AnimationStep[]>([]);
  const [showRoundScoring, setShowRoundScoring] = useState(false);

  const { startTutorial } = useTutorial();

  const { showFinalScoring, setShowFinalScoring } = useGame();

  const [bonusDetails, setBonusDetails] = useState<
    Record<
      string,
      {
        rowsCompleted: number;
        columnsCompleted: number;
        colorsCompleted: number;
        baseScore: number;
      }
    >
  >({});

  /**
   * Effect to handle AI animation
   */
  useEffect(() => {
    if (aiAnimation) {
      // Find source element
      let sourceElement: HTMLElement | null = null;
      if (
        aiAnimation.sourceType === "factory" &&
        aiAnimation.sourceId !== null
      ) {
        sourceElement = factoryRefs.current[aiAnimation.sourceId];
      } else if (aiAnimation.sourceType === "center") {
        sourceElement = centerRef.current;
      }

      // Find target element
      let targetElement: HTMLElement | null = null;
      if (aiAnimation.targetType === "patternLine") {
        targetElement =
          patternLineRefs.current[aiAnimation.playerId]?.[
            aiAnimation.targetIndex
          ] || null;
      } else {
        targetElement = floorLineRefs.current[aiAnimation.playerId] || null;
      }

      setAnimationSource(sourceElement);
      setAnimationTarget(targetElement);
    }
  }, [aiAnimation]);

  /**
   * Effect to initialize a new game if none exists
   */
  useEffect(() => {
    // Start a new game if the board is empty
    if (!gameState || gameState.players.length === 0) {
      startNewGame(2);
    }
  }, [gameState, startNewGame]);

  useEffect(() => {
    if (gameState && gameState.gamePhase === "gameEnd") {
      // Calculate bonus details for all players
      const details: Record<
        string,
        {
          rowsCompleted: number;
          columnsCompleted: number;
          colorsCompleted: number;
          baseScore: number;
        }
      > = {};
      gameState.players.forEach((player) => {
        const wall = player.board.wall;

        // Count completed rows
        const rowsCompleted = wall.filter((row) =>
          row.every((space) => space.filled)
        ).length;

        // Count completed columns
        let columnsCompleted = 0;
        for (let col = 0; col < wall[0].length; col++) {
          if (wall.every((row) => row[col].filled)) {
            columnsCompleted++;
          }
        }
        const colors = ["blue", "yellow", "red", "black", "teal"];
        const colorsCompleted = colors.filter(
          (color) =>
            wall.flat().filter((space) => space.color === color && space.filled)
              .length === 5
        ).length;

        // Estimate base score (total - bonuses)
        const bonusScore =
          rowsCompleted * 2 + columnsCompleted * 7 + colorsCompleted * 10;
        const baseScore = player.board.score - bonusScore;

        details[player.id] = {
          rowsCompleted,
          columnsCompleted,
          colorsCompleted,
          baseScore,
        };
      });

      setBonusDetails(details);

      // Show final scoring with a slight delay
      setTimeout(() => {
        setShowFinalScoring(true);
      }, 500);
    }
  }, [gameState?.gamePhase, gameState?.players, setShowFinalScoring]);

  useEffect(() => {
  if (gameState?.gamePhase === "tiling") {
    // Pour chaque joueur, pour chaque ligne transférée, ajoute un step
    const steps: AnimationStep[] = [];
    gameState.players.forEach(player => {
      player.board.wall.forEach((row, rowIdx) => {
        row.forEach((space, colIdx) => {
          if (space.filled /* && vient d'être rempli ce tour-ci */) {
            // Il faut détecter les tuiles nouvellement placées ce tour-ci
            steps.push({
              row: rowIdx,
              col: colIdx,
              points: 1,
              color: space.color,
            });
          }
        });
      });
    });
    setScoringSteps(steps);
    setShowRoundScoring(true);
  }
}, [gameState?.gamePhase]);

  /**
   * Function to handle new game button click
   * @returns {void}
   */
  const handleNewGame = () => {
    startNewGame(playerCount);
  };

  if (gameState?.gamePhase === "gameEnd") {
    if (isRoundTransition) {
      return (
        <RoundTransition
          roundNumber={gameState.roundNumber}
          onComplete={() => setIsRoundTransitioning(false)}
          autoProgress={true}
        />
      );
    }
    return (
      <div className="game-over-screen">
        {showFinalScoring && gameState?.gamePhase === "gameEnd" && (
          <FinalScoringAnimation
            players={gameState.players}
            bonusDetails={bonusDetails}
            onComplete={() => setShowFinalScoring(false)}
          />
        )}
        <div className="game-over-header">
          <h2>Partie terminée</h2>
          <div className="game-result">
            {(() => {
              // Trouver le gagnant et son score
              const winners = gameState.players.reduce((acc, player) => {
                const highestScore = Math.max(
                  ...gameState.players.map((p) => p.board.score)
                );
                if (player.board.score === highestScore) {
                  acc.push({ name: player.name, score: player.board.score });
                }
                return acc;
              }, [] as { name: string; score: number }[]);

              return (
                <>
                  <div className="winner-trophy">🏆</div>
                  <div className="winner-info">
                    {winners.length === 1 ? (
                      <h3>
                        {winners[0].name} gagne avec {winners[0].score} points !
                      </h3>
                    ) : (
                      <h3>
                        Égalité entre {winners.map((w) => w.name).join(" et ")}{" "}
                        avec {winners[0].score} points !
                      </h3>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="game-summary">
          <h3>Résumé de la partie</h3>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Score</th>
                <th>Lignes complétées</th>
                <th>Colonnes complétées</th>
                <th>Couleurs complétées</th>
              </tr>
            </thead>
            <tbody>
              {gameState.players.map((player) => {
                // Calculer les statistiques
                const completedRows = player.board.wall.filter((row) =>
                  row.every((space) => space.filled)
                ).length;

                const completedColumns = Array(5)
                  .fill(0)
                  .map((_, colIndex) =>
                    player.board.wall.every((row) => row[colIndex].filled)
                  )
                  .filter(Boolean).length;

                const colors: TileColor[] = [
                  "blue",
                  "yellow",
                  "red",
                  "black",
                  "teal",
                ];
                const completedColors = colors.filter(
                  (color) =>
                    player.board.wall
                      .flat()
                      .filter((space) => space.color === color && space.filled)
                      .length === 5
                ).length;

                return (
                  <tr
                    key={player.id}
                    className={
                      player.board.score ===
                      Math.max(...gameState.players.map((p) => p.board.score))
                        ? "winner-row"
                        : ""
                    }
                  >
                    <td>{player.name}</td>
                    <td>{player.board.score}</td>
                    <td>{completedRows}</td>
                    <td>{completedColumns}</td>
                    <td>{completedColors}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="new-game-options">
          <h3>Nouvelle partie</h3>
          <div className="player-options">
            <div className="option-group">
              <label htmlFor="new-player-count">Nombre de joueurs:</label>
              <select
                id="new-player-count"
                value={playerCount}
                onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                className="player-select"
              >
                <option value="2">2 joueurs</option>
                <option value="3">3 joueurs</option>
                <option value="4">4 joueurs</option>
              </select>
            </div>
            <div className="option-group">
              <label>Conserver les IA:</label>
              <input
                type="checkbox"
                checked={keepAiSettings}
                onChange={() => setKeepAiSettings(!keepAiSettings)}
              />
            </div>
          </div>

          <div className="game-buttons">
            <button
              onClick={() => startNewGame(playerCount, keepAiSettings)}
              className="new-game-btn primary"
            >
              Nouvelle partie
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="history-btn"
            >
              {showHistory ? "Masquer l'historique" : "Voir l'historique"}
            </button>
          </div>
        </div>

        {showHistory && <History />}
      </div>
    );
  }

  // Show loading screen while game initializes
  if (!gameState || gameState.players.length === 0) {
    return <div className="loading-screen">Chargement du jeu...</div>;
  }

  // Find the active player
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayer
  );

  {showRoundScoring && (
  <RoundScoringAnimation
    player={gameState.players[0]} // ou la liste, à faire pour chaque joueur
    steps={scoringSteps}
    onComplete={() => {
      setShowRoundScoring(false);
      if (isRoundTransitioning) {
        return (
          <RoundTransition
            roundNumber={gameState.roundNumber}
            onComplete={() => setIsRoundTransitioning(false)}
            autoProgress={true}
          />
        );
      }
      }}
  />
)}

  return (
    <div className="game-board">
      <div className="game-header">
        <div className="logo-container">
          <h1>Azul</h1>
          <div className="azulejo-pattern"></div>
        </div>

        <div className="game-banner">
          <div className="game-status">
            <div className="status-item">
              <span className="status-label">Tour</span>
              <span className="status-value">{gameState.roundNumber}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Phase</span>
              <span className="status-value">
                {gameState.gamePhase === "drafting"
                  ? "Sélection"
                  : gameState.gamePhase === "tiling"
                  ? "Placement"
                  : gameState.gamePhase === "scoring"
                  ? "Décompte"
                  : "Fin de partie"}
              </span>
            </div>
            <div className="status-item current-player-info">
              <span className="status-label">Joueur actif</span>
              <span className="status-value">{currentPlayer?.name}</span>
            </div>
          </div>

          <div className="game-controls">
            <select
              id="player-count-select"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="player-select"
              aria-label="Sélectionner le nombre de joueurs"
            >
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
            </select>
            <button
              onClick={handleNewGame}
              className="new-game-btn"
              aria-label="Démarrer une nouvelle partie"
            >
              <span className="btn-icon">+</span>
              <span>Nouvelle partie</span>
            </button>
            <button
              onClick={startTutorial}
              className="tutorial-btn"
              aria-label="Voir le tutoriel"
            >
              <span className="btn-icon">❓</span>
              <span>Tutoriel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="main-area">
        <div className="factories-area">
          <h2>Fabriques</h2>
          <div className="factories-container">
            {gameState.factories.map((factory) => (
              <Factory
                key={factory.id}
                factoryId={factory.id}
                ref={(el: HTMLDivElement | null) => (factoryRefs.current[factory.id] = el)}
                isAISelecting={
                  aiAnimation?.sourceType === "factory" &&
                  aiAnimation.sourceId === factory.id
                }
              />
            ))}
          </div>

          <div className="center-area">
            <h2>Centre</h2>
            <Center
              ref={centerRef}
              isAISelecting={aiAnimation?.sourceType === "center"}
            />
            <GameInfo />
          </div>
        </div>

        <div className="players-area">
          <AIPlayerConfig />
          <h2>Plateaux des joueurs</h2>
          <div className="players-container">
            {gameState.players.map((player) => {
              const isCurrentPlayer = player.id === gameState.currentPlayer;
              const isAI = aiPlayers[player.id];
              const isThinking = isCurrentPlayer && isAI && !aiAnimation;
              const isAnimatingMove = aiAnimation?.playerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`player-board-container ${
                    isCurrentPlayer ? "active-player" : ""
                  } ${isThinking ? "ai-thinking" : ""} ${
                    isAnimatingMove ? "ai-animating" : ""
                  }`}
                >
                  <div className="player-header">
                    <h3>
                      {player.name}
                      {isCurrentPlayer && (
                        <span className="current-turn-indicator">
                          {isAI ? " (IA joue...)" : " (votre tour)"}
                        </span>
                      )}
                    </h3>
                    <div className="player-score">
                      <span className="score-value">{player.board.score}</span>
                      <span className="score-label">points</span>
                    </div>
                  </div>
                  <PlayerBoard
                    playerId={player.id}
                    patternLineRef={(index: number, el: HTMLDivElement | null) => {
                      if (!patternLineRefs.current[player.id]) {
                        patternLineRefs.current[player.id] = {};
                      }
                      patternLineRefs.current[player.id][index] = el;
                    }}
                    floorLineRef={(el: HTMLDivElement | null) =>
                      (floorLineRefs.current[player.id] = el)
                    }
                  />
                  {isThinking && (
                    <div className="ai-thinking-indicator">
                      <span className="ai-thinking-icon">🤖</span>
                      <span>AI thinking...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {aiAnimation && animationSource && animationTarget && (
          <AIAnimation
            sourceElement={animationSource}
            targetElement={animationTarget}
            tiles={aiAnimation.tiles}
            color={aiAnimation.color}
            targetType={aiAnimation.targetType}
            targetIndex={aiAnimation.targetIndex}
            onAnimationComplete={() => {}}
          />
        )}
      </div>

      <footer className="game-footer">
        <div className="game-signature">
          Azul - Inspiré du jeu de société créé par Michael Kiesling
        </div>
      </footer>
    </div>
  );
};

export default GameBoard;
