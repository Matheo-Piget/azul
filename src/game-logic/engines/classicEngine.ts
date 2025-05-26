import { AzulGameEngine } from "../../models/AzulGameEngine";
import { GameState, TileColor, Tile, Player, PlayerBoard } from "../../models/types";
import { shuffle } from '../utils';
import { calculateClassicScore } from '../scoring/classicScoring';

// Ces fonctions sont importées ici pour éviter les références circulaires
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

// Fonction auxiliaire pour créer un plateau de joueur
const createClassicPlayerBoard = (): PlayerBoard => {
  // Create pattern lines (1 to 5 spaces)
  const patternLines = [];
  for (let i = 0; i < 5; i++) {
    patternLines.push({
      spaces: i + 1,
      tiles: [],
      color: null
    });
  }
  
  // Create wall (5x5)
  const wallColorPattern: TileColor[][] = [
    ['blue', 'yellow', 'red', 'black', 'teal'],
    ['teal', 'blue', 'yellow', 'red', 'black'],
    ['black', 'teal', 'blue', 'yellow', 'red'],
    ['red', 'black', 'teal', 'blue', 'yellow'],
    ['yellow', 'red', 'black', 'teal', 'blue']
  ];
  
  const wall = [];
  for (let row = 0; row < 5; row++) {
    const wallRow = [];
    // Shift each row to create the wall pattern
    const shiftedColors = [...wallColorPattern[row]];
    
    for (let col = 0; col < 5; col++) {
      wallRow.push({
        row,
        column: col,
        color: shiftedColors[col],
        filled: false
      });
    }
    wall.push(wallRow);
  }
  
  return {
    patternLines,
    wall,
    floorLine: [],
    score: 0
  };
};

// Fonction auxiliaire pour créer un joueur
const createClassicPlayer = (id: string, name: string): Player => {
  return {
    id,
    name,
    board: createClassicPlayerBoard()
  };
};

// Fonction auxiliaire pour créer des tuiles
const createClassicTiles = (): Tile[] => {
  const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
  const tiles: Tile[] = [];
  
  // 20 tiles of each color
  for (const color of colors) {
    for (let i = 0; i < 20; i++) {
      tiles.push({
        id: generateId(),
        color
      });
    }
  }
  
  return shuffle(tiles);
};

// Fonction auxiliaire pour créer des fabriques
const createClassicFactories = (playerCount: number) => {
  const factoryCount = playerCount * 2 + 1;
  const factories = [];
  
  for (let i = 0; i < factoryCount; i++) {
    factories.push({
      id: i,
      tiles: []
    });
  }
  
  return factories;
};

export class ClassicAzulEngine implements AzulGameEngine {
  initializeGame = (players: string[]): GameState => {
    const playerCount = players.length;

    if (playerCount < 2 || playerCount > 4) {
      throw new Error("Player count must be between 2 and 4");
    }

    const playerObjs: Player[] = players.map((name, i) =>
      createClassicPlayer(generateId(), name)
    );

    // Create all tiles
    const tiles = createClassicTiles();

    // Shuffle the tiles
    const shuffledTiles = shuffle(tiles);

    // Create factories
    const factories = createClassicFactories(playerCount);

    // Create initial game state
    let gameState: GameState = {
      players: playerObjs,
      factories,
      center: [],
      bag: shuffledTiles,
      discardPile: [],
      currentPlayer: playerObjs[0].id,
      gamePhase: "drafting",
      firstPlayerToken: null,
      roundNumber: 1,
    };

    // Distribute tiles to factories
    gameState = this.distributeFactoryTiles(gameState);

    return gameState;
  };

  distributeFactoryTiles = (gameState: GameState): GameState => {
    // Create a safe deep copy of the state
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    
    // For each factory
    for (const factory of newState.factories) {
      // Clear existing tiles
      factory.tiles = [];
      
      // Add 4 tiles (or as many as available)
      for (let i = 0; i < 4 && newState.bag.length > 0; i++) {
        // Get a random tile from the bag
        const randomIndex = Math.floor(Math.random() * newState.bag.length);
        const tile = newState.bag[randomIndex];
        
        // Add to factory and remove from bag
        factory.tiles.push(tile);
        newState.bag.splice(randomIndex, 1);
      }
    }
    
    return newState;
  };

