import { getAIMove, AIDifficulty } from './aiPlayer';
import { GameState, Tile, TileColor, Player, PlayerBoard, Factory } from '../../models/types';
import { canSelectTiles, canPlaceTiles } from '../moves';

const COLORS: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];

function createTile(color: TileColor, id = Math.random().toString(36).slice(2, 10)): Tile {
  return { id, color };
}

function createPlayerBoard(): PlayerBoard {
  return {
    patternLines: Array(5).fill(0).map((_, i) => ({
      spaces: i + 1,
      tiles: [],
      color: null,
    })),
    wall: Array(5).fill(0).map((_, row) =>
      Array(5).fill(0).map((_, col) => ({
        row,
        column: col,
        color: COLORS[(col + row) % 5],
        filled: false,
      }))
    ),
    floorLine: [],
    score: 0,
  };
}

function createPlayer(id = 'p1'): Player {
  return {
    id,
    name: `Player ${id}`,
    board: createPlayerBoard(),
  };
}

function createFactory(id: number, tiles: Tile[]): Factory {
  return { id, tiles };
}

function basicGameState(overrides?: Partial<GameState>): GameState {
  const player = createPlayer();
  const factories = [
    createFactory(0, [createTile('blue'), createTile('yellow')]),
    createFactory(1, [createTile('red'), createTile('red')]),
  ];
  const center = [createTile('black'), createTile('teal')];
  return {
    players: [player],
    factories,
    center,
    bag: [],
    discardPile: [],
    currentPlayer: player.id,
    gamePhase: 'drafting',
    firstPlayerToken: null,
    roundNumber: 1,
    ...overrides,
  };
}

describe('aiPlayer - getAIMove', () => {
  it('returns a valid move for easy AI', () => {
    const gameState = basicGameState();
    const move = getAIMove(gameState, 'easy');
    expect(move).toHaveProperty('factoryId');
    expect(move).toHaveProperty('color');
    expect(move).toHaveProperty('patternLineIndex');
    // The move must be selectable and placeable (or floor line)
    expect(
      move.patternLineIndex === -1 ||
      canPlaceTiles(gameState, move.patternLineIndex, [createTile(move.color)])
    ).toBe(true);
  });

  it('returns a move that prefers completing lines for medium AI', () => {
    const player = createPlayer();
    // Fill pattern line 0 with one blue tile (needs one more to complete)
    player.board.patternLines[0].tiles = [createTile('blue')];
    player.board.patternLines[0].color = 'blue';
    player.board.patternLines[0].spaces = 2;
    const factories = [
      createFactory(0, [createTile('blue'), createTile('blue')]),
    ];
    const gameState = basicGameState({
      players: [player],
      factories,
      center: [],
      currentPlayer: player.id,
    });
    const move = getAIMove(gameState, 'medium');
    expect(move.patternLineIndex).toBe(0);
    expect(move.color).toBe('blue');
  });

  it('returns a move that prefers adjacency and bonuses for hard AI', () => {
    const player = createPlayer();
    // Simulate wall with adjacent filled tiles
    player.board.wall[2][1].filled = true;
    player.board.wall[2][3].filled = true;
    player.board.wall[1][2].filled = true;
    // Pattern line 2 is empty, can be filled with 'red'
    player.board.patternLines[2].color = null;
    player.board.patternLines[2].tiles = [];
    player.board.patternLines[2].spaces = 3;
    const factories = [
      createFactory(0, [createTile('red'), createTile('red'), createTile('red')]),
    ];
    const gameState = basicGameState({
      players: [player],
      factories,
      center: [],
      currentPlayer: player.id,
    });
    const move = getAIMove(gameState, 'hard');
    expect(move.patternLineIndex).toBe(2);
    expect(move.color).toBe('red');
  });

  it('throws if no valid selections are available', () => {
    const player = createPlayer();
    const gameState = basicGameState({
      players: [player],
      factories: [],
      center: [],
      currentPlayer: player.id,
    });
    expect(() => getAIMove(gameState, 'easy')).toThrow();
  });

  it('falls back to easy AI if medium finds no move', () => {
    const player = createPlayer();
    // All pattern lines blocked for 'blue'
    player.board.patternLines.forEach(line => {
      line.color = 'blue';
      line.tiles = Array(line.spaces).fill(null).map(() => createTile('blue'));
    });
    const factories = [
      createFactory(0, [createTile('blue'), createTile('blue')]),
    ];
    const gameState = basicGameState({
      players: [player],
      factories,
      center: [],
      currentPlayer: player.id,
    });
    const move = getAIMove(gameState, 'medium');
    expect(move.patternLineIndex).toBe(-1);
  });
});

describe('aiPlayer - integration', () => {
  it('AI can play a full turn and update the board', () => {
    // Simulate a simple turn: AI selects, places, and board updates
    const player = createPlayer();
    const factories = [
      createFactory(0, [createTile('yellow'), createTile('yellow')]),
    ];
    const gameState = basicGameState({
      players: [player],
      factories,
      center: [],
      currentPlayer: player.id,
    });
    const move = getAIMove(gameState, 'easy');
    // Simulate placing tiles
    if (move.patternLineIndex >= 0) {
      player.board.patternLines[move.patternLineIndex].tiles.push(
        ...factories[0].tiles.filter(t => t.color === move.color)
      );
      player.board.patternLines[move.patternLineIndex].color = move.color;
      // Remove tiles from factory
      factories[0].tiles = factories[0].tiles.filter(t => t.color !== move.color);
    } else {
      // Floor line
      player.board.floorLine.push(...factories[0].tiles.filter(t => t.color === move.color));
      factories[0].tiles = factories[0].tiles.filter(t => t.color !== move.color);
    }
    // Assert that tiles were moved
    if (move.patternLineIndex >= 0) {
      expect(player.board.patternLines[move.patternLineIndex].tiles.length).toBeGreaterThan(0);
    } else {
      expect(player.board.floorLine.length).toBeGreaterThan(0);
    }
    expect(factories[0].tiles.length).toBe(0);
  });
});