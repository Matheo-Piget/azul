import { GameState, Tile, TileColor, Player, Factory } from '../models/types';
import { initializeGame, distributeFactoryTiles, shuffle, createTiles, createPlayerBoard, createPlayer, createFactories, generateId } from './setup';

describe('Game Setup', () => {
    describe('initializeGame', () => {
        test('should create a game with the correct number of players', () => {
            const playerCount = 3;
            const gameState = initializeGame(playerCount);

            expect(gameState.players.length).toBe(playerCount);
            expect(gameState.players[0].name).toContain('Player');
            expect(gameState.players[1].name).toContain('Player');
            expect(gameState.players[2].name).toContain('Player');
        });

        test('should initialize players with empty boards', () => {
            const gameState = initializeGame(2);

            gameState.players.forEach(player => {
                // Check pattern lines
                expect(player.board.patternLines.length).toBe(5);
                expect(player.board.patternLines[0].spaces).toBe(1);
                expect(player.board.patternLines[4].spaces).toBe(5);
                player.board.patternLines.forEach(line => {
                    expect(line.tiles).toEqual([]);
                    expect(line.color).toBeNull();
                });

                // Check wall
                expect(player.board.wall.length).toBe(5);
                player.board.wall.forEach(row => {
                    expect(row.length).toBe(5);
                    row.forEach(space => {
                        expect(space.filled).toBe(false);
                    });
                });

                // Check floor line and score
                expect(player.board.floorLine).toEqual([]);
                expect(player.board.score).toBe(0);
            });
        });

        test('should create the correct number of factories', () => {
            const twoPlayerGame = initializeGame(2);
            expect(twoPlayerGame.factories.length).toBe(5); // 2*2+1

            const fourPlayerGame = initializeGame(4);
            expect(fourPlayerGame.factories.length).toBe(9); // 2*4+1
        });

        test('should fill each factory with 4 tiles', () => {
            const gameState = initializeGame(2);

            gameState.factories.forEach(factory => {
                expect(factory.tiles.length).toBe(4);
            });
        });

        test('should initialize game with correct state values', () => {
            const gameState = initializeGame(2);

            expect(gameState.center).toEqual([]);
            expect(gameState.discardPile).toEqual([]);
            expect(gameState.gamePhase).toBe('drafting');
            expect(gameState.firstPlayerToken).toBeNull();
            expect(gameState.roundNumber).toBe(1);
            expect(gameState.currentPlayer).toBe(gameState.players[0].id);
        });

        test('should create a bag with 100 tiles (20 of each color)', () => {
            const gameState = initializeGame(2);

            // Total tiles = bag + factories
            const factoryTiles = gameState.factories.flatMap(f => f.tiles);
            const totalTiles = [...gameState.bag, ...factoryTiles];

            expect(totalTiles.length).toBe(100);

            // Count tiles by color
            const colorCounts: Record<TileColor, number> = {
                blue: 0, yellow: 0, red: 0, black: 0, teal: 0, green: 0, purple: 0, orange: 0
            };

            totalTiles.forEach(tile => {
                colorCounts[tile.color]++;
            });

            Object.values(colorCounts).forEach(count => {
                expect(count).toBe(20);
            });
        });

        test('should throw if playerCount < 2', () => {
            expect(() => initializeGame(1)).toThrow();
        });

        test('should throw if playerCount > 4', () => {
            expect(() => initializeGame(5)).toThrow();
        });

        test('should assign unique ids to players', () => {
            const gameState = initializeGame(4);
            const ids = gameState.players.map(p => p.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(4);
        });

        test('wall rows should be color shifted', () => {
            const gameState = initializeGame(2);
            const wall = gameState.players[0].board.wall;
            const colors: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal'];
            for (let row = 0; row < 5; row++) {
                const expectedRow = [...colors.slice(row), ...colors.slice(0, row)];
                const wallRowColors = wall[row].map(space => space.color);
                expect(wallRowColors).toEqual(expectedRow);
            }
        });
    });

    describe('distributeFactoryTiles', () => {
        test('should distribute 4 tiles to each factory', () => {
            // Create a game state with empty factories
            const initialState = initializeGame(2);
            initialState.factories.forEach(factory => {
                factory.tiles = [];
            });

            // Put all tiles back in the bag
            const allTiles = initialState.factories.flatMap(f => f.tiles);
            initialState.bag = [...initialState.bag, ...allTiles];

            // Distribute tiles
            const newState = distributeFactoryTiles(initialState);

            newState.factories.forEach(factory => {
                expect(factory.tiles.length).toBe(4);
            });
        });

        test('should move tiles from discard pile to bag when bag is empty', () => {
            // Create a game state with empty bag and tiles in discard
            const initialState = initializeGame(2);
            const discardTiles = initialState.bag.splice(0, 80);
            initialState.discardPile = discardTiles;

            // Empty all factories
            initialState.factories.forEach(factory => {
                factory.tiles = [];
            });

            // Distribute tiles
            const newState = distributeFactoryTiles(initialState);

            // Check that discard pile was used and is now empty
            expect(newState.discardPile).toEqual([]);

            // Check that factories have tiles
            expect(newState.factories.some(f => f.tiles.length > 0)).toBe(true);
        });

        test('should not crash if bag and discard are empty', () => {
            const initialState = initializeGame(2);
            initialState.bag = [];
            initialState.discardPile = [];
            initialState.factories.forEach(f => (f.tiles = []));

            const newState = distributeFactoryTiles(initialState);
            newState.factories.forEach(factory => {
                expect(factory.tiles.length).toBe(0);
            });
        });

        test('should not mutate original gameState', () => {
            const initialState = initializeGame(2);
            const originalBag = [...initialState.bag];
            const originalFactories = initialState.factories.map(f => [...f.tiles]);
            const newState = distributeFactoryTiles(initialState);

            expect(initialState.bag).toEqual(originalBag);
            initialState.factories.forEach((f, i) => {
                expect(f.tiles).toEqual(originalFactories[i]);
            });
        });
    });

    describe('utils functions', () => {
        test('generateId should return unique strings', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(generateId());
            }
            expect(ids.size).toBe(100);
        });

        test('createTiles should return 100 tiles (20 of each color)', () => {
            const tiles = createTiles();
            expect(tiles.length).toBe(100);
            const colorCounts: Record<TileColor, number> = {
                blue: 0, yellow: 0, red: 0, black: 0, teal: 0, green: 0, purple: 0, orange: 0
            };
            tiles.forEach(tile => colorCounts[tile.color]++);
            Object.values(colorCounts).forEach(count => expect(count).toBe(20));
        });

        test('createPlayerBoard should return a valid empty board', () => {
            const board = createPlayerBoard();
            expect(board.patternLines.length).toBe(5);
            expect(board.wall.length).toBe(5);
            expect(board.floorLine).toEqual([]);
            expect(board.score).toBe(0);
            board.patternLines.forEach((line, i) => {
                expect(line.spaces).toBe(i + 1);
                expect(line.tiles).toEqual([]);
                expect(line.color).toBeNull();
            });
            board.wall.forEach(row => {
                expect(row.length).toBe(5);
                row.forEach(space => {
                    expect(typeof space.row).toBe('number');
                    expect(typeof space.column).toBe('number');
                    expect(['blue', 'yellow', 'red', 'black', 'teal']).toContain(space.color);
                    expect(space.filled).toBe(false);
                });
            });
        });

        test('createPlayer should return a player with correct name and id', () => {
            const player = createPlayer('abc123', 'Alice');
            expect(player.id).toBe('abc123');
            expect(player.name).toBe('Alice');
            expect(player.board).toBeDefined();
        });

        test('createFactories should return correct number of factories', () => {
            expect(createFactories(2).length).toBe(5);
            expect(createFactories(3).length).toBe(7);
            expect(createFactories(4).length).toBe(9);
        });

        test('shuffle should return a permutation of the array', () => {
            const arr = [1, 2, 3, 4, 5];
            const shuffled = shuffle(arr);
            expect(shuffled.sort()).toEqual(arr.sort());
            // Il y a une faible chance que le shuffle ne change rien, mais ce test est suffisant pour la couverture
        });
    });

});