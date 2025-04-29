import { GameState, Tile, TileColor, Player } from '../../models/types';
import { canSelectTiles, canPlaceTiles, mustPlaceInFloorLine } from '../moves';

/**
 * Difficulty levels for the AI player
 * @typedef {'easy' | 'medium' | 'hard'} AIDifficulty
 */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Interface representing an AI decision
 * @interface
 * @property {number|null} factoryId - ID of the selected factory (null for center)
 * @property {TileColor} color - Selected tile color
 * @property {number} patternLineIndex - Index of the pattern line to place tiles (-1 for floor line)
 */
interface AIDecision {
  factoryId: number | null;
  color: TileColor;
  patternLineIndex: number;
}

/**
 * Gets the best move for the AI player based on game state and difficulty
 * @param {GameState} gameState - Current game state
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {AIDecision} The AI's decision
 * @throws {Error} If current player is not found
 */
export const getAIMove = (gameState: GameState, difficulty: AIDifficulty): AIDecision => {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) {
    throw new Error("Current player not found");
  }

  switch (difficulty) {
    case 'easy':
      return getEasyAIMove(gameState, currentPlayer);
    case 'medium':
      return getMediumAIMove(gameState, currentPlayer);
    case 'hard':
      return getHardAIMove(gameState, currentPlayer);
    default:
      return getEasyAIMove(gameState, currentPlayer);
  }
};

/**
 * Gets a random valid move for easy AI difficulty
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Random valid move
 * @throws {Error} If no valid selections are available
 */
const getEasyAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  // Choose random selection
  const randomSelection = possibleSelections[Math.floor(Math.random() * possibleSelections.length)];
  const selectedTiles = simulateSelection(gameState, randomSelection.factoryId, randomSelection.color);
  const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
  
  // Default to floor line if no valid placements
  if (possiblePlacements.length === 0) {
    return {
      ...randomSelection,
      patternLineIndex: -1
    };
  }
  
  // Choose random placement
  const randomPlacement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
  
  return {
    ...randomSelection,
    patternLineIndex: randomPlacement
  };
};

/**
 * Gets a semi-smart move for medium AI difficulty using basic evaluation
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Best move according to medium difficulty logic
 */
const getMediumAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  let bestMove: AIDecision | null = null;
  let bestScore = -Infinity;
  
  // Evaluate all possible moves
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
      const score = evaluatePlacement(player, lineIndex, selectedTiles, 'medium');
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          ...selection,
          patternLineIndex: lineIndex
        };
      }
    }
  }
  
  // Fallback to easy AI if no good move found
  return bestMove || getEasyAIMove(gameState, player);
};

/**
 * Gets a smart move for hard AI difficulty using advanced evaluation
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Best move according to hard difficulty logic
 */
const getHardAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  let bestMove: AIDecision | null = null;
  let bestScore = -Infinity;
  
  // Evaluate all possible moves with advanced strategy
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
      const score = evaluatePlacement(player, lineIndex, selectedTiles, 'hard');
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          ...selection,
          patternLineIndex: lineIndex
        };
      }
    }
  }
  
  // Fallback to medium AI if no good move found
  return bestMove || getMediumAIMove(gameState, player);
};

/**
 * Gets all possible tile selections from factories and center
 * @param {GameState} gameState - Current game state
 * @returns {Array<{factoryId: number|null, color: TileColor}>} All valid selections
 */
const getAllPossibleSelections = (gameState: GameState): { factoryId: number | null, color: TileColor }[] => {
  const selections: { factoryId: number | null, color: TileColor }[] = [];
  
  // Check factories
  for (const factory of gameState.factories) {
    if (factory.tiles.length === 0) continue;
    
    // Group tiles by color
    const colors = new Set<TileColor>(factory.tiles.map(t => t.color));
    
    colors.forEach(color => {
      if (canSelectTiles(gameState, factory.id, color)) {
        selections.push({ factoryId: factory.id, color });
      }
    });
  }
  
  // Check center
  if (gameState.center.length > 0) {
    const centerColors = new Set<TileColor>(gameState.center.map(t => t.color));
    
    centerColors.forEach(color => {
      if (canSelectTiles(gameState, null, color)) {
        selections.push({ factoryId: null, color });
      }
    });
  }
  
  return selections;
};

/**
 * Simulates tile selection from a factory or center
 * @param {GameState} gameState - Current game state
 * @param {number|null} factoryId - Factory ID or null for center
 * @param {TileColor} color - Color to select
 * @returns {Tile[]} Array of tiles that would be selected
 */
