import { initializeGame } from '../../src/game-logic/setup';
import { getAIMove, AIDifficulty } from '../../src/game-logic/ai/aiPlayer';
import { calculateFinalScores } from '../../src/game-logic/scoring';
import { GameState } from '../../src/models/types';
import fs from 'fs';
import path from 'path';
const scoring = require('../../src/game-logic/scoring');


function simulateAIGame(playerCount: number, difficulty: AIDifficulty): number[] {
  let gameState = initializeGame(playerCount);
  // All players are AI
  const aiPlayers: Record<string, AIDifficulty> = {};
  gameState.players.forEach(p => { aiPlayers[p.id] = difficulty; });

  while (gameState.gamePhase !== 'gameEnd') {
    const currentPlayerId = gameState.currentPlayer;
    if (aiPlayers[currentPlayerId]) {
      const aiDecision = getAIMove(gameState, aiPlayers[currentPlayerId]);
      // Simulate tile selection
      let tilesToSelect: any[] = [];
      if (aiDecision.factoryId !== null) {
        const factory = gameState.factories.find(f => f.id === aiDecision.factoryId);
        if (!factory) break;
        const selectedFromFactory = factory.tiles.filter(t => t.color === aiDecision.color);
        const otherTiles = factory.tiles.filter(t => t.color !== aiDecision.color);
        tilesToSelect = [...selectedFromFactory];
        gameState.factories = gameState.factories.map(f =>
          f.id === aiDecision.factoryId ? { ...f, tiles: [] } : f
        );
        gameState.center = [...gameState.center, ...otherTiles];
      } else {
        tilesToSelect = gameState.center.filter(t => t.color === aiDecision.color);
        gameState.center = gameState.center.filter(t => t.color !== aiDecision.color);
        if (gameState.firstPlayerToken === null) {
          gameState.firstPlayerToken = gameState.currentPlayer;
        }
      }
      // Place tiles
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
      if (!currentPlayer) break;
      const isFloorLine = aiDecision.patternLineIndex === -1;
      if (isFloorLine) {
        currentPlayer.board.floorLine = [
          ...currentPlayer.board.floorLine,
          ...tilesToSelect,
        ];
      } else {
        const patternLine = currentPlayer.board.patternLines[aiDecision.patternLineIndex];
        const color = tilesToSelect[0]?.color;
        const spaceAvailable = patternLine.spaces - patternLine.tiles.length;
        const tilesToPlace = tilesToSelect.slice(0, spaceAvailable);
        const excessTiles = tilesToSelect.slice(spaceAvailable);
        patternLine.tiles = [...patternLine.tiles, ...tilesToPlace];
        patternLine.color = patternLine.color || color;
        currentPlayer.board.floorLine = [
          ...currentPlayer.board.floorLine,
          ...excessTiles,
        ];
      }
      // Next player
      const currentPlayerIndex = gameState.players.findIndex(p => p.id === gameState.currentPlayer);
      const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
      gameState.currentPlayer = gameState.players[nextPlayerIndex].id;
      // End of round?
      const factoriesEmpty = gameState.factories.every(f => f.tiles.length === 0);
      const centerEmpty = gameState.center.length === 0;
      if (factoriesEmpty && centerEmpty) {
        gameState.gamePhase = "tiling";
        // Use scoring logic
        // @ts-ignore
        gameState = scoring.calculateRoundScores(gameState);
        // End game?
        const anyWallRowComplete = gameState.players.some(p =>
          p.board.wall.some(row => row.every(space => space.filled))
        );
        if (anyWallRowComplete) {
          gameState.gamePhase = "gameEnd";
          gameState = calculateFinalScores(gameState);
        } else {
          gameState.roundNumber += 1;
          gameState.gamePhase = "drafting";
          if (gameState.firstPlayerToken) {
            gameState.currentPlayer = gameState.firstPlayerToken;
            gameState.firstPlayerToken = null;
          }
          if (gameState.bag.length === 0 && gameState.discardPile.length > 0) {
            gameState.bag = [...gameState.discardPile];
            gameState.discardPile = [];
            // Shuffle
            for (let i = gameState.bag.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [gameState.bag[i], gameState.bag[j]] = [gameState.bag[j], gameState.bag[i]];
            }
          }
          // Distribute tiles to factories
          gameState = require('../../src/game-logic/setup').distributeFactoryTiles(gameState);
        }
      }
    } else {
      // Should not happen in AI vs AI
      break;
    }
  }
  // Return final scores
  return gameState.players.map(p => p.board.score);
}

function stats(scores: number[][]) {
  const flat = scores.flat();
  flat.sort((a, b) => a - b);
  const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
  const min = flat[0];
  const max = flat[flat.length - 1];
  const median = flat[Math.floor(flat.length / 2)];
  return { mean, min, max, median };
}

function advancedStats(scores: number[][]) {
  const playerCount = scores[0].length;
  const wins = Array(playerCount).fill(0);
  const allScores: number[][] = Array(playerCount).fill(0).map(() => []);
  scores.forEach(game => {
    // Trouve le(s) gagnant(s)
    const maxScore = Math.max(...game);
    game.forEach((score, idx) => {
      allScores[idx].push(score);
      if (score === maxScore) wins[idx]++;
    });
  });
  // Moyenne, min, max, écart-type par joueur
  const stats = allScores.map(playerScores => {
    const mean = playerScores.reduce((a, b) => a + b, 0) / playerScores.length;
    const min = Math.min(...playerScores);
    const max = Math.max(...playerScores);
    const std = Math.sqrt(playerScores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / playerScores.length);
    return { mean, min, max, std };
  });
  return { wins, stats };
}

describe('AI vs AI simulation', () => {
  const difficulties: AIDifficulty[] = ['easy', 'medium', 'hard'];
  [2, 3, 4].forEach(playerCount => {
    difficulties.forEach(difficulty => {
      it(`simulates 100 games: ${playerCount} AI (${difficulty})`, () => {
        const results: number[][] = [];
        for (let i = 0; i < 500; i++) {
          results.push(simulateAIGame(playerCount, difficulty));
        }
        const s = stats(results);
        const adv = advancedStats(results);

        // Print stats for manual inspection
        // eslint-disable-next-line no-console
        console.log(`AI ${difficulty} (${playerCount} players):`, s, adv);

        // Write results to file for later analysis
        const outDir = path.join(__dirname, '../../../ai_stats');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
        fs.writeFileSync(
          path.join(outDir, `ai_${difficulty}_${playerCount}p.json`),
          JSON.stringify({ results, stats: s, advanced: adv }, null, 2),
          'utf-8'
        );

        expect(s.mean).toBeGreaterThan(0);
        expect(s.max).toBeGreaterThan(0);
      });
    });
  });
});