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
class ScoreCache {
  private static MAX_SIZE = 1000;
  private static cache = new Map<string, number>();
  private static accessCount = new Map<string, number>();

  static get(key: string): number | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    }
    return value;
  }

  static set(key: string, value: number): void {
    if (this.cache.size >= this.MAX_SIZE) {
      // Éviction LRU-like
      const entries = Array.from(this.accessCount.entries());
      entries.sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < Math.floor(this.MAX_SIZE * 0.1); i++) {
        this.cache.delete(entries[i][0]);
        this.accessCount.delete(entries[i][0]);
      }
    }
    this.cache.set(key, value);
    this.accessCount.set(key, 0);
  }

  static clear(): void {
    this.cache.clear();
    this.accessCount.clear();
  }
}

/**
 * Gets the best move for the AI player based on the current game state and difficulty level
 * @param {GameState} gameState - Current game state
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {AIMove} The selected move
 */
export const getAIMove = (gameState: GameState, difficulty: AIDifficulty): AIMove => {
  // Clear cache at the start of each AI decision to prevent memory leaks
  ScoreCache.clear();
  
  // Get all possible moves
  const possibleMoves = getAllPossibleMoves(gameState);
  
  // Return early if no valid moves are available
  if (possibleMoves.length === 0) {
    throw new Error('No valid moves available');
  }
  
  // Score the moves based on difficulty level
  for (const move of possibleMoves) {
    move.score = evaluateMove(gameState, move, difficulty);
  }
  
  // Sort moves by score - in-place sort for better performance
  possibleMoves.sort((a, b) => b.score - a.score);
  
  // Select move based on difficulty with improved strategy
  let selectedMove: AIMove | undefined;
  
  switch (difficulty) {
    case 'easy':
      // Easy: Sometimes make random moves, sometimes choose from top portion
      if (Math.random() < 0.3) {
        // 30% chance of completely random move
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else {
        // 70% chance of choosing from top 70% of moves
        selectedMove = chooseRandomlyFromTop(possibleMoves, 0.7);
      }
      break;
      
    case 'medium':
      // Medium: Mostly strategic, occasionally suboptimal
      if (Math.random() < 0.7) {
        // 70% chance of choosing from top 40% of moves
        selectedMove = chooseRandomlyFromTop(possibleMoves, 0.4);
      } else {
        // 30% chance of choosing from middle portion (40-80%)
        const midMoves = possibleMoves.slice(
          Math.floor(possibleMoves.length * 0.4),
          Math.floor(possibleMoves.length * 0.8)
        );
        selectedMove = midMoves[Math.floor(Math.random() * midMoves.length)] || possibleMoves[0];
      }
      break;
      
    case 'hard':
      // Hard: Strategic with occasional exploration
      if (Math.random() < 0.8) {


        // 80% chance of choosing from top 20% of moves
        const topIndex = Math.max(1, Math.floor(possibleMoves.length * 0.2));
        const topMoves = possibleMoves.slice(0, topIndex);
        
        // Calculate weighted probabilities based on scores
        const totalScore = topMoves.reduce((sum, move) => sum + Math.max(0.1, move.score), 0);
        const probabilities = topMoves.map(move => Math.max(0.1, move.score) / totalScore);
        
        // Choose based on weighted probability
        const randomValue = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < topMoves.length; i++) {
          cumulativeProbability += probabilities[i];
          if (randomValue <= cumulativeProbability) {
            selectedMove = topMoves[i];
            break;
          }
        }
        
        // Fallback
        if (!selectedMove) selectedMove = topMoves[0];
      } else {
        // 20% chance of choosing a more exploratory move from top 50%
        selectedMove = chooseRandomlyFromTop(possibleMoves, 0.5);
      }
      break;
      
    default:
      // Default to medium
      selectedMove = chooseRandomlyFromTop(possibleMoves, 0.4);
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
  for (let i = 0, len = tiles.length; i < len; i++) {
    if (tiles[i].color === color) count++;
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
  
  // Count the tiles that would be selected
  if (move.factoryId !== null) {
    const factory = gameState.factories.find(f => f.id === move.factoryId);
    if (factory) {
      selectedTileCount = countTilesByColor(factory.tiles, move.color);
    }
  } else {
    selectedTileCount = countTilesByColor(gameState.center, move.color);
    
    // Increase penalty for first player token based on difficulty
    if (gameState.firstPlayerToken === null) {
      if (difficulty === 'easy') {
        score -= 1;
      } else if (difficulty === 'medium') {
        score -= 3;
      } else { // hard
        score -= 5;
      }
    }
  }
  
  // Base score is the number of tiles we get, but weighted by difficulty
  score += selectedTileCount * (difficulty === 'hard' ? 0.8 : 1);
  
  // Floor line placement evaluation
  if (move.patternLineIndex === -1) {
    const floorPenalties = [-1, -1, -2, -2, -2, -3, -3];
    const newFloorLineSize = currentPlayer.board.floorLine.length + selectedTileCount;
    
    // Calculate penalty based on how full floor line would be - increase for harder AIs
    let penalty = 0;
    const penaltyMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'medium' ? 1 : 1.5;
    
    for (let i = currentPlayer.board.floorLine.length; i < Math.min(newFloorLineSize, floorPenalties.length); i++) {
      penalty += floorPenalties[i] * penaltyMultiplier;
    }
    
    score += penalty;
    
    // Create a mock array for checking if we must place in floor line
    const mockTiles: Tile[] = Array(selectedTileCount).fill({
      id: 'mock',
      color: move.color
    });
    
    // If this is our only option, it's better than nothing
    if (mustPlaceInFloorLine(gameState, mockTiles)) {
      score += difficulty === 'hard' ? 2 : difficulty === 'medium' ? 3 : 4; // Better offset for easier AIs
    }
  } else {
    // Pattern line placement evaluation with difficulty-based strategy
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
        
        if (ScoreCache.get(cacheKey)) {
          potentialScore = ScoreCache.get(cacheKey)!;
        } else {
          potentialScore = estimatePlacementScore(currentPlayer.board, move.patternLineIndex, wallCol);
          ScoreCache.set(cacheKey, potentialScore);
        }
        
        // Apply difficulty-based scoring
        score += potentialScore * (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.2 : 1.5);
        
        // Add wall strategy evaluation with proper difficulty scaling
        score += evaluateWallStrategy(currentPlayer.board, move.patternLineIndex, wallCol, move.color, difficulty);
        
        // Strategic positioning
        if (difficulty !== 'easy') {
          // Bonus for creating rows - use cached count
          const rowFillCount = wallRow.filter(space => space.filled).length;
          score += rowFillCount * (difficulty === 'medium' ? 0.7 : 1.2);
          
          // Bonus for creating columns
          let columnFillCount = 0;
          for (let row = 0; row < 5; row++) {
            if (currentPlayer.board.wall[row][wallCol].filled) {
              columnFillCount++;
            }
          }
          score += columnFillCount * (difficulty === 'medium' ? 0.7 : 1.2);
          
          // Hard AI also considers color completion more heavily
          if (difficulty === 'hard') {
            let colorCount = 0;
            for (let row = 0; row < 5; row++) {
              for (let col = 0; col < 5; col++) {
                const space = currentPlayer.board.wall[row][col];
                if (space.color === move.color && space.filled) {
                  colorCount++;
                }
              }
            }
            score += colorCount * 0.8;
          }
        }
      }
    } else {
      // Partial filling strategy based on difficulty
      const spacesLeft = patternLine.spaces - patternLine.tiles.length;
      const fillPercentage = selectedTileCount / spacesLeft;
      
      // Scale bonus based on row size and difficulty
      const rowSizeBonus = (5 - move.patternLineIndex) / (difficulty === 'easy' ? 3 : difficulty === 'medium' ? 2 : 1.5);
      
      score += fillPercentage * rowSizeBonus;
      
      // Efficient tile usage bonus scaled by difficulty
      if (difficulty !== 'easy') {
        // Prefer moves where we use most of our selected tiles effectively
        if (selectedTileCount <= spacesLeft) {
          score += difficulty === 'medium' ? 1 : 1.5;
        } else {
          // Penalize wasting tiles (harder AIs care more)
          score -= (selectedTileCount - spacesLeft) * (difficulty === 'medium' ? 0.5 : 1);
        }
      }
    }
  }
  
  return score;
};

