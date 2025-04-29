import { GameState, Tile, TileColor } from '../models/types';

/**
 * Checks if tiles of a specific color can be selected from a factory or the center
 * @param {GameState} gameState - Current game state
 * @param {number|null} factoryId - ID of the factory (null for center)
 * @param {TileColor} color - Color to be selected
 * @returns {boolean} True if selection is valid, false otherwise
 */
export const canSelectTiles = (gameState: GameState, factoryId: number | null, color: TileColor): boolean => {
  // Check if we're in the drafting phase
  if (gameState.gamePhase !== 'drafting') {
    return false;
  }
  
  if (factoryId !== null) {
    // Selection from a factory
    const factory = gameState.factories.find(f => f.id === factoryId);
    if (!factory) return false;
    
    // Check if factory has tiles of the requested color
    return factory.tiles.some(t => t.color === color);
  } else {
    // Selection from center
    return gameState.center.some(t => t.color === color);
  }
};

/**
 * Checks if selected tiles can be placed on a specific pattern line
 * @param {GameState} gameState - Current game state
 * @param {number} patternLineIndex - Index of the pattern line (-1 for floor line)
 * @param {Tile[]} selectedTiles - Tiles to be placed
 * @returns {boolean} True if placement is valid, false otherwise
 */
export const canPlaceTiles = (gameState: GameState, patternLineIndex: number, selectedTiles: Tile[]): boolean => {
  // Check if we're in the drafting phase
  if (gameState.gamePhase !== 'drafting') {
    return false;
  }
  
  // Find current player
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return false;
  
  // Floor line placement is always allowed
  if (patternLineIndex === -1) {
    return true;
  }
  
  // Validate pattern line index
  if (patternLineIndex < 0 || patternLineIndex >= currentPlayer.board.patternLines.length) {
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
    space => space.color === sampleTile.color && space.filled
  );
  
  return !colorAlreadyOnWall;
};

/**
 * Determines if tiles must be placed in the floor line due to no valid pattern line options
 * @param {GameState} gameState - Current game state
 * @param {Tile[]} selectedTiles - Tiles to be placed
 * @returns {boolean} True if tiles must go to floor line, false otherwise
 */
export const mustPlaceInFloorLine = (gameState: GameState, selectedTiles: Tile[]): boolean => {
  if (selectedTiles.length === 0) return false;
  
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return false;
  
  const color = selectedTiles[0].color;
  
  // Check each pattern line for valid placement options
  for (let i = 0; i < currentPlayer.board.patternLines.length; i++) {
    const line = currentPlayer.board.patternLines[i];
    
    // Check if line has space and accepts this color
    if (line.tiles.length < line.spaces && 
        (line.color === null || line.color === color)) {
      
      const wallRow = currentPlayer.board.wall[i];
      const colorAlreadyOnWall = wallRow.some(
        space => space.color === color && space.filled
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