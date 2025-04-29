import { GameState, Tile, TileColor, Player, Factory } from '../models/types';
import { initializeGame, distributeFactoryTiles } from './setup';

describe('Game Setup', () => {
    describe('initializeGame', () => {
        test('should create a game with the correct number of players', () => {
            const playerCount = 3;
            const gameState = initializeGame(playerCount);
            
            expect(gameState.players.length).toBe(playerCount);
            expect(gameState.players[0].name).toBe('Joueur 1');
            expect(gameState.players[1].name).toBe('Joueur 2');
            expect(gameState.players[2].name).toBe('Joueur 3');
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
                blue: 0,
                yellow: 0,
                red: 0,
                black: 0,
                teal: 0
            };
            
            totalTiles.forEach(tile => {
                colorCounts[tile.color]++;
            });
            
            Object.values(colorCounts).forEach(count => {
                expect(count).toBe(20);
            });
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
            const discardTiles = initialState.bag.splice(0, 20);
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
    });
});