  canSelectTiles = (
    gameState: GameState,
    factoryId: number | null,
    color: TileColor
  ): boolean => {
    // Check if we're in the drafting phase
    if (gameState.gamePhase !== "drafting") {
      return false;
    }

    if (factoryId !== null) {
      // Selection from a factory
      const factory = gameState.factories.find((f) => f.id === factoryId);
      if (!factory) return false;

      // Check if factory has tiles of the requested color
      return factory.tiles.some((t) => t.color === color);
    } else {
      // Selection from center
      return gameState.center.some((t) => t.color === color);
    }
  };
  canPlaceTiles = (
    gameState: GameState,
    patternLineIndex: number,
    selectedTiles: Tile[]
  ): boolean => {
    // Check if we're in the drafting phase
    if (gameState.gamePhase !== "drafting") {
      return false;
    }

    // Find current player
    const currentPlayer = gameState.players.find(
      (p) => p.id === gameState.currentPlayer
    );
    if (!currentPlayer) return false;

    // Floor line placement is always allowed
    if (patternLineIndex === -1) {
      return true;
    }

    // Validate pattern line index
    if (
      patternLineIndex < 0 ||
      patternLineIndex >= currentPlayer.board.patternLines.length
    ) {
      return false;
    }

    const patternLine = currentPlayer.board.patternLines[patternLineIndex];
    const sampleTile = selectedTiles[0];

    // Empty selection is invalid
    if (!sampleTile) return false;

    // Check if line already has a different color
    if (patternLine.color !== null && patternLine.color !== sampleTile.color) {
      return false;
    }

    // Check if line has space
    if (patternLine.tiles.length >= patternLine.spaces) {
      return false;
    }

    // Check if color already exists in the corresponding wall row
    const wallRow = currentPlayer.board.wall[patternLineIndex];
    const colorAlreadyOnWall = wallRow.some(
      (space) => space.color === sampleTile.color && space.filled
    );

    return !colorAlreadyOnWall;
  };
  mustPlaceInFloorLine = (
    gameState: GameState,
    selectedTiles: Tile[]
  ): boolean => {
    if (selectedTiles.length === 0) return false;

    const currentPlayer = gameState.players.find(
      (p) => p.id === gameState.currentPlayer
    );
    if (!currentPlayer) return false;

    const color = selectedTiles[0].color;

    // Check each pattern line for valid placement options
    for (let i = 0; i < currentPlayer.board.patternLines.length; i++) {
      const line = currentPlayer.board.patternLines[i];

      // Check if line has space and accepts this color
      if (
        line.tiles.length < line.spaces &&
        (line.color === null || line.color === color)
      ) {
        const wallRow = currentPlayer.board.wall[i];
        const colorAlreadyOnWall = wallRow.some(
          (space) => space.color === color && space.filled
        );

        // Found a valid placement option
        if (!colorAlreadyOnWall) {
          return false;
        }
      }
    }

    // No valid pattern lines found - must use floor line
    return true;
  };
  applyMove(
    gameState: GameState,
    move: { patternLineIndex: number; selectedTiles: Tile[] }
  ): GameState {
    // 1. Clonage superficiel de l'état (copy-on-write)
    const newGameState: GameState = {
      ...gameState,
      players: gameState.players.map((p) =>
        p.id === gameState.currentPlayer
          ? { ...p, board: { ...p.board } }
          : p
      ),
      factories: gameState.factories.map((f) => ({ ...f, tiles: [...f.tiles] })),
      center: [...gameState.center],
      bag: [...gameState.bag],
      discardPile: [...gameState.discardPile],
    };

    // 2. Trouver le joueur courant
    const currentPlayer = newGameState.players.find(
      (p) => p.id === newGameState.currentPlayer
    );
    if (!currentPlayer) return gameState;

    // 3. Placement des tuiles
    const { patternLineIndex, selectedTiles } = move;
    if (!selectedTiles || selectedTiles.length === 0) return gameState;

    if (patternLineIndex === -1) {
      // Placer toutes les tuiles dans la ligne de pénalité
      currentPlayer.board.floorLine = [
        ...currentPlayer.board.floorLine,
        ...selectedTiles,
      ];
    } else {
      // Placer dans une ligne de motif
      const patternLine = { ...currentPlayer.board.patternLines[patternLineIndex] };
      const spaceLeft = patternLine.spaces - patternLine.tiles.length;
      const tilesToPlace = selectedTiles.slice(0, spaceLeft);
      const excessTiles = selectedTiles.slice(spaceLeft);

      patternLine.tiles = [...patternLine.tiles, ...tilesToPlace];
      patternLine.color = patternLine.color || tilesToPlace[0]?.color || null;
      currentPlayer.board.patternLines = [
        ...currentPlayer.board.patternLines.slice(0, patternLineIndex),
        patternLine,
        ...currentPlayer.board.patternLines.slice(patternLineIndex + 1),
      ];
      // Les tuiles en trop vont dans la ligne de pénalité
      currentPlayer.board.floorLine = [
        ...currentPlayer.board.floorLine,
        ...excessTiles,
      ];
    }

    // 4. Passage au joueur suivant
    const currentIndex = newGameState.players.findIndex(
      (p) => p.id === currentPlayer.id
    );
    const nextIndex = (currentIndex + 1) % newGameState.players.length;
    newGameState.currentPlayer = newGameState.players[nextIndex].id;

    // 5. (Optionnel) Gestion de la fin de manche, scoring, etc.
    // À faire dans une autre fonction ou ici si tu veux

    return newGameState;
  }
  // --- SCORING ET GESTION DE MANCHE ---

