import { GameState, Tile, TileColor, WallSpace, PatternLine, PlayerBoard, Player, Factory } from '../models/types';
import { ENGINES } from './engines';

/**
 * Generates a random unique identifier
 * @returns {string} A unique string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Creates all tiles for the game
 * @returns {Tile[]} Array containing all game tiles (20 of each color)
 */
export const createTiles = (): Tile[] => {
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
  const wallColorPattern: TileColor[][] = [
    ['blue', 'yellow', 'red', 'black', 'teal'],
    ['teal', 'blue', 'yellow', 'red', 'black'],
    ['black', 'teal', 'blue', 'yellow', 'red'],
    ['red', 'black', 'teal', 'blue', 'yellow'],
    ['yellow', 'red', 'black', 'teal', 'blue']
  ];
  
  const wall: WallSpace[][] = [];
  for (let row = 0; row < 5; row++) {
    const wallRow: WallSpace[] = [];
    // Shift each row to create the wall pattern
    const shiftedColors = [...wallColorPattern[row], ...wallColorPattern[row].slice(0, row)];
    
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
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

/**
 * Creates factory displays based on player count
 * @param {number} playerCount - Number of players in the game
 * @returns {Factory[]} Array of factory displays
 */
export const createFactories = (playerCount: number): Factory[] => {
  const factoryCount = playerCount * 2 + 1;
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

/**
 * Initialise une partie avec le moteur Azul choisi
 * @param {number} playerCount - Nombre de joueurs
 * @param {string} variant - Variante de jeu ('classic' ou 'summer')
 * @returns {GameState} L'état initial du jeu
 */
export const initializeGame = (playerCount: number, variant: string = 'classic'): GameState => {
  // Choisir le bon moteur selon la variante
  const engines: Record<string, any> = ENGINES;
  const EngineClass = engines[variant];
  
  if (!EngineClass) {
    console.error(`Moteur non trouvé pour la variante: ${variant}. Utilisation du moteur classique.`);
    // Utiliser le moteur classique par défaut, mais sans y accéder directement
    const defaultEngine = engines['classic'];
    if (!defaultEngine) {
      throw new Error("Moteur classique non disponible");
    }
    const engine = new defaultEngine();
    // Génère des noms génériques (Joueur 1, Joueur 2, ...)
    const playerNames = Array.from({ length: playerCount }, (_, i) => `Joueur ${i + 1}`);
    return engine.initializeGame(playerNames);
  }
  
  const engine = new EngineClass();
  // Génère des noms génériques (Joueur 1, Joueur 2, ...)
  const playerNames = Array.from({ length: playerCount }, (_, i) => `Joueur ${i + 1}`);
  return engine.initializeGame(playerNames);
};