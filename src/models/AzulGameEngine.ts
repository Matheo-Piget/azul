import { GameState, TileColor, Tile } from './types';

export interface AzulGameEngine {
  initializeGame(players: string[]): GameState;
  canSelectTiles(gameState: GameState, factoryId: number | null, color: TileColor): boolean;
  canPlaceTiles(gameState: GameState, patternLineIndex: number, selectedTiles: Tile[]): boolean;
  mustPlaceInFloorLine(gameState: GameState, selectedTiles: Tile[]): boolean;
  applyMove(gameState: GameState, move: any): GameState; // à typer selon tes besoins
  calculateScore(gameState: GameState): number;
  // ... autres méthodes utiles
}
