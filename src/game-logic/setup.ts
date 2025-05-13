import { GameState, Tile, TileColor, WallSpace, PatternLine, PlayerBoard, Player, Factory } from '../models/types';
import { ClassicAzulEngine } from './engines/classicEngine';

/**
 * Generates a random unique identifier
 * @returns {string} A unique string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Creates all tiles for the game
 * @returns {Tile[]} Array containing all game tiles (20 of each color)
 */
export const createTiles = (): Tile[] => {
  const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
  const tiles: Tile[] = [];
  
  // 20 tiles of each color
  colors.forEach(color => {
    for (let i = 0; i < 20; i++) {
      tiles.push({
        id: generateId(),
        color
      });
    }
  });
  
  return tiles;
};

/**
 * Creates an empty player board
 * @returns {PlayerBoard} A new player board with pattern lines, wall, floor line and initial score
 */
export const createPlayerBoard = (): PlayerBoard => {
  // Create pattern lines (1 to 5 spaces)
  const patternLines: PatternLine[] = [];
  for (let i = 0; i < 5; i++) {
    patternLines.push({
      spaces: i + 1,
      tiles: [],
      color: null
    });
  }
  
  // Create wall (5x5)
  const wall: WallSpace[][] = [];
  const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
  
  for (let row = 0; row < 5; row++) {
    const wallRow: WallSpace[] = [];
    // Shift each row to create the wall pattern
    const shiftedColors = [...colors.slice(row), ...colors.slice(0, row)];
    
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

/**
 * Creates a new player with an empty board
 * @param {string} id - The player's unique ID
 * @param {string} name - The player's name
 * @returns {Player} A new player object
 */
export const createPlayer = (id: string, name: string): Player => {
  return {
    id,
    name,
    board: createPlayerBoard()
  };
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @template T - The type of elements in the array
 * @param {T[]} array - The array to shuffle
 * @returns {T[]} A new shuffled array
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Creates factory displays based on player count
 * @param {number} playerCount - Number of players in the game
 * @returns {Factory[]} Array of factory displays
 */
export const createFactories = (playerCount: number): Factory[] => {
  const factoryCount = 2 * playerCount + 1;
  const factories: Factory[] = [];
  
  for (let i = 0; i < factoryCount; i++) {
    factories.push({
      id: i,
      tiles: []
    });
  }
  
  return factories;
};

/**
 * Distributes tiles from the bag to all factory displays
 * @param {GameState} gameState - Current game state
 * @returns {GameState} Updated game state with filled factories
 */
export const distributeFactoryTiles = (gameState: GameState): GameState => {
  // Create a deep copy to avoid reference issues
  const newGameState = JSON.parse(JSON.stringify(gameState));
  const tilesPerFactory = 4;
  
  // For each factory, take 4 tiles from the bag
  newGameState.factories.forEach((factory: Factory) => {
    if (newGameState.bag.length === 0) {
      // If the bag is empty, refill it with the discard pile
      newGameState.bag = [...newGameState.bag, ...newGameState.discardPile];
      newGameState.discardPile = []; 
      
      // Shuffle the bag
      newGameState.bag = shuffle(newGameState.bag);
    }
    
    // Take 4 tiles for the factory (or maximum available)
    const tilesToTake = Math.min(tilesPerFactory, newGameState.bag.length);
    const factoryTiles = newGameState.bag.splice(0, tilesToTake);
    factory.tiles = factoryTiles;
  });
  
  return newGameState;
};

/**
 * Initialise une partie avec le moteur Azul classique
 * @param {number} playerCount - Nombre de joueurs
 * @returns {GameState} L'état initial du jeu
 */
export const initializeGame = (playerCount: number): GameState => {
  const engine = new ClassicAzulEngine();
  // Génère des noms génériques (Joueur 1, Joueur 2, ...)
  const playerNames = Array.from({ length: playerCount }, (_, i) => `Joueur ${i + 1}`);
  return engine.initializeGame(playerNames);
};