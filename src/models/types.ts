// src/models/types.ts

// Définition des types de tuiles
export type TileColor = 'blue' | 'yellow' | 'red' | 'black' | 'teal';

// Interface pour une tuile individuelle
export interface Tile {
  id: string;
  color: TileColor;
}

// Interface pour une fabrique contenant des tuiles
export interface Factory {
  id: number;
  tiles: Tile[];
}

// Interface pour une ligne de motif sur le plateau d'un joueur
export interface PatternLine {
  spaces: number;
  tiles: Tile[];
  color: TileColor | null;
}

// Interface pour un emplacement sur le mur
export interface WallSpace {
  row: number;
  column: number;
  color: TileColor;
  filled: boolean;
}

// Interface pour le plateau complet d'un joueur
export interface PlayerBoard {
  patternLines: PatternLine[];
  wall: WallSpace[][];
  floorLine: Tile[];
  score: number;
}

// Interface pour un joueur
export interface Player {
  id: string;
  name: string;
  board: PlayerBoard;
}

// Interface pour l'état complet du jeu
export interface GameState {
  players: Player[];
  factories: Factory[];
  center: Tile[];
  bag: Tile[];
  discardPile: Tile[];
  currentPlayer: string;
  gamePhase: 'drafting' | 'tiling' | 'scoring' | 'gameEnd';
  firstPlayerToken: string | null;
  roundNumber: number;
}