  // Pénalités pour la ligne de sol
  static FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

  // Calcul du score pour le placement d'une tuile sur le mur
  calculateTilePlacementScore(board: PlayerBoard, row: number, col: number): number {
    let horizontalScore = 0;
    let verticalScore = 0;
    // Gauche
    for (let c = col - 1; c >= 0; c--) {
      if (board.wall[row][c].filled) horizontalScore++; else break;
    }
    // Droite
    for (let c = col + 1; c < board.wall[row].length; c++) {
      if (board.wall[row][c].filled) horizontalScore++; else break;
    }
    // Haut
    for (let r = row - 1; r >= 0; r--) {
      if (board.wall[r][col].filled) verticalScore++; else break;
    }
    // Bas
    for (let r = row + 1; r < board.wall.length; r++) {
      if (board.wall[r][col].filled) verticalScore++; else break;
    }
    if (horizontalScore === 0 && verticalScore === 0) return 1;
    let totalScore = 0;
    if (horizontalScore > 0) totalScore += horizontalScore + 1;
    if (verticalScore > 0) totalScore += verticalScore + 1;
    return totalScore;
  }

  // Applique les pénalités de la ligne de sol
  applyFloorPenalties(player: Player): Player {
    const updatedPlayer = { ...player, board: { ...player.board } };
    const floorLineCount = updatedPlayer.board.floorLine.length;
    const penalty = ClassicAzulEngine.FLOOR_PENALTIES.slice(0, floorLineCount).reduce((sum, current) => sum + current, 0);
    updatedPlayer.board.score = Math.max(0, updatedPlayer.board.score + penalty);
    updatedPlayer.board.floorLine = [];
    return updatedPlayer;
  }

