/**
 * Represents the available tile colors in the game
 */
export type TileColor = 'blue' | 'yellow' | 'red' | 'black' | 'teal' | 'green' | 'joker';

/**
 * Represents an individual tile in the game
 */
export interface Tile {
  /** Unique identifier for the tile */
  id: string;
  /** Color of the tile */
  color: TileColor;
}

/**
 * Represents a factory display that holds tiles for drafting
 */
export interface Factory {
  /** Identifier for the factory */
  id: number;
  /** Collection of tiles currently in the factory */
  tiles: Tile[];
}

/**
 * Represents a pattern line on a player's board
 * where tiles are collected before being placed on the wall
 */
export interface PatternLine {
  /** Number of spaces in this pattern line (1-5) */
  spaces: number;
  /** Tiles currently placed in this pattern line */
  tiles: Tile[];
  /** Color of tiles in the pattern line, or null if empty */
  color: TileColor | null;
}

/**
 * Represents a single space on the wall grid
 */
export interface WallSpace {
  /** Row position (0-4) */
  row: number;
  /** Column position (0-4) */
  column: number;
  /** The designated color for this wall space */
  color: TileColor;
  /** Whether a tile has been placed in this space */
  filled: boolean;
}

/**
 * Represents a player's complete board
 */
export interface PlayerBoard {
  /** The 5 pattern lines where players temporarily store tiles */
  patternLines: PatternLine[];
  /** The 5x5 wall grid where tiles are permanently placed */
  wall: WallSpace[][];
  /** Collection of penalty tiles in the floor line */
  floorLine: Tile[];
  /** Current score */
  score: number;
  /** Tuiles récupérées (Summer Pavilion) */
  collectedTiles?: Tile[];
  /** Tuiles placées sur le plateau Summer Pavilion (fleurs) */
  placedTiles?: { color: TileColor; flower: number; pos: number }[];
  /** Tuiles conservées pour la prochaine manche (Summer Pavilion) */
  savedTiles?: Tile[];
}

/**
 * Represents a player in the game
 */
export interface Player {
  /** Unique identifier for the player */
  id: string;
  /** Display name of the player */
  name: string;
  /** The player's game board */
  board: PlayerBoard;
}

/**
 * Represents the complete state of an Azul game
 */
export interface GameState {
  /** All players in the game */
  players: Player[];
  /** All factory displays */
  factories: Factory[];
  /** Tiles in the center of the table */
  center: Tile[];
  /** Tiles remaining in the draw bag */
  bag: Tile[];
  /** Tiles in the discard pile */
  discardPile: Tile[];
  /** ID of the player whose turn it currently is */
  currentPlayer: string;
  /** Current phase of the game */
  gamePhase: 'drafting' | 'tiling' | 'scoring' | 'gameEnd';
  /** ID of the player with the first player token, or null if no one has it */
  firstPlayerToken: string | null;
  /** Current round number */
  roundNumber: number;
  /** Couleur joker courante (Summer Pavilion) */
  jokerColor?: TileColor;
  /** Nombre max de manches (Summer Pavilion) */
  maxRounds?: number;
  /** Flag indicating whether discarded tiles have been moved to the bag */
  discardMovedToBag?: boolean;
}