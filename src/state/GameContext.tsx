import React, { createContext, useContext, useState, useCallback } from "react";
import { GameState, TileColor, Tile } from "../models/types";
import { initializeGame, distributeFactoryTiles } from "../game-logic/setup";
import { canSelectTiles, canPlaceTiles } from "../game-logic/moves";
import {
  calculateRoundScores,
  calculateFinalScores,
} from "../game-logic/scoring";

interface GameContextType {
  gameState: GameState;
  selectTiles: (factoryId: number | null, color: TileColor) => void;
  placeTiles: (patternLineIndex: number) => void;
  startNewGame: (playerCount: number) => void;
  selectedTiles: Tile[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [selectedSource, setSelectedSource] = useState<{
    factoryId: number | null;
    color: TileColor;
  } | null>(null);

  const startNewGame = useCallback((playerCount: number) => {
    const newGameState = initializeGame(playerCount);
    setGameState(newGameState);
    setSelectedTiles([]);
    setSelectedSource(null);
  }, []);

  const selectTiles = useCallback(
    (factoryId: number | null, color: TileColor) => {
      if (!gameState) return;

      if (!canSelectTiles(gameState, factoryId, color)) {
        console.log("Sélection de tuiles invalide");
        return;
      }

      // Logique pour sélectionner les tuiles
      let newGameState = { ...gameState };
      let tilesToSelect: Tile[] = [];

      if (factoryId !== null) {
        // Sélection depuis une fabrique
        const factory = newGameState.factories.find((f) => f.id === factoryId);
        if (!factory) return;

        // Trouver toutes les tuiles de cette couleur dans la fabrique
        const selectedFromFactory = factory.tiles.filter(
          (t) => t.color === color
        );
        const otherTiles = factory.tiles.filter((t) => t.color !== color);

        tilesToSelect = [...selectedFromFactory];

        // Mettre à jour la fabrique et le centre
        newGameState.factories = newGameState.factories.map((f) =>
          f.id === factoryId ? { ...f, tiles: [] } : f
        );

        newGameState.center = [...newGameState.center, ...otherTiles];
      } else {
        // Sélection depuis le centre
        tilesToSelect = newGameState.center.filter((t) => t.color === color);
        newGameState.center = newGameState.center.filter(
          (t) => t.color !== color
        );

        // Prendre le jeton premier joueur si présent
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

  // Partie de la fonction placeTiles à modifier

const placeTiles = useCallback(
  (patternLineIndex: number) => {
    if (!gameState || selectedTiles.length === 0 || !selectedSource) return;

    // Si patternLineIndex est -1, cela signifie de placer dans la ligne de plancher
    const isFloorLine = patternLineIndex === -1;

    if (!isFloorLine && !canPlaceTiles(gameState, patternLineIndex, selectedTiles)) {
      console.log("Placement de tuiles invalide");
      return;
    }

    // Logique pour placer les tuiles sélectionnées
    let newGameState = { ...gameState };
    const currentPlayer = newGameState.players.find(
      (p) => p.id === newGameState.currentPlayer
    );
    if (!currentPlayer) return;

    if (isFloorLine) {
      // Placer toutes les tuiles dans la ligne de plancher
      currentPlayer.board.floorLine = [...currentPlayer.board.floorLine, ...selectedTiles];
    } else {
      // Placer les tuiles sur la ligne de motif
      const patternLine = currentPlayer.board.patternLines[patternLineIndex];
      const color = selectedTiles[0].color;

      // Vérifier si la ligne peut accueillir toutes les tuiles
      const spaceAvailable = patternLine.spaces - patternLine.tiles.length;
      const tilesToPlace = selectedTiles.slice(0, spaceAvailable);
      const excessTiles = selectedTiles.slice(spaceAvailable);

      // Mettre à jour la ligne de motif
      patternLine.tiles = [...patternLine.tiles, ...tilesToPlace];
      patternLine.color = patternLine.color || color;

      // Ajouter les tuiles en excès à la ligne de plancher
      currentPlayer.board.floorLine = [
        ...currentPlayer.board.floorLine,
        ...excessTiles,
      ];
    }

    // Passer au joueur suivant
    const currentPlayerIndex = newGameState.players.findIndex(
      (p) => p.id === newGameState.currentPlayer
    );
    const nextPlayerIndex =
      (currentPlayerIndex + 1) % newGameState.players.length;
    newGameState.currentPlayer = newGameState.players[nextPlayerIndex].id;

      // Vérifier si la phase de sélection est terminée
      const factoriesEmpty = newGameState.factories.every(
        (f) => f.tiles.length === 0
      );
      const centerEmpty = newGameState.center.length === 0;

      if (factoriesEmpty && centerEmpty) {
        // Passer à la phase de placement des tuiles sur le mur
        newGameState.gamePhase = "tiling";
        newGameState = calculateRoundScores(newGameState);

        // Vérifier si la partie est terminée
        const anyWallRowComplete = newGameState.players.some((p) =>
          p.board.wall.some((row) => row.every((space) => space.filled))
        );

        if (anyWallRowComplete) {
          newGameState.gamePhase = "gameEnd";
          newGameState = calculateFinalScores(newGameState);
        } else {
          // Préparer le prochain round
          newGameState.roundNumber += 1;
          newGameState.gamePhase = "drafting";

          // Réinitialiser le jeton premier joueur si nécessaire
          if (newGameState.firstPlayerToken) {
            newGameState.currentPlayer = newGameState.firstPlayerToken;
            newGameState.firstPlayerToken = null;
          }

          // Redistribuer les tuiles aux fabriques
          newGameState = distributeFactoryTiles(newGameState);
        }
      }

      setGameState(newGameState);
      setSelectedTiles([]);
      setSelectedSource(null);
    },
    [gameState, selectedTiles, selectedSource]
  );

  const value = {
    gameState: gameState as GameState,
    selectTiles,
    placeTiles,
    startNewGame,
    selectedTiles,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
