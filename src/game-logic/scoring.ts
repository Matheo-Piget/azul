import { GameState, PlayerBoard, Player, Tile, TileColor } from '../models/types';

/**
 * Penalty points for floor line tiles (Azul scoring rules)
 * @constant {number[]}
 */
const FLOOR_PENALTIES = [-1, -1, -2, -2, -2, -3, -3];

/**
 * Calculates the score for placing a tile on the wall
 * @param {PlayerBoard} board - Player's board
 * @param {number} row - Row index of placed tile
 * @param {number} col - Column index of placed tile
 * @returns {number} Score earned for this placement
 */
export const calculateTilePlacementScore = (board: PlayerBoard, row: number, col: number): number => {
  let horizontalScore = 0;
  let verticalScore = 0;
  
  // Count adjacent tiles to the left
  for (let c = col - 1; c >= 0; c--) {
    if (board.wall[row][c].filled) {
      horizontalScore++;
    } else {
      break;
    }
  }
  
  // Count adjacent tiles to the right
  for (let c = col + 1; c < board.wall[row].length; c++) {
    if (board.wall[row][c].filled) {
      horizontalScore++;
    } else {
      break;
    }
  }
  
  // Count adjacent tiles above
  for (let r = row - 1; r >= 0; r--) {
    if (board.wall[r][col].filled) {
      verticalScore++;
    } else {
      break;
    }
  }
  
  // Count adjacent tiles below
  for (let r = row + 1; r < board.wall.length; r++) {
    if (board.wall[r][col].filled) {
      verticalScore++;
    } else {
      break;
    }
  }
  
  // Single tile placement (no adjacent tiles)
  if (horizontalScore === 0 && verticalScore === 0) {
    return 1;
  }
  
  // Calculate total score from adjacent tiles
  let totalScore = 0;
  if (horizontalScore > 0) {
    totalScore += horizontalScore + 1; // +1 for the placed tile
  }
  if (verticalScore > 0) {
    totalScore += verticalScore + 1; // +1 for the placed tile
  }
  
  return totalScore;
};

/**
 * Applies floor line penalties to player score
 * @param {Player} player - Player to penalize
 * @returns {Player} Updated player with penalties applied
 */
export const applyFloorPenalties = (player: Player): Player => {
  const updatedPlayer = { ...player };
  const floorLineCount = updatedPlayer.board.floorLine.length;
  
  // Calculate total penalty
  const penalty = FLOOR_PENALTIES
    .slice(0, floorLineCount)
    .reduce((sum, current) => sum + current, 0);
  
  // Apply penalty (score never goes below 0)
  updatedPlayer.board.score = Math.max(0, updatedPlayer.board.score + penalty);
  
  // Clear floor line
  updatedPlayer.board.floorLine = [];
  
  return updatedPlayer;
};

/**
 * Transfers completed pattern lines to the wall and calculates score
 * @param {Player} player - Current player
 * @param {GameState} gameState - Current game state
 * @returns {Object} Contains updated player and discarded tiles
 */
export const transferCompletedLinesToWall = (
  player: Player,
  gameState: GameState
): { player: Player, discardedTiles: Tile[] } => {
  const updatedPlayer = { ...player };
  let scoreGained = 0;
  let discardedTiles: Tile[] = [];
  
  updatedPlayer.board.patternLines.forEach((line, rowIndex) => {
    // Check if line is complete and has a color
    if (line.tiles.length === line.spaces && line.color) {
      const wallRow = updatedPlayer.board.wall[rowIndex];
      const color = line.color;
      
      // Find corresponding wall column for this color
      const colIndex = wallRow.findIndex(space => space.color === color);
      
      if (colIndex !== -1 && !wallRow[colIndex].filled) {
        // Mark wall space as filled
        wallRow[colIndex].filled = true;
        
        // Calculate score for this placement
        scoreGained += calculateTilePlacementScore(updatedPlayer.board, rowIndex, colIndex);
        
        // Keep one tile on wall, discard the rest
        const [keptTile, ...extraTiles] = line.tiles;
        discardedTiles = [...discardedTiles, ...extraTiles];
        
        // Reset pattern line
        line.tiles = [];
        line.color = null;
      }
    }
  });
  
  // Update player score
  updatedPlayer.board.score += scoreGained;
  
  return { player: updatedPlayer, discardedTiles };
};

/**
 * Calculates round scores for all players
 * @param {GameState} gameState - Current game state
 * @returns {GameState} Updated game state with scores calculated
 */
export const calculateRoundScores = (gameState: GameState): GameState => {
  const updatedGameState = { ...gameState };
  let allDiscardedTiles: Tile[] = [];
  
  updatedGameState.players = updatedGameState.players.map(player => {
    // Transfer completed lines to wall
    const { player: updatedPlayer, discardedTiles } = 
      transferCompletedLinesToWall(player, updatedGameState);
    allDiscardedTiles = [...allDiscardedTiles, ...discardedTiles];
    
    // Apply floor penalties and collect floor tiles
    const floorTiles = [...updatedPlayer.board.floorLine];
    allDiscardedTiles = [...allDiscardedTiles, ...floorTiles];
    
    return applyFloorPenalties(updatedPlayer);
  });
  
  // Add all discarded tiles to discard pile
  updatedGameState.discardPile = [
    ...updatedGameState.discardPile,
    ...allDiscardedTiles
  ];
  
  return updatedGameState;
};

/**
 * Calculates final game bonuses and scores
 * @param {GameState} gameState - Current game state
 * @returns {GameState} Updated game state with final scores
 */
export const calculateFinalScores = (gameState: GameState): GameState => {
  const updatedGameState = { ...gameState };
  
  updatedGameState.players = updatedGameState.players.map(player => {
    let bonusScore = 0;
    const wall = player.board.wall;
    
    // Horizontal line bonus (2 points per complete row)
    for (let row = 0; row < wall.length; row++) {
      if (wall[row].every(space => space.filled)) {
        bonusScore += 2;
      }
    }
    
    // Vertical line bonus (7 points per complete column)
    for (let col = 0; col < wall[0].length; col++) {
      if (wall.every(row => row[col].filled)) {
        bonusScore += 7;
      }
    }
    
    // Color bonus (10 points per complete color)
    const COLOR_COUNT = 5;
    const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
    
    colors.forEach(color => {
      const colorCount = wall
        .flat()
        .filter(space => space.color === color && space.filled)
        .length;
      
      if (colorCount === COLOR_COUNT) {
        bonusScore += 10;
      }
    });
    
    // Apply bonuses
    return {
      ...player,
      board: {
        ...player.board,
        score: player.board.score + bonusScore
      }
    };
  });
  
  return updatedGameState;
};