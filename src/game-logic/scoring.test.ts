import { calculateRoundScores, calculateFinalScores } from './scoring';
import { GameState, Player, PlayerBoard, Tile, TileColor, WallSpace } from '../models/types';

// Utility functions to help create test fixtures
const createEmptyWall = (): WallSpace[][] => {
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
  
  return wall;
};

const createEmptyPatternLines = () => {
  return Array(5).fill(0).map((_, i) => ({
    spaces: i + 1,
    tiles: [],
    color: null
  }));
};

const createEmptyPlayerBoard = (): PlayerBoard => ({
  patternLines: createEmptyPatternLines(),
  wall: createEmptyWall(),
  floorLine: [],
  score: 0
});

const createPlayer = (id: string, name: string, board?: Partial<PlayerBoard>): Player => ({
  id,
  name,
  board: {
    ...createEmptyPlayerBoard(),
    ...board
  }
});

const createBasicGameState = (players: Player[]): GameState => ({
  players,
  factories: [],
  center: [],
  bag: [],
  discardPile: [],
  currentPlayer: players[0].id,
  gamePhase: 'gameEnd',
  firstPlayerToken: null,
  roundNumber: 5
});

// Helper to fill specific tiles on the wall
const fillWallTiles = (wall: WallSpace[][], positions: Array<[number, number]>): WallSpace[][] => {
  const newWall = JSON.parse(JSON.stringify(wall)); // Deep clone
  
  positions.forEach(([row, col]) => {
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      newWall[row][col].filled = true;
    }
  });
  
  return newWall;
};

// Helper to fill an entire row
const fillWallRow = (wall: WallSpace[][], rowIndex: number): WallSpace[][] => {
  const newWall = JSON.parse(JSON.stringify(wall));
  newWall[rowIndex].forEach((space: { filled: boolean; }) => space.filled = true);
  return newWall;
};

// Helper to fill an entire column
const fillWallColumn = (wall: WallSpace[][], colIndex: number): WallSpace[][] => {
  const newWall = JSON.parse(JSON.stringify(wall));
  for (let row = 0; row < 5; row++) {
    newWall[row][colIndex].filled = true;
  }
  return newWall;
};

// Helper to fill all tiles of a specific color
const fillWallColor = (wall: WallSpace[][], color: TileColor): WallSpace[][] => {
  const newWall = JSON.parse(JSON.stringify(wall));
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (newWall[row][col].color === color) {
        newWall[row][col].filled = true;
      }
    }
  }
  return newWall;
};

