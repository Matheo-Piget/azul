import { GameState, Tile, TileColor, WallSpace, PatternLine, PlayerBoard, Player, Factory } from '../models/types';

// Générer un ID unique
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Créer toutes les tuiles du jeu
const createTiles = (): Tile[] => {
  const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
  const tiles: Tile[] = [];
  
  // 20 tuiles de chaque couleur
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

// Créer un plateau de joueur vide
const createPlayerBoard = (): PlayerBoard => {
  // Créer les lignes de motif (1 à 5 espaces)
  const patternLines: PatternLine[] = [];
  for (let i = 0; i < 5; i++) {
    patternLines.push({
      spaces: i + 1,
      tiles: [],
      color: null
    });
  }
  
  // Créer le mur (5x5)
  const wall: WallSpace[][] = [];
  const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
  
  for (let row = 0; row < 5; row++) {
    const wallRow: WallSpace[] = [];
    // Décaler chaque ligne pour créer le motif du mur
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

// Créer un joueur
const createPlayer = (id: string, name: string): Player => {
  return {
    id,
    name,
    board: createPlayerBoard()
  };
};

// Mélanger un tableau (pour les tuiles)
const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// Créer les fabriques
const createFactories = (playerCount: number): Factory[] => {
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

// Distribuer les tuiles aux fabriques
export const distributeFactoryTiles = (gameState: GameState): GameState => {
  const newGameState = { ...gameState };
  const tilesPerFactory = 4;
  
  // Pour chaque fabrique, prendre 4 tuiles du sac
  newGameState.factories.forEach(factory => {
    if (newGameState.bag.length < tilesPerFactory) {
      // Si le sac est vide, remplir avec la défausse
      newGameState.bag = [...newGameState.bag, ...newGameState.discardPile];
      newGameState.discardPile = [];
      
      // Mélanger le sac
      newGameState.bag = shuffle(newGameState.bag);
    }
    
    // Prendre 4 tuiles pour la fabrique
    const factoryTiles = newGameState.bag.splice(0, tilesPerFactory);
    factory.tiles = factoryTiles;
  });
  
  return newGameState;
};

// Fonction principale exportée
export const initializeGame = (playerCount: number): GameState => {
  // Créer les joueurs
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createPlayer(generateId(), `Joueur ${i + 1}`));
  }
  
  // Créer toutes les tuiles
  const tiles = createTiles();
  
  // Mélanger les tuiles
  const shuffledTiles = shuffle(tiles);
  
  // Créer les fabriques
  const factories = createFactories(playerCount);
  
  // Créer l'état initial du jeu
  let gameState: GameState = {
    players,
    factories,
    center: [],
    bag: shuffledTiles,
    discardPile: [],
    currentPlayer: players[0].id,
    gamePhase: 'drafting',
    firstPlayerToken: null,
    roundNumber: 1
  };
  
  // Distribuer les tuiles aux fabriques
  gameState = distributeFactoryTiles(gameState);
  
  return gameState;
};