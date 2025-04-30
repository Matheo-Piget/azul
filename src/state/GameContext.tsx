import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { GameState, TileColor, Tile } from "../models/types";
import { initializeGame, distributeFactoryTiles } from "../game-logic/setup";
import { canSelectTiles, canPlaceTiles } from "../game-logic/moves";
import { getAIMove, AIDifficulty } from "../game-logic/ai/aiPlayer";
import {
  calculateRoundScores,
  calculateFinalScores,
} from "../game-logic/scoring";

/**
 * Interface for the Game Context
 * Provides game state and functions to interact with the game
 */
interface GameContextType {
  /** Current state of the game */
  gameState: GameState;
  
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
  startNewGame: (playerCount: number) => void;
  
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
   */
  const startNewGame = useCallback((playerCount: number) => {
    const newGameState = initializeGame(playerCount);
    setGameState(newGameState);
    setSelectedTiles([]);
    setSelectedSource(null);
  }, []);

  /**
   * Selects tiles of a specific color from a factory or the center
   * @param factoryId - ID of the factory, or null for the center
   * @param color - Color of tiles to select
   */
  const selectTiles = useCallback(
    (factoryId: number | null, color: TileColor) => {
      if (!gameState) return;

      if (!canSelectTiles(gameState, factoryId, color)) {
        console.log("Invalid tile selection");
        return;
      }

      // Logic for selecting tiles
      let newGameState = { ...gameState };
      let tilesToSelect: Tile[] = [];

      if (factoryId !== null) {
        // Selection from a factory
        const factory = newGameState.factories.find((f) => f.id === factoryId);
        if (!factory) return;

        // Find all tiles of this color in the factory
        const selectedFromFactory = factory.tiles.filter(
          (t) => t.color === color
        );
        const otherTiles = factory.tiles.filter((t) => t.color !== color);

        tilesToSelect = [...selectedFromFactory];

        // Update the factory and center
        newGameState.factories = newGameState.factories.map((f) =>
          f.id === factoryId ? { ...f, tiles: [] } : f
        );

        newGameState.center = [...newGameState.center, ...otherTiles];
      } else {
        // Selection from the center
        tilesToSelect = newGameState.center.filter((t) => t.color === color);
        newGameState.center = newGameState.center.filter(
          (t) => t.color !== color
        );

        // Take the first player token if present
        if (newGameState.firstPlayerToken === null) {
          newGameState.firstPlayerToken = newGameState.currentPlayer;
        }
      }

      setGameState(newGameState);
      setSelectedTiles(tilesToSelect);
      setSelectedSource({ factoryId, color });
    },
    [gameState]
  );