describe('Scoring Tests', () => {
  describe('calculateFinalScores', () => {
    // Test 1: Empty board should have no bonus points
    test('empty board should receive no bonus points', () => {
      const player = createPlayer('p1', 'Player 1');
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(0);
    });
    
    // Test 2: Complete horizontal row should give 2 points
    test('complete horizontal row should give 2 bonus points', () => {
      const wall = createEmptyWall();
      const filledWall = fillWallRow(wall, 2); // Fill the middle row
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(2);
    });
    
    // Test 3: Complete vertical column should give 7 points
    test('complete vertical column should give 7 bonus points', () => {
      const wall = createEmptyWall();
      const filledWall = fillWallColumn(wall, 2); // Fill the middle column
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(7);
    });
    
    // Test 4: Complete color set should give 10 points
    test('complete color set should give 10 bonus points', () => {
      const wall = createEmptyWall();
      const filledWall = fillWallColor(wall, 'blue');
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(10);
    });
    
    // Test 5: Multiple complete rows should give correct points
    test('multiple complete rows should give correct bonus points', () => {
      const wall = createEmptyWall();
      let filledWall = fillWallRow(wall, 0);
      filledWall = fillWallRow(filledWall, 3);
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(4); // 2 points per row × 2 rows
    });
    
    // Test 6: Multiple complete columns should give correct points
    test('multiple complete columns should give correct bonus points', () => {
      const wall = createEmptyWall();
      let filledWall = fillWallColumn(wall, 1);
      filledWall = fillWallColumn(filledWall, 4);
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(14); // 7 points per column × 2 columns
    });
    
    // Test 7: Multiple complete colors should give correct points
    test('multiple complete colors should give correct bonus points', () => {
      const wall = createEmptyWall();
      let filledWall = fillWallColor(wall, 'red');
      filledWall = fillWallColor(filledWall, 'black');
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(20); // 10 points per color × 2 colors
    });
    
    // Test 8: Combination of different bonus types
    test('combination of different bonus types should sum correctly', () => {
      const wall = createEmptyWall();
      let filledWall = fillWallRow(wall, 0);
      filledWall = fillWallColumn(filledWall, 0);
      filledWall = fillWallColor(filledWall, 'blue');
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall, score: 5 });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      // Initial score (5) + row bonus (2) + column bonus (7) + color bonus (10)
      expect(result.players[0].board.score).toBe(24);
    });
    
    // Test 9: Multiple players should each get their own bonuses
    test('multiple players should each get their own bonuses', () => {
      // Player 1 with a complete row
      const wall1 = createEmptyWall();
      const filledWall1 = fillWallRow(wall1, 0);
      const player1 = createPlayer('p1', 'Player 1', { wall: filledWall1, score: 10 });
      
      // Player 2 with a complete column
      const wall2 = createEmptyWall();
      const filledWall2 = fillWallColumn(wall2, 0);
      const player2 = createPlayer('p2', 'Player 2', { wall: filledWall2, score: 15 });
      
      const gameState = createBasicGameState([player1, player2]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(12); // 10 + 2
      expect(result.players[1].board.score).toBe(22); // 15 + 7
    });
    
    // Test 10: Completely filled wall should give maximum bonus
    test('completely filled wall should give maximum bonus', () => {
      // Create a completely filled wall
      const wall = createEmptyWall();
      let filledWall = wall;
      
      // Fill all positions
      for (let row = 0; row < 5; row++) {
        filledWall = fillWallRow(filledWall, row);
      }
      
      const player = createPlayer('p1', 'Player 1', { wall: filledWall });
      const gameState = createBasicGameState([player]);
      
      const result = calculateFinalScores(gameState);
      
      // 5 rows (2 points each) + 5 columns (7 points each) + 5 colors (10 points each)
      const expectedBonus = (5 * 2) + (5 * 7) + (5 * 10) // = 10 + 35 + 50 = 95
      expect(result.players[0].board.score).toBe(expectedBonus);
    });
  });
  
  // Integration tests for a complete game simulation
  describe('Game Integration Tests', () => {
    // Simulate a simplified round of play
    test('simulating a round of play with pattern lines and scoring', () => {
      // Create a player with some completed pattern lines ready to be scored
      const player = createPlayer('p1', 'Player 1');
      
      // Fill first pattern line with red tiles
      player.board.patternLines[0].tiles = [{ id: 't1', color: 'red' }];
      player.board.patternLines[0].color = 'red';
      player.board.patternLines[0].spaces = 1; // Make sure it's complete
      
      // Add some floor line penalties
      player.board.floorLine = [
        { id: 'f1', color: 'blue' },
        { id: 'f2', color: 'yellow' },
      ];
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: player.id,
        gamePhase: 'scoring',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      // Calculate round scores first
      const roundScoredState = calculateRoundScores(gameState);
      
      // Check if the pattern line was transferred to wall correctly
      const scoredPlayer = roundScoredState.players[0];
      expect(scoredPlayer.board.patternLines[0].tiles).toHaveLength(0);
      expect(scoredPlayer.board.patternLines[0].color).toBeNull();
      
      // Check if wall tile was filled
      const redPosition = scoredPlayer.board.wall[0].findIndex(space => space.color === 'red');
      expect(scoredPlayer.board.wall[0][redPosition].filled).toBeTruthy();
      
      // Check if floor penalties were applied (-1 -1 = -2)
      // Initial score starts at 0, placing a tile gives 1 point, and floor penalties are -2, so final score should be -1 but clamped to 0
      expect(scoredPlayer.board.score).toBe(0);
      
      // Check if floor was cleared
      expect(scoredPlayer.board.floorLine).toHaveLength(0);
    });
    
    // Simulating a complete game with multiple rounds
    test('simulating a complete game with multiple rounds and final scoring', () => {
      // Create a player with an interesting wall configuration for final scoring
      const player = createPlayer('p1', 'Player 1');
      
      // Setup the player's wall with some strategies:
      // - One complete row (row 0)
      // - One complete column (column 0)
      // - One complete color (blue)
      // Plus some other scattered tiles
      
      let wall = createEmptyWall();
      
      // Fill first row completely (2 points)
      wall = fillWallRow(wall, 0);
      
      // Fill first column completely (7 points)
      wall = fillWallColumn(wall, 0);
      
      // Fill all blue tiles (10 points)
      wall = fillWallColor(wall, 'blue');
      
      // Add some random other tiles
      const additionalPositions: Array<[number, number]> = [
        [2, 2], [2, 3], [3, 2], [3, 3], [4, 4]
      ];
      wall = fillWallTiles(wall, additionalPositions);
      
      // Update player's wall and add some initial score (from previous rounds)
      player.board.wall = wall;
      player.board.score = 35;
      
      // Create game state at the end of the game
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: player.id,
        gamePhase: 'gameEnd',
        firstPlayerToken: null,
        roundNumber: 5 // Last round
      };
      
      // Calculate final scores
      const finalState = calculateFinalScores(gameState);
      
      // Check the final score calculation
      // Initial score (35) + row bonus (2) + column bonus (7) + color bonus (10) = 54
      expect(finalState.players[0].board.score).toBe(54);
    });
    
    // Test for scoring edge cases and specific game scenarios
    test('edge case: all pattern lines filled but not complete', () => {
      const player = createPlayer('p1', 'Player 1');
      
      // Fill pattern lines with incomplete sets
      for (let i = 0; i < 5; i++) {
        player.board.patternLines[i].tiles = Array(i).fill(0).map(
          (_, j) => ({ id: `t${i}${j}`, color: 'blue' })
        );
        if (player.board.patternLines[i].tiles.length > 0) {
          player.board.patternLines[i].color = 'blue';
        }
      }
      
      const gameState = createBasicGameState([player]);
      gameState.gamePhase = 'scoring';
      
      // Calculate round scores should do nothing as no line is complete
      const roundScoredState = calculateRoundScores(gameState);
      expect(roundScoredState.players[0].board.score).toBe(0);
      
      // Pattern lines should remain unchanged
      for (let i = 0; i < 5; i++) {
        expect(roundScoredState.players[0].board.patternLines[i].tiles).toHaveLength(i);
      }
    });
    
    // Test for maximum penalty in floor line
    test('maximum penalty from floor line', () => {
      const player = createPlayer('p1', 'Player 1');
      
      // Fill floor line with max penalties
      player.board.floorLine = Array(7).fill(0).map(
        (_, i) => ({ id: `f${i}`, color: 'blue' })
      );
      player.board.score = 10; // Give initial score so penalties can be applied
      
      const gameState = createBasicGameState([player]);
      gameState.gamePhase = 'scoring';
      
      // Calculate round scores
      const roundScoredState = calculateRoundScores(gameState);
      
      // Max penalties is -1-1-2-2-2-3-3 = -14, from 10 should be -4 but clamped to 0
      expect(roundScoredState.players[0].board.score).toBe(0);
      expect(roundScoredState.players[0].board.floorLine).toHaveLength(0);
    });
    
    // Test for a tied game outcome
    test('tied game outcome between players', () => {
      // Two players with different strategies but same final score
      
      // Player 1: Complete row and some additional points
      const wall1 = createEmptyWall();
      const filledWall1 = fillWallRow(wall1, 0);
      const player1 = createPlayer('p1', 'Player 1', { wall: filledWall1, score: 15 });
      
      // Player 2: Complete 2 rows but fewer points
      const wall2 = createEmptyWall();
      let filledWall2 = fillWallRow(wall2, 1);
      filledWall2 = fillWallRow(filledWall2, 3);
      const player2 = createPlayer('p2', 'Player 2', { wall: filledWall2, score: 13 });
      
      const gameState = createBasicGameState([player1, player2]);
      
      const result = calculateFinalScores(gameState);
      
      expect(result.players[0].board.score).toBe(17); // 15 + 2
      expect(result.players[1].board.score).toBe(17); // 13 + 4
      // Both players are tied at 17 points
    });
  });
});