const simulateSelection = (gameState: GameState, factoryId: number | null, color: TileColor): Tile[] => {
  return factoryId !== null
    ? gameState.factories.find(f => f.id === factoryId)?.tiles.filter(t => t.color === color) || []
    : gameState.center.filter(t => t.color === color);
};

/**
 * Gets all possible placement options for selected tiles
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current player
 * @param {Tile[]} selectedTiles - Tiles to be placed
 * @returns {number[]} Array of valid pattern line indices (-1 for floor line)
 */
const getPossiblePlacements = (gameState: GameState, player: Player, selectedTiles: Tile[]): number[] => {
  if (selectedTiles.length === 0) return [];
  
  // Check if floor line is mandatory
  if (mustPlaceInFloorLine(gameState, selectedTiles)) {
    return [-1];
  }
  
  const possiblePlacements: number[] = [];
  
  // Check each pattern line
  for (let i = 0; i < player.board.patternLines.length; i++) {
    if (canPlaceTiles(gameState, i, selectedTiles)) {
      possiblePlacements.push(i);
    }
  }
  
  // Floor line is always an option
  possiblePlacements.push(-1);
  
  return possiblePlacements;
};

/**
 * Evaluates a potential move based on strategy
 * @param {Player} player - Current player
 * @param {number} lineIndex - Pattern line index (-1 for floor line)
 * @param {Tile[]} tiles - Tiles to be placed
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {number} Score representing move quality (higher is better)
 */
const evaluatePlacement = (player: Player, lineIndex: number, tiles: Tile[], difficulty: AIDifficulty): number => {
  // Floor line placement is generally bad
  if (lineIndex === -1) {
    return -10;
  }
  
  const line = player.board.patternLines[lineIndex];
  const tileCount = tiles.length;
  const color = tiles[0].color;
  
  // Base score: progress toward completing the line
  let score = (line.tiles.length + tileCount) / line.spaces * 10;
  
  // Bonus for completing the line
  if (line.tiles.length + tileCount >= line.spaces) {
    score += 15;
    
    // Advanced wall strategy for hard difficulty
    if (difficulty === 'hard') {
      const wallRow = player.board.wall[lineIndex];
      const wallColumn = wallRow.findIndex(space => space.color === color);
      
      if (wallColumn !== -1) {
        // Calculate adjacent tiles for potential bonuses
        const adjacentScore = calculateWallAdjacencyScore(player, lineIndex, wallColumn);
        score += adjacentScore;
        
        // Check for potential row/column/color completion
        score += evaluateWallCompletion(player, lineIndex, wallColumn, color);
      }
    }
  }
  
  // Medium/Hard AI prefers moves that use more tiles
  if (difficulty !== 'easy') {
    score += tileCount * 3;
  }
  
  // Penalty for starting new lines that can't be completed
  if (line.tiles.length === 0 && line.tiles.length + tileCount < line.spaces) {
    score -= 5;
  }
  
  return score;
};

/**
 * Calculates wall adjacency score for a potential tile placement
 * @param {Player} player - Current player
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @returns {number} Adjacency score
 */
const calculateWallAdjacencyScore = (player: Player, row: number, col: number): number => {
  let adjacentHorizontal = 0;
  let adjacentVertical = 0;
  const wall = player.board.wall;
  
  // Count horizontal adjacency
  for (let c = col - 1; c >= 0; c--) {
    if (wall[row][c].filled) adjacentHorizontal++;
    else break;
  }
  for (let c = col + 1; c < wall[row].length; c++) {
    if (wall[row][c].filled) adjacentHorizontal++;
    else break;
  }
  
  // Count vertical adjacency
  for (let r = row - 1; r >= 0; r--) {
    if (wall[r][col].filled) adjacentVertical++;
    else break;
  }
  for (let r = row + 1; r < wall.length; r++) {
    if (wall[r][col].filled) adjacentVertical++;
    else break;
  }
  
  return (adjacentHorizontal + adjacentVertical) * 5;
};

/**
 * Evaluates potential wall completion bonuses
 * @param {Player} player - Current player
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @param {TileColor} color - Tile color being placed
 * @returns {number} Completion bonus score
 */
const evaluateWallCompletion = (player: Player, row: number, col: number, color: TileColor): number => {
  const wall = player.board.wall;
  let bonus = 0;
  
  // Check for row completion (5 tiles)
  if (wall[row].filter(space => space.filled).length === 4) {
    bonus += 10;
  }
  
  // Check for column completion (5 tiles)
  if (wall.filter(row => row[col].filled).length === 4) {
    bonus += 20;
  }
  
  // Check for color completion (5 tiles of same color)
  const sameColorCount = wall.flat().filter(space => space.color === color && space.filled).length;
  if (sameColorCount === 4) {
    bonus += 15;
  }
  
  return bonus;
};