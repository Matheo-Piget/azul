import { GameState, TileColor, Tile } from '../../models/types';
import { canSelectTiles, canPlaceTiles, mustPlaceInFloorLine } from '../moves';
import { calculateTilePlacementScore } from '../scoring';

/**
 * Represents the difficulty levels for AI players
 */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Represents a move that the AI can make
 */
interface AIMove {
  /** The factory to select tiles from (null for center) */
  factoryId: number | null;
  /** The color of tiles to select */
  color: TileColor;
  /** The pattern line to place tiles in (-1 for floor line) */
  patternLineIndex: number;
  /** The score for this move based on AI's evaluation */
  score: number;
}

// Cache for wall position scoring
const scoreCache = new Map<string, number>();

/**
 * Gets the best move for the AI player based on the current game state and difficulty level
 * @param {GameState} gameState - Current game state
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {AIMove} The selected move
 */
export const getAIMove = (gameState: GameState, difficulty: AIDifficulty): AIMove => {
  // Clear cache at the start of each AI decision to prevent memory leaks
  scoreCache.clear();
  
  // Get all possible moves
  const possibleMoves = getAllPossibleMoves(gameState);
  
  // Return early if no valid moves are available
  if (possibleMoves.length === 0) {
    throw new Error('No valid moves available');
  }
  
  // Score the moves based on difficulty level - use map directly instead of creating new objects
  for (const move of possibleMoves) {
    move.score = evaluateMove(gameState, move, difficulty);
  }
  
  // Sort moves by score - in-place sort for better performance
  possibleMoves.sort((a, b) => b.score - a.score);
  
  // Add randomness based on difficulty
  let selectedMove: AIMove;
  
  switch (difficulty) {
    case 'easy':
      // Easy: Choose randomly from top 60% of moves
      selectedMove = chooseRandomlyFromTop(possibleMoves, 0.6);
      break;
      
    case 'medium':
      // Medium: Choose randomly from top 30% of moves
      selectedMove = chooseRandomlyFromTop(possibleMoves, 0.3);
      break;
      
    case 'hard':
      // Hard: Choose the best move most of the time, with small chance of suboptimal move
      if (Math.random() < 0.9) {
        selectedMove = possibleMoves[0];
      } else {
        // Only slice if there's more than one possible move
        const suboptimalMoves = possibleMoves.length > 1 ? possibleMoves.slice(1) : possibleMoves;
        selectedMove = chooseRandomlyFromTop(suboptimalMoves, 0.3);
      }
      break;
      
    default:
      // Default to medium
      selectedMove = chooseRandomlyFromTop(possibleMoves, 0.3);
  }
  
  return selectedMove;
};

/**
 * Gets all possible tile selections and placements for the current player
 * @param {GameState} gameState - Current game state
 * @returns {AIMove[]} Array of all possible moves
 */
const getAllPossibleMoves = (gameState: GameState): AIMove[] => {
  const moves: AIMove[] = [];
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  
  if (!currentPlayer) return moves;
  
  // Find all possible tile selections (from factories and center)
  const selections = getPossibleSelections(gameState);
  
  // Pre-calculate pattern line placements for better performance
  const patternLinePlacementCache = new Map<TileColor, number[]>();
  
  // For each selection, determine possible placements
  for (const selection of selections) {
    const { factoryId, color } = selection;
    
    // Get count of tiles that would be selected (instead of copying tile objects)
    let selectedTileCount = 0;
    
    if (factoryId !== null) {
      // From factory
      const factory = gameState.factories.find(f => f.id === factoryId);
      if (factory) {
        selectedTileCount = factory.tiles.filter(t => t.color === color).length;
      }
    } else {
      // From center
      selectedTileCount = gameState.center.filter(t => t.color === color).length;
    }
    
    // If no tiles would be selected, skip this selection
    if (selectedTileCount === 0) continue;
    
    // Use cached pattern line placements if available, otherwise calculate
    let validPlacements: number[];
    if (patternLinePlacementCache.has(color)) {
      validPlacements = patternLinePlacementCache.get(color)!;
    } else {
      validPlacements = [];
      
      // Create a mock array of tiles for checking placement validity
      const mockTiles: Tile[] = Array(selectedTileCount).fill({
        id: 'mock',
        color: color
      });
      
      // Check each pattern line
      for (let i = 0; i < currentPlayer.board.patternLines.length; i++) {
        if (canPlaceTiles(gameState, i, mockTiles)) {
          validPlacements.push(i);
        }
      }
      
      // Cache the result
      patternLinePlacementCache.set(color, validPlacements);
    }
    
    // Floor line is always valid
    validPlacements.push(-1);
    
    // Create a move for each valid placement
    for (const lineIndex of validPlacements) {
      moves.push({
        factoryId,
        color,
        patternLineIndex: lineIndex,
        score: 0 // Will be evaluated later
      });
    }
  }
  
  return moves;
};

/**
 * Gets all possible tile selections from factories and center
 * @param {GameState} gameState - Current game state
 * @returns {Array<{factoryId: number | null, color: TileColor}>} Possible selections
 */
const getPossibleSelections = (
  gameState: GameState
): Array<{factoryId: number | null, color: TileColor}> => {
  const selections: Array<{factoryId: number | null, color: TileColor}> = [];
  
  // Check factories
  for (const factory of gameState.factories) {
    // Get unique colors in this factory using Set for better performance
    const colors = new Set<TileColor>();
    for (const tile of factory.tiles) {
      colors.add(tile.color);
    }
    
    // Add a selection for each color in this factory
    for (const color of Array.from(colors)) {
      if (canSelectTiles(gameState, factory.id, color)) {
        selections.push({ factoryId: factory.id, color });
      }
    }
  }
  
  // Check center - avoid recreating Set if center is empty
  if (gameState.center.length > 0) {
    const centerColors = new Set<TileColor>();
    for (const tile of gameState.center) {
      centerColors.add(tile.color);
    }
    
    for (const color of Array.from(centerColors)) {
      if (canSelectTiles(gameState, null, color)) {
        selections.push({ factoryId: null, color });
      }
    }
  }
  
  return selections;
};

/**
 * Count tiles of a specific color in a collection
 * @param tiles - The collection of tiles
 * @param color - The color to count
 * @returns The number of tiles of the specified color
 */
const countTilesByColor = (tiles: Tile[], color: TileColor): number => {
  let count = 0;
  for (const tile of tiles) {
    if (tile.color === color) {
      count++;
    }
  }
  return count;
};

/**
 * Evaluates the desirability of a move based on AI difficulty
 * @param {GameState} gameState - Current game state
 * @param {AIMove} move - The move to evaluate
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {number} A score representing the move's desirability
 */
const evaluateMove = (gameState: GameState, move: AIMove, difficulty: AIDifficulty): number => {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return -1000;
  
  let score = 0;
  let selectedTileCount = 0;
  
  // Count the tiles that would be selected instead of creating arrays
  if (move.factoryId !== null) {
    const factory = gameState.factories.find(f => f.id === move.factoryId);
    if (factory) {
      selectedTileCount = countTilesByColor(factory.tiles, move.color);
    }
  } else {
    selectedTileCount = countTilesByColor(gameState.center, move.color);
    
    // Penalty for taking the first player token (only matters for medium and hard)
    if (gameState.firstPlayerToken === null && difficulty !== 'easy') {
      score -= 2;
    }
  }
  
  // Base score is the number of tiles we get
  score += selectedTileCount;
  
  // Floor line placement is generally bad
  if (move.patternLineIndex === -1) {
    const floorPenalties = [-1, -1, -2, -2, -2, -3, -3];
    const newFloorLineSize = currentPlayer.board.floorLine.length + selectedTileCount;
    
    // Calculate penalty based on how full floor line would be
    let penalty = 0;
    for (let i = currentPlayer.board.floorLine.length; i < Math.min(newFloorLineSize, floorPenalties.length); i++) {
      penalty += floorPenalties[i];
    }
    
    score += penalty;
    
    // Create a mock array for checking if we must place in floor line
    const mockTiles: Tile[] = Array(selectedTileCount).fill({
      id: 'mock',
      color: move.color
    });
    
    // If this is our only option, it's better than nothing
    if (mustPlaceInFloorLine(gameState, mockTiles)) {
      score += 3; // Offset the penalty a bit since we have no choice
    }
  } else {
    const patternLine = currentPlayer.board.patternLines[move.patternLineIndex];
    
    // Bonus for completing a pattern line
    const wouldComplete = patternLine.tiles.length + selectedTileCount >= patternLine.spaces;
    
    if (wouldComplete) {
      // Find the wall position for this color
      const wallRow = currentPlayer.board.wall[move.patternLineIndex];
      const wallCol = wallRow.findIndex(space => space.color === move.color);
      
      // Estimate the score from placing this tile
      if (wallCol !== -1) {
        // Check cache first for this position
        const cacheKey = `${move.patternLineIndex}-${wallCol}`;
        let potentialScore: number;
        
        if (scoreCache.has(cacheKey)) {
          potentialScore = scoreCache.get(cacheKey)!;
        } else {
          potentialScore = estimatePlacementScore(currentPlayer.board, move.patternLineIndex, wallCol);
          scoreCache.set(cacheKey, potentialScore);
        }
        
        score += potentialScore;
        
        // Higher difficulty AIs value wall placement strategies more
        if (difficulty === 'medium' || difficulty === 'hard') {
          // Bonus for creating rows - use cached count
          const rowFillCount = wallRow.filter(space => space.filled).length;
          score += rowFillCount * 0.5;
          
          // Bonus for creating columns - use direct access instead of filtering
          let columnFillCount = 0;
          for (let row = 0; row < 5; row++) {
            if (currentPlayer.board.wall[row][wallCol].filled) {
              columnFillCount++;
            }
          }
          score += columnFillCount * 0.5;
          
          // Hard AI also considers color completion
          if (difficulty === 'hard') {
            // Count how many of this color are already on the wall - use direct access for better performance
            let colorCount = 0;
            for (let row = 0; row < 5; row++) {
              for (let col = 0; col < 5; col++) {
                const space = currentPlayer.board.wall[row][col];
                if (space.color === move.color && space.filled) {
                  colorCount++;
                }
              }
            }
            score += colorCount * 0.5;
          }
        }
      }
    } else {
      // Partial filling - prioritize higher rows that are closer to completion
      const spacesLeft = patternLine.spaces - patternLine.tiles.length;
      const fillPercentage = selectedTileCount / spacesLeft;
      
      // Scale bonus based on row size (higher rows score more)
      const rowSizeBonus = (5 - move.patternLineIndex) / 2;
      
      score += fillPercentage * rowSizeBonus;
      
      // Medium and hard AIs prioritize efficiently using tiles
      if (difficulty !== 'easy') {
        // Prefer moves where we use most of our selected tiles effectively
        if (selectedTileCount <= spacesLeft) {
          score += 1;
        }
      }
    }
  }
  
  return score;
};

/**
 * Estimates the score that would be gained from placing a tile at the given wall position
 * Using a lightweight simulation instead of deep cloning the entire board
 * @param {PlayerBoard} board - Player's board
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @returns {number} Estimated placement score
 */
const estimatePlacementScore = (board: any, row: number, col: number): number => {
  // Instead of deep cloning, we'll temporarily modify the board and restore later
  const wasFilledBefore = board.wall[row][col].filled;
  board.wall[row][col].filled = true;
  
  // Use the game's scoring function
  const score = calculateTilePlacementScore(board, row, col);
  
  // Restore the original state
  board.wall[row][col].filled = wasFilledBefore;
  
  return score;
};

/**
 * Chooses a move randomly from the top percentage of scored moves
 * @param {AIMove[]} moves - Scored moves sorted by score (descending)
 * @param {number} topPercentage - Percentage of top moves to consider (0-1)
 * @returns {AIMove} A randomly chosen move from the top moves
 */
const chooseRandomlyFromTop = (moves: AIMove[], topPercentage: number): AIMove => {
  if (moves.length === 0) {
    throw new Error('No moves available');
  }
  
  const cutoff = Math.max(1, Math.floor(moves.length * topPercentage));
  // Avoid slicing when possible
  const randomIndex = Math.floor(Math.random() * cutoff);
  return moves[randomIndex];
};