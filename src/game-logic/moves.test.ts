import { GameState, Player, Tile, TileColor, Factory, PlayerBoard, WallSpace, PatternLine } from '../models/types';
import { canSelectTiles, canPlaceTiles, mustPlaceInFloorLine } from './moves';

// Utility functions for creating test fixtures
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
  
  return {
    patternLines,
    wall: createEmptyWall(),
    floorLine: [],
    score: 0
  };
};

const createPlayer = (id: string): Player => ({
  id,
  name: `Player ${id}`,
  board: createPlayerBoard()
});

const createTile = (color: TileColor, id: string = Math.random().toString(36).substring(2, 10)): Tile => ({
  id,
  color
});

describe('Game Moves', () => {
  describe('canSelectTiles', () => {
    test('should return false if game phase is not drafting', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [{ id: 0, tiles: [createTile('blue')] }],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'scoring', // Not drafting
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, 0, 'blue')).toBe(false);
    });
    
    test('should return false if factory does not exist', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [{ id: 0, tiles: [createTile('blue')] }],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, 999, 'blue')).toBe(false);
    });
    
    test('should return true if factory has tiles of selected color', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [{ id: 0, tiles: [createTile('blue'), createTile('red')] }],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, 0, 'blue')).toBe(true);
    });
    
    test('should return false if factory has no tiles of selected color', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [{ id: 0, tiles: [createTile('blue'), createTile('red')] }],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, 0, 'yellow')).toBe(false);
    });
    
    test('should return true if center has tiles of selected color', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [createTile('blue'), createTile('red')],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, null, 'blue')).toBe(true);
    });
    
    test('should return false if center has no tiles of selected color', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [createTile('blue'), createTile('red')],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canSelectTiles(gameState, null, 'yellow')).toBe(false);
    });
  });
  
  describe('canPlaceTiles', () => {
    test('should return false if game phase is not drafting', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'scoring', // Not drafting
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(false);
    });
    
    test('should return false if player is not found', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p2', // Not existing player
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(false);
    });
    
    test('should always allow placement on floor line (pattern line index -1)', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, -1, [createTile('blue')])).toBe(true);
    });
    
    test('should return false for invalid pattern line index', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 999, [createTile('blue')])).toBe(false);
      expect(canPlaceTiles(gameState, -2, [createTile('blue')])).toBe(false);
    });
    
    test('should return false if no tiles are selected', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [])).toBe(false);
    });
    
    test('should return false if pattern line already has a different color', () => {
      const player = createPlayer('p1');
      player.board.patternLines[0].color = 'red';
      player.board.patternLines[0].tiles = [createTile('red')];
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(false);
    });
    
    test('should return true if pattern line has same color as selected tiles', () => {
      const player = createPlayer('p1');
      player.board.patternLines[0].color = 'blue';
      player.board.patternLines[0].tiles = [createTile('blue')];
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(true);
    });
    
    test('should return true if pattern line is empty and has space', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(true);
    });
    
    test('should return false if pattern line is full', () => {
      const player = createPlayer('p1');
      player.board.patternLines[0].color = 'blue';
      player.board.patternLines[0].tiles = [createTile('blue')]; // Line 0 has only 1 space
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(false);
    });
    
    test('should return false if color is already on wall in the same row', () => {
      const player = createPlayer('p1');
      
      // Find position of blue in the wall row 0 and mark it as filled
      const blueIndex = player.board.wall[0].findIndex(space => space.color === 'blue');
      player.board.wall[0][blueIndex].filled = true;
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(canPlaceTiles(gameState, 0, [createTile('blue')])).toBe(false);
    });
  });

  describe('mustPlaceInFloorLine', () => {
    test('should return false if selected tiles array is empty', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [])).toBe(false);
    });
    
    test('should return false if player is not found', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p2', // Not existing player
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(false);
    });
    
    test('should return false if there is at least one valid pattern line', () => {
      const gameState: GameState = {
        players: [createPlayer('p1')],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(false);
    });
    
    test('should return true if all pattern lines of matching color are full', () => {
      const player = createPlayer('p1');
      
      // Fill all pattern lines with the maximum number of tiles
      player.board.patternLines.forEach((line, index) => {
        line.color = 'blue';
        line.tiles = Array(index + 1).fill(null).map(() => createTile('blue'));
      });
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(true);
    });
    
    test('should return true if all valid pattern lines already have the color on wall', () => {
      const player = createPlayer('p1');
      
      // Mark blue as filled on every row of the wall
      player.board.wall.forEach(row => {
        const blueIndex = row.findIndex(space => space.color === 'blue');
        row[blueIndex].filled = true;
      });
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(true);
    });
    
    test('should return true if all pattern lines either have different colors or are full', () => {
      const player = createPlayer('p1');
      
      // Set different colors for all pattern lines
      player.board.patternLines[0].color = 'red';
      player.board.patternLines[0].tiles = [createTile('red')];
      
      player.board.patternLines[1].color = 'yellow';
      player.board.patternLines[1].tiles = [createTile('yellow')];
      
      player.board.patternLines[2].color = 'black';
      player.board.patternLines[2].tiles = [createTile('black'), createTile('black'), createTile('black')];
      
      player.board.patternLines[3].color = 'teal';
      player.board.patternLines[3].tiles = [createTile('teal'), createTile('teal'), createTile('teal'), createTile('teal')];
      
      // Last line is full
      player.board.patternLines[4].color = 'blue';
      player.board.patternLines[4].tiles = Array(5).fill(null).map(() => createTile('blue'));
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(true);
    });
    
    test('should return false if at least one pattern line can accept the color', () => {
      const player = createPlayer('p1');
      
      // Set different colors for most pattern lines but leave one empty
      player.board.patternLines[0].color = 'red';
      player.board.patternLines[0].tiles = [createTile('red')];
      
      player.board.patternLines[1].color = 'yellow';
      player.board.patternLines[1].tiles = [createTile('yellow')];
      
      // Line 2 stays empty and can accept blue
      
      player.board.patternLines[3].color = 'teal';
      player.board.patternLines[3].tiles = [createTile('teal'), createTile('teal')];
      
      player.board.patternLines[4].color = 'black';
      player.board.patternLines[4].tiles = [createTile('black'), createTile('black')];
      
      const gameState: GameState = {
        players: [player],
        factories: [],
        center: [],
        bag: [],
        discardPile: [],
        currentPlayer: 'p1',
        gamePhase: 'drafting',
        firstPlayerToken: null,
        roundNumber: 1
      };
      
      expect(mustPlaceInFloorLine(gameState, [createTile('blue')])).toBe(false);
    });
  });
});