import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { GameState, TileColor, Tile } from "../models/types";
import { initializeGame, distributeFactoryTiles } from "../game-logic/setup";
import { canSelectTiles, canPlaceTiles } from "../game-logic/moves";
import { getAIMove, AIDifficulty } from "../game-logic/ai/aiPlayer";
import {
  calculateRoundScores,
  calculateFinalScores,
} from "../game-logic/scoring";
import { saveGameStats, generateGameId } from "../utils/SaveService";
import AIAnimation from "./../components/AI/AIAnimation";

interface ScoringEvent {
  playerId: string;
  points: number;
  position: { x: number; y: number };
  type: "regular" | "bonus" | "penalty";
  label?: string;
}

/**
 * Interface for the Game Context
 * Provides game state and functions to interact with the game
 */
interface GameContextType {
  /** Current state of the game */
  gameState: GameState;

  /** Current speed setting for AI moves */
  aiSpeed: "fast" | "normal" | "slow";

  /**
   * Function to set the AI speed
   * @param speed - Speed of the AI ('fast', 'normal', 'slow')
   * @returns void
   */
  setAISpeed: (speed: "fast" | "normal" | "slow") => void;

  /**
   * Function to select tiles from a factory or center
   * @param factoryId - ID of the factory, or null for the center
   * @param color - Color of tiles to select
   */
  selectTiles: (factoryId: number | null, color: TileColor) => void;

  /**
   * Function to place selected tiles on a pattern line
   * @param patternLineIndex - Index of the pattern line, or -1 for floor line
   */
  placeTiles: (patternLineIndex: number) => void;

  /**
   * Function to start a new game
   * @param playerCount - Number of players (2-4)
   */
  startNewGame: (playerCount: number, keepAiSettings?: boolean) => void;

  /** Currently selected tiles */
  selectedTiles: Tile[];

  /** Map of player IDs to AI difficulty levels */
  aiPlayers: Record<string, AIDifficulty>;

  /**
   * Function to add an AI player
   * @param playerId - ID of the player to convert to AI
   * @param difficulty - Difficulty level for the AI
   */
  addAIPlayer: (playerId: string, difficulty: AIDifficulty) => void;

  /**
   * Function to remove an AI player
   * @param playerId - ID of the AI player to convert back to human
   */
  removeAIPlayer: (playerId: string) => void;

  /** Function to trigger the current AI player's turn */
  executeAITurn: () => void;

  /** Function to animate AI moves */
  aiAnimation: {
    playerId: string;
    sourceType: "factory" | "center";
    sourceId: number | null;
    tiles: Tile[];
    targetType: "patternLine" | "floorLine";
    targetIndex: number;
    color: TileColor;
    isAnimating: boolean;
  } | null;

  showFinalScoring: boolean;
  scoringAnimations: ScoringEvent[];
  addScoringAnimation: (event: ScoringEvent) => void;
  clearScoringAnimations: () => void;
  setShowFinalScoring: (show: boolean) => void;

  isRoundTransition: boolean;
  setIsRoundTransition: (isTransition: boolean) => void;
}

/** Context for managing game state and actions */
const GameContext = createContext<GameContextType | undefined>(undefined);

/**
 * Provider component that wraps the application to provide game state and functions
 * @param children - Child components that will have access to the game context
 */
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [selectedSource, setSelectedSource] = useState<{
    factoryId: number | null;
    color: TileColor;
  } | null>(null);
  const [aiPlayers, setAIPlayers] = useState<Record<string, AIDifficulty>>({});
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [aiSpeed, setAISpeed] = useState<"fast" | "normal" | "slow">("normal");
  const [isRoundTransitioning, setIsRoundTransitioning] = useState(false);

  const [aiAnimation, setAiAnimation] = useState<{
    playerId: string;
    sourceType: "factory" | "center";
    sourceId: number | null;
    tiles: Tile[];
    targetType: "patternLine" | "floorLine";
    targetIndex: number;
    color: TileColor;
    isAnimating: boolean;
  } | null>(null);

  // Use refs to avoid recreating functions on every render
  const gameStateRef = useRef<GameState | null>(null);
  const selectedTilesRef = useRef<Tile[]>([]);
  const selectedSourceRef = useRef<{
    factoryId: number | null;
    color: TileColor;
  } | null>(null);
  const aiPlayersRef = useRef<Record<string, AIDifficulty>>({});

  const [scoringAnimations, setScoringAnimations] = useState<ScoringEvent[]>(
    []
  );
  const [showFinalScoring, setShowFinalScoring] = useState(false);

  const addScoringAnimation = useCallback((event: ScoringEvent) => {
    setScoringAnimations((prev) => [...prev, event]);
  }, []);

  const clearScoringAnimations = useCallback(() => {
    setScoringAnimations([]);
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
    selectedTilesRef.current = selectedTiles;
    selectedSourceRef.current = selectedSource;
    aiPlayersRef.current = aiPlayers;
  }, [gameState, selectedTiles, selectedSource, aiPlayers]);

  /**
   * Adds an AI player with specified difficulty
   * @param playerId - ID of the player to convert to AI
   * @param difficulty - Difficulty level for the AI
   */
  const addAIPlayer = useCallback(
    (playerId: string, difficulty: AIDifficulty) => {
      setAIPlayers((prev) => ({
        ...prev,
        [playerId]: difficulty,
      }));
    },
    []
  );

  const setIsRoundTransition = useCallback((isTransition: boolean) => {
    setIsRoundTransitioning(isTransition);
  }
  , []);

  /**
   * Removes an AI player, converting it back to human control
   * @param playerId - ID of the AI player to remove
   */
  const removeAIPlayer = useCallback((playerId: string) => {
    setAIPlayers((prev) => {
      const newAIPlayers = { ...prev };
      delete newAIPlayers[playerId];
      return newAIPlayers;
    });
  }, []);

  /**
   * Initializes a new game with the specified number of players
   * @param playerCount - Number of players (2-4)
   * @param keepAiSettings - Whether to keep current AI settings
   */
  const startNewGame = useCallback(
    (playerCount: number, keepAiSettings = false) => {
      const currentAiPlayers = aiPlayersRef.current;
      const newGameState = initializeGame(playerCount);

      setGameState(newGameState);
      setSelectedTiles([]);
      setSelectedSource(null);
      setGameStartTime(new Date());
      setGameId(generateGameId());

      // Si on souhaite conserver les réglages IA
      if (keepAiSettings) {
        const newAiPlayers: Record<string, AIDifficulty> = {};

        // Pour chaque nouveau joueur
        newGameState.players.forEach((player, index) => {
          // Récupérer le joueur précédent à la même position s'il existe
          const previousPlayers = gameStateRef.current?.players || [];
          if (index < previousPlayers.length) {
            const previousPlayerId = previousPlayers[index].id;
            // S'il était une IA, conserver le même niveau de difficulté
            if (currentAiPlayers[previousPlayerId]) {
              newAiPlayers[player.id] = currentAiPlayers[previousPlayerId];
            }
          }
        });

        setAIPlayers(newAiPlayers);
      } else {
        setAIPlayers({});
      }
    },
    []
  );

  /**
   * Selects tiles of a specific color from a factory or the center
   * @param factoryId - ID of the factory, or null for the center
   * @param color - Color of tiles to select
   */
  const selectTiles = useCallback(
    (factoryId: number | null, color: TileColor) => {
      const currentGameState = gameStateRef.current;
      if (!currentGameState) return;

      if (!canSelectTiles(currentGameState, factoryId, color)) {
        console.log("Invalid tile selection");
        return;
      }

      // Use functional updates to avoid stale state issues
      setGameState((prevState) => {
        if (!prevState) return null;

        // Create a new state object with minimal copying
        const newGameState = { ...prevState };
        let tilesToSelect: Tile[] = [];

        if (factoryId !== null) {
          // Selection from a factory
          const factoryIndex = newGameState.factories.findIndex(
            (f) => f.id === factoryId
          );
          if (factoryIndex === -1) return prevState;

          const factory = newGameState.factories[factoryIndex];

          // Find all tiles of this color in the factory
          const selectedFromFactory = factory.tiles.filter(
            (t) => t.color === color
          );
          const otherTiles = factory.tiles.filter((t) => t.color !== color);

          tilesToSelect = selectedFromFactory;

          // Update the factory and center (create new arrays, but reuse tile objects)
          newGameState.factories = [
            ...newGameState.factories.slice(0, factoryIndex),
            { ...factory, tiles: [] },
            ...newGameState.factories.slice(factoryIndex + 1),
          ];

          newGameState.center = [...newGameState.center, ...otherTiles];
        } else {
          // Selection from the center - filter once
          const centerTiles = newGameState.center;
          tilesToSelect = centerTiles.filter((t) => t.color === color);
          newGameState.center = centerTiles.filter((t) => t.color !== color);

          // Take the first player token if present
          if (newGameState.firstPlayerToken === null) {
            newGameState.firstPlayerToken = newGameState.currentPlayer;
          }
        }

        // Update refs for other functions to use
        selectedTilesRef.current = tilesToSelect;
        selectedSourceRef.current = { factoryId, color };

        // Update state variables outside setGameState
        setSelectedTiles(tilesToSelect);
        setSelectedSource({ factoryId, color });

        return newGameState;
      });
    },
    [] // No dependencies as we use refs
  );

  /**
   * Helper to check if round is over and handle end-round logic
   */
  const handleRoundEnd = useCallback(
    (gameState: GameState): GameState => {
      // Si le round est terminé (toutes les fabriques et centre vides)
      if (
        gameState.factories.every((f) => f.tiles.length === 0) &&
        gameState.center.length === 0
      ) {
        // Copier l'état du jeu
        let newState = { ...gameState };

        // Passer à la phase de tuilage
        newState.gamePhase = "tiling";

        // Calculer les scores, mais avec animation séquentielle
        // (Ceci sera implémenté avec un délai dans les composants visuels)
        newState = calculateRoundScores(
          newState,
          (playerId, type, points, position) => {
            // Animation callback
            addScoringAnimation({
              playerId,
              points,
              position: { x: position.col || 0, y: position.row || 0 },
              type: type as "regular" | "bonus" | "penalty",
            });
          }
        );

        // Vérifier si le jeu est terminé
        const anyWallRowComplete = newState.players.some((p) =>
          p.board.wall.some((row) => row.every((space) => space.filled))
        );

        if (anyWallRowComplete) {
          // Fin du jeu
          newState.gamePhase = "gameEnd";
          newState = calculateFinalScores(newState);
        } else {
          // Préparation pour le prochain tour (ceci sera déclenché après l'animation)
          // Nous utiliserons un état supplémentaire pour gérer les transitions
          //newState.gamePhase = "roundTransition";
          newState.roundNumber += 1;

          // Réinitialiser le premier joueur si nécessaire
          if (newState.firstPlayerToken) {
            newState.currentPlayer = newState.firstPlayerToken;
            newState.firstPlayerToken = null;
          }

          // Vérifier si le sac est vide et la pile de défausse a des tuiles
          if (newState.bag.length === 0 && newState.discardPile.length > 0) {
            newState.bag = [...newState.discardPile];
            newState.discardPile = [];
            // Mélanger
            newState.bag = shuffle(newState.bag);
          }

          // Distribuer les tuiles aux fabriques
          newState = distributeFactoryTiles(newState);
          newState.gamePhase = "drafting";
        }

        return newState;
      }

      return gameState;
    },
    [addScoringAnimation]
  );

  /**
   * Places selected tiles on a pattern line or floor line
   * @param patternLineIndex - Index of the pattern line, or -1 for floor line
   */
  const placeTiles = useCallback(
    (patternLineIndex: number) => {
      const currentGameState = gameStateRef.current;
      const currentSelectedTiles = selectedTilesRef.current;
      const currentSelectedSource = selectedSourceRef.current;

      if (
        !currentGameState ||
        currentSelectedTiles.length === 0 ||
        !currentSelectedSource
      )
        return;

      // If patternLineIndex is -1, it means place in the floor line
      const isFloorLine = patternLineIndex === -1;

      if (
        !isFloorLine &&
        !canPlaceTiles(currentGameState, patternLineIndex, currentSelectedTiles)
      ) {
        console.log("Invalid tile placement");
        return;
      }

      // Use functional updates to avoid stale state
      setGameState((prevState) => {
        if (!prevState) return null;

        // Create new state with minimal copying
        let newGameState = { ...prevState };
        const currentPlayerIndex = newGameState.players.findIndex(
          (p) => p.id === newGameState.currentPlayer
        );

        if (currentPlayerIndex === -1) return prevState;

        // Create a new copy of the current player, reuse other players
        const currentPlayer = {
          ...newGameState.players[currentPlayerIndex],
          board: { ...newGameState.players[currentPlayerIndex].board },
        };

        // Update player array with minimal copying
        newGameState.players = [
          ...newGameState.players.slice(0, currentPlayerIndex),
          currentPlayer,
          ...newGameState.players.slice(currentPlayerIndex + 1),
        ];

        if (isFloorLine) {
          // Place all tiles in the floor line - create new array but reuse tile objects
          currentPlayer.board.floorLine = [
            ...currentPlayer.board.floorLine,
            ...currentSelectedTiles,
          ];
        } else {
          // Create a new copy of just the affected pattern line, reuse others
          const patternLines = [...currentPlayer.board.patternLines];
          const patternLine = { ...patternLines[patternLineIndex] };
          patternLines[patternLineIndex] = patternLine;
          currentPlayer.board.patternLines = patternLines;

          const color = currentSelectedTiles[0].color;

          // Check if the line can accommodate all tiles
          const spaceAvailable = patternLine.spaces - patternLine.tiles.length;
          const tilesToPlace = currentSelectedTiles.slice(0, spaceAvailable);
          const excessTiles = currentSelectedTiles.slice(spaceAvailable);

          // Update the pattern line
          patternLine.tiles = [...patternLine.tiles, ...tilesToPlace];
          patternLine.color = patternLine.color || color;

          // Add excess tiles to the floor line
          currentPlayer.board.floorLine = [
            ...currentPlayer.board.floorLine,
            ...excessTiles,
          ];
        }

        // Move to next player
        const nextPlayerIndex =
          (currentPlayerIndex + 1) % newGameState.players.length;
        newGameState.currentPlayer = newGameState.players[nextPlayerIndex].id;

        // Check for round end and handle end-round logic
        newGameState = handleRoundEnd(newGameState);

        // Clear selections
        selectedTilesRef.current = [];
        selectedSourceRef.current = null;
        setSelectedTiles([]);
        setSelectedSource(null);

        return newGameState;
      });

      if (!currentGameState) return;

      const roundOver =
        currentGameState.factories.every((f) => f.tiles.length === 0) &&
        currentGameState.center.length === 0;

      if (roundOver) {
        const newState = handleRoundEnd(currentGameState);

        // Si la manche est terminée mais le jeu n'est pas fini
        if (
          newState.gamePhase === "drafting" &&
          gameStateRef.current && 
          newState.roundNumber > gameStateRef.current.roundNumber
        ) {
          setIsRoundTransitioning(true);

          // Attendre que toutes les animations de score soient complètes avant de passer à la suivante
          setTimeout(() => {
            setGameState(newState);

            // Une autre courte pause avant de masquer la transition
            setTimeout(() => {
              setIsRoundTransitioning(false);
            }, 2500);
          }, 2000); // Délai pour permettre les animations de scoring
        } else {
          // Game over ou autres cas
          setGameState(newState);
        }
      }
    },
    [handleRoundEnd] // Only depend on handleRoundEnd, use refs for others
  );

  // Replace the existing executeAITurn function (around line 417)
  /**
   * Executes a turn for the current AI player with animations
   */
  const executeAITurn = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (!currentGameState) return;

    const currentPlayerId = currentGameState.currentPlayer;
    const currentAIPlayers = aiPlayersRef.current;

    if (currentAIPlayers[currentPlayerId]) {
      try {
        const difficulty = currentAIPlayers[currentPlayerId];
        const aiDecision = getAIMove(currentGameState, difficulty);

        // Get the tiles that will be selected
        let tilesToSelect: Tile[] = [];
        if (aiDecision.factoryId !== null) {
          // From factory
          const factory = currentGameState.factories.find(
            (f) => f.id === aiDecision.factoryId
          );
          if (factory) {
            tilesToSelect = factory.tiles.filter(
              (t) => t.color === aiDecision.color
            );
          }
        } else {
          // From center
          tilesToSelect = currentGameState.center.filter(
            (t) => t.color === aiDecision.color
          );
        }

        // Start animation
        setAiAnimation({
          playerId: currentPlayerId,
          sourceType: aiDecision.factoryId !== null ? "factory" : "center",
          sourceId: aiDecision.factoryId,
          tiles: tilesToSelect,
          targetType:
            aiDecision.patternLineIndex === -1 ? "floorLine" : "patternLine",
          targetIndex: aiDecision.patternLineIndex,
          color: aiDecision.color,
          isAnimating: true,
        });

        // Delay based on AI speed setting
        const delayMap = {
          fast: 500,
          normal: 1000,
          slow: 1800,
        };

        // Select tiles after a brief delay to show the selection
        setTimeout(() => {
          selectTiles(aiDecision.factoryId, aiDecision.color);

          // Place tiles after animation completes
          setTimeout(() => {
            placeTiles(aiDecision.patternLineIndex);
            setAiAnimation(null);
          }, delayMap[aiSpeed] / 2);
        }, 300);
      } catch (error) {
        console.error("Error during AI turn:", error);
        setAiAnimation(null);
      }
    }
  }, [selectTiles, placeTiles, aiSpeed]);

  /**
   * Effect to trigger AI turns automatically when it's an AI player's turn
   */
  useEffect(() => {
    if (!gameState) return;

    if (gameState?.gamePhase === "gameEnd") {
      const duration = gameStartTime
        ? Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000)
        : 0;

      // Count completed rows, columns, and colors for each player
      const completedRows = gameState.players.map(
        (p) =>
          p.board.wall.filter((row) => row.every((space) => space.filled))
            .length
      );

      const completedColumns = gameState.players.map((p) => {
        let count = 0;
        for (let col = 0; col < 5; col++) {
          if (p.board.wall.every((row) => row[col].filled)) count++;
        }
        return count;
      });

      const completedColors = gameState.players.map((p) => {
        const colors: TileColor[] = ["blue", "yellow", "red", "black", "teal"];
        return colors.filter(
          (color) =>
            p.board.wall
              .flat()
              .filter((space) => space.color === color && space.filled)
              .length === 5
        ).length;
      });

      const stats = {
        id: gameId || generateGameId(),
        date: new Date().toISOString(),
        players: gameState.players.map((p) => p.name),
        scores: gameState.players.map((p) => p.board.score),
        winner: gameState.players.reduce((a, b) =>
          a.board.score > b.board.score ? a : b
        ).name,
        aiLevels: gameState.players.map((p) => aiPlayers[p.id] || "human"),
        duration,
        rounds: gameState.roundNumber,
        completedRows,
        completedColumns,
        completedColors,
        moves: gameState.players.map(() => 0),
      };
      saveGameStats(stats);
    }

    const currentPlayerId = gameState.currentPlayer;

    // Check if current player is AI and game is in drafting phase
    if (aiPlayers[currentPlayerId] && gameState.gamePhase === "drafting") {
      // Delay based on AI speed setting
      const delayMap = {
        fast: 300,
        normal: 800,
        slow: 1500,
      };

      const timer = setTimeout(() => {
        executeAITurn();
      }, delayMap[aiSpeed]);

      return () => clearTimeout(timer);
    }
  }, [gameState, aiPlayers, executeAITurn, aiSpeed]);

  /**
   * Helper function to shuffle array using Fisher-Yates algorithm
   * @param array - Array to shuffle
   * @returns Shuffled array
   */
  const shuffle = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Initialize the game with 2 players by default if not initialized
  useEffect(() => {
    if (!gameState) {
      startNewGame(2);
    }
  }, [gameState, startNewGame]);

  // Create value object for context
  const contextValue: GameContextType = {
    gameState: gameState!,
    selectTiles,
    placeTiles,
    startNewGame,
    selectedTiles,
    aiPlayers,
    addAIPlayer,
    removeAIPlayer,
    executeAITurn,
    setAISpeed,
    aiSpeed,
    aiAnimation,
    showFinalScoring,
    scoringAnimations,
    addScoringAnimation,
    clearScoringAnimations,
    setShowFinalScoring,
    isRoundTransition: isRoundTransitioning,
    setIsRoundTransition,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

/**
 * Custom hook to use the game context
 * @returns Game context with state and functions
 * @throws Error if used outside of GameProvider
 */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