  // Transfère les lignes de motif complètes vers le mur et calcule le score
  transferCompletedLinesToWall(player: Player, gameState: GameState): { player: Player, discardedTiles: Tile[] } {
    const updatedPlayer: Player = { ...player, board: { ...player.board, patternLines: player.board.patternLines.map((l) => ({ ...l })), wall: player.board.wall.map((row) => row.map((space) => ({ ...space })) ) } };
    let scoreGained = 0;
    let discardedTiles: Tile[] = [];
    updatedPlayer.board.patternLines.forEach((line, rowIndex) => {
      if (line.tiles.length === line.spaces && line.color) {
        const wallRow = updatedPlayer.board.wall[rowIndex];
        const color = line.color;
        const colIndex = wallRow.findIndex(space => space.color === color);
        if (colIndex !== -1 && !wallRow[colIndex].filled) {
          wallRow[colIndex].filled = true;
          const placementScore = this.calculateTilePlacementScore(updatedPlayer.board, rowIndex, colIndex);
          scoreGained += placementScore;
          const [...extraTiles] = line.tiles;
          discardedTiles = [...discardedTiles, ...extraTiles];
          line.tiles = [];
          line.color = null;
        }
      }
    });
    updatedPlayer.board.score += scoreGained;
    return { player: updatedPlayer, discardedTiles };
  }

  // Calcule les scores de fin de manche pour tous les joueurs
  calculateRoundScores(gameState: GameState): GameState {
    const updatedGameState: GameState = { ...gameState };
    let allDiscardedTiles: Tile[] = [];
    updatedGameState.players = updatedGameState.players.map(player => {
      const { player: updatedPlayer, discardedTiles } = this.transferCompletedLinesToWall(player, updatedGameState);
      allDiscardedTiles = [...allDiscardedTiles, ...discardedTiles];
      const floorTiles = [...updatedPlayer.board.floorLine];
      allDiscardedTiles = [...allDiscardedTiles, ...floorTiles];
      return this.applyFloorPenalties(updatedPlayer);
    });
    updatedGameState.discardPile = [...updatedGameState.discardPile, ...allDiscardedTiles];
    return updatedGameState;
  }

  // Calcule les scores finaux (bonus)
  calculateFinalScores(gameState: GameState): GameState {
    const updatedGameState: GameState = { ...gameState };
    updatedGameState.players = updatedGameState.players.map(player => {
      let bonusScore = 0;
      const wall = player.board.wall;
      // Bonus lignes
      for (let row = 0; row < wall.length; row++) {
        if (wall[row].every(space => space.filled)) bonusScore += 2;
      }
      // Bonus colonnes
      for (let col = 0; col < wall[0].length; col++) {
        if (wall.every(row => row[col].filled)) bonusScore += 7;
      }
      // Bonus couleurs
      const COLOR_COUNT = 5;
      const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
      colors.forEach(color => {
        const colorCount = wall.flat().filter(space => space.color === color && space.filled).length;
        if (colorCount === COLOR_COUNT) bonusScore += 10;
      });
      return { ...player, board: { ...player.board, score: player.board.score + bonusScore } };
    });
    return updatedGameState;
  }

  // Gère la fin de manche et transitions (retourne le nouvel état)
  handleRoundEnd(gameState: GameState): GameState {
    // Si toutes les fabriques et le centre sont vides
    if (gameState.factories.every(f => f.tiles.length === 0) && gameState.center.length === 0) {
      let newState: GameState = { ...gameState };
      newState.gamePhase = "tiling";
      newState = this.calculateRoundScores(newState);
      // Vérifier si le jeu est terminé (une ligne du mur complète)
      const anyWallRowComplete = newState.players.some(p =>
        p.board.wall.some(row => row.every(space => space.filled))
      );
      if (anyWallRowComplete) {
        newState.gamePhase = "gameEnd";
        newState = this.calculateFinalScores(newState);
      } else {
        newState.roundNumber += 1;
        if (newState.firstPlayerToken) {
          newState.currentPlayer = newState.firstPlayerToken;
          newState.firstPlayerToken = null;
        }
        if (newState.bag.length === 0 && newState.discardPile.length > 0) {
          newState.bag = [...newState.discardPile];
          newState.discardPile = [];
          newState.bag = shuffle(newState.bag);
        }
        newState = this.distributeFactoryTiles(newState);
        newState.gamePhase = "drafting";
      }
      return newState;
    }
    return gameState;
  }

  // Calcule le score total du joueur courant (ou d'un joueur donné)
  calculateScore(gameState: GameState): number {
    return calculateClassicScore(gameState);
  }
}