  /**
   * Places selected tiles on a pattern line or floor line
   * @param patternLineIndex - Index of the pattern line, or -1 for floor line
   */
  const placeTiles = useCallback(
    (patternLineIndex: number) => {
      if (!gameState || selectedTiles.length === 0 || !selectedSource) return;

      // If patternLineIndex is -1, it means place in the floor line
      const isFloorLine = patternLineIndex === -1;

      if (
        !isFloorLine &&
        !canPlaceTiles(gameState, patternLineIndex, selectedTiles)
      ) {
        console.log("Invalid tile placement");
        return;
      }

      // Logic for placing selected tiles
      let newGameState = { ...gameState };
      const currentPlayer = newGameState.players.find(
        (p) => p.id === newGameState.currentPlayer
      );
      if (!currentPlayer) return;

      if (isFloorLine) {
        // Place all tiles in the floor line
        currentPlayer.board.floorLine = [
          ...currentPlayer.board.floorLine,
          ...selectedTiles,
        ];
      } else {
        // Place tiles on the pattern line
        const patternLine = currentPlayer.board.patternLines[patternLineIndex];
        const color = selectedTiles[0].color;

        // Check if the line can accommodate all tiles
        const spaceAvailable = patternLine.spaces - patternLine.tiles.length;
        const tilesToPlace = selectedTiles.slice(0, spaceAvailable);
        const excessTiles = selectedTiles.slice(spaceAvailable);

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
      const currentPlayerIndex = newGameState.players.findIndex(
        (p) => p.id === newGameState.currentPlayer
      );
      const nextPlayerIndex =
        (currentPlayerIndex + 1) % newGameState.players.length;
      newGameState.currentPlayer = newGameState.players[nextPlayerIndex].id;

      // Check if selection phase is complete
      const factoriesEmpty = newGameState.factories.every(
        (f) => f.tiles.length === 0
      );
      const centerEmpty = newGameState.center.length === 0;

      if (factoriesEmpty && centerEmpty) {
        // Move to wall tiling phase
        newGameState.gamePhase = "tiling";
        newGameState = calculateRoundScores(newGameState);

        // Check if game is over
        const anyWallRowComplete = newGameState.players.some((p) =>
          p.board.wall.some((row) => row.every((space) => space.filled))
        );

        if (anyWallRowComplete) {
          newGameState.gamePhase = "gameEnd";
          newGameState = calculateFinalScores(newGameState);
        } else {
          // Prepare for next round
          newGameState.roundNumber += 1;
          newGameState.gamePhase = "drafting";

          // Reset first player token if necessary
          if (newGameState.firstPlayerToken) {
            newGameState.currentPlayer = newGameState.firstPlayerToken;
            newGameState.firstPlayerToken = null;
          }

          // Check if bag is empty and discard pile has tiles
          if (
            newGameState.bag.length === 0 &&
            newGameState.discardPile.length > 0
          ) {
            newGameState.bag = [...newGameState.discardPile];
            newGameState.discardPile = [];
            newGameState.bag = shuffle(newGameState.bag);
          }

          // Redistribute tiles to factories
          newGameState = distributeFactoryTiles(newGameState);
        }
      }

      setGameState(newGameState);
      setSelectedTiles([]);
      setSelectedSource(null);
    },
    [gameState, selectedTiles, selectedSource]
  );

  /**
   * Executes a turn for the current AI player
   */
  const executeAITurn = useCallback(() => {
    if (!gameState) return;

    const currentPlayerId = gameState.currentPlayer;

    // Check if current player is AI
    if (aiPlayers[currentPlayerId]) {
      try {
        const difficulty = aiPlayers[currentPlayerId];
        const aiDecision = getAIMove(gameState, difficulty);

        // Execute AI move
        selectTiles(aiDecision.factoryId, aiDecision.color);

        // Use setTimeout to simulate thinking delay
        setTimeout(() => {
          placeTiles(aiDecision.patternLineIndex);
        }, 1000);
      } catch (error) {
        console.error("Error during AI turn:", error);
      }
    }
  }, [gameState, aiPlayers, selectTiles, placeTiles]);

  /**
   * Effect to trigger AI turns automatically when it's an AI player's turn
   */
  useEffect(() => {
    if (!gameState) return;

    const currentPlayerId = gameState.currentPlayer;

    if (aiPlayers[currentPlayerId]) {
      // Small delay to make AI seem to think
      const timer = setTimeout(() => {
        executeAITurn();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState?.currentPlayer, aiPlayers, executeAITurn]);

  const value = {
    gameState: gameState as GameState,
    selectTiles,
    placeTiles,
    startNewGame,
    selectedTiles,
    aiPlayers,
    addAIPlayer,
    removeAIPlayer,
    executeAITurn,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

/**
 * Custom hook to access the game context
 * @returns Game context with game state and functions
 * @throws Error if used outside of GameProvider
 */
export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};

/**
 * Shuffles an array of tiles using the Fisher-Yates algorithm
 * @param bag - Array of tiles to shuffle
 * @returns Shuffled array of tiles
 */
function shuffle(bag: Tile[]): Tile[] {
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}