/**
 * Evaluates the wall strategy for a given move
 * @param {PlayerBoard} board - Player's board
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @param {TileColor} color - Color of the tile being placed
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {number} Score for the wall strategy
 */
const evaluateWallStrategy = (board: any, row: number, col: number, color: TileColor, difficulty: AIDifficulty): number => {
  let strategyScore = 0;
  
  // Base multiplier for all strategies based on difficulty
  const difficultyMultiplier = difficulty === 'easy' ? 0.5 : difficulty === 'medium' ? 1 : 2;
  
  // Row completion strategy
  let filledInRow = 0;
  for (let c = 0; c < 5; c++) {
    if (board.wall[row][c].filled) {
      filledInRow++;
    }
  }
  
  // Progressive bonus based on how close to completion the row is
  if (filledInRow === 4) {
    strategyScore += 8 * difficultyMultiplier; // One away from completing
  } else if (filledInRow === 3) {
    strategyScore += 4 * difficultyMultiplier; // Two away from completing
  } else if (filledInRow > 0) {
    strategyScore += filledInRow * difficultyMultiplier * 0.5;
  }
  
  // Column completion strategy
  let filledInColumn = 0;
  for (let r = 0; r < 5; r++) {
    if (board.wall[r][col].filled) {
      filledInColumn++;
    }
  }
  
  // Progressive bonus based on how close to completion the column is
  if (filledInColumn === 4) {
    strategyScore += 8 * difficultyMultiplier;
  } else if (filledInColumn === 3) {
    strategyScore += 4 * difficultyMultiplier;
  } else if (filledInColumn > 0) {
    strategyScore += filledInColumn * difficultyMultiplier * 0.5;
  }
  
  // Color completion strategy (more important for harder AIs)
  if (difficulty !== 'easy') {
    let colorCount = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (board.wall[r][c].color === color && board.wall[r][c].filled) {
          colorCount++;
        }
      }
    }
    
    // Progressive bonus based on how close to completing the color set
    if (colorCount === 4) {
      strategyScore += 10 * (difficulty === 'hard' ? 1.5 : 1);
    } else if (colorCount === 3) {
      strategyScore += 5 * (difficulty === 'hard' ? 1.5 : 1);
    } else if (colorCount > 0) {
      strategyScore += colorCount * (difficulty === 'hard' ? 1.5 : 1);
    }
  }
  
  // Adjacency bonus for hard AI (values connected tiles)
  if (difficulty === 'hard') {
    let adjacentCount = 0;
    
    // Check adjacent tiles (up, right, down, left)
    const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    for (const [dr, dc] of directions) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 5 && c >= 0 && c < 5 && board.wall[r][c].filled) {
        adjacentCount++;
      }
    }
    
    strategyScore += adjacentCount * 1.5;
  }
  
  return strategyScore;
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
  if (moves.length === 0) throw new Error('No moves available');
  
  // Trouver le score maximum
  const maxScore = moves[0].score;
  const minScore = moves[moves.length - 1].score;
  const scoreRange = maxScore - minScore;
  
  // Si tous les scores sont identiques ou range très petite, retourner aléatoire
  if (scoreRange < 0.1) {
    return moves[Math.floor(Math.random() * moves.length)];
  }
  
  // Calculer le seuil dynamique
  const threshold = maxScore - (scoreRange * (1 - topPercentage));
  
  // Filtrer les mouvements au-dessus du seuil
  const topMoves = moves.filter(move => move.score >= threshold);
  
  // Si le filtrage est trop restrictif, prendre au moins 1 mouvement
  const finalMoves = topMoves.length > 0 ? topMoves : [moves[0]];
  
  return finalMoves[Math.floor(Math.random() * finalMoves.length)];
};