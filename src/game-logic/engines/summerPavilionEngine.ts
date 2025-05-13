import { AzulGameEngine } from '../../models/AzulGameEngine';
import { GameState, TileColor, Tile, Player } from '../../models/types';
import { calculateSummerPavilionScore } from '../scoring/summerScoring';

// Couleurs Summer Pavilion (ajoute le joker)
const SUMMER_COLORS: TileColor[] = ['blue', 'yellow', 'red', 'black', 'teal', 'green'];
const JOKER_COLOR = 'joker';
const MAX_ROUNDS = 6;

function getJokerColorForRound(round: number): TileColor {
  // La couleur joker change à chaque manche, cyclique sur SUMMER_COLORS
  return SUMMER_COLORS[(round - 1) % SUMMER_COLORS.length];
}

function createSummerTiles(): Tile[] {
  // 22 tuiles de chaque couleur + 4 jokers
  let tiles: Tile[] = [];
  SUMMER_COLORS.forEach(color => {
    for (let i = 0; i < 22; i++) {
      tiles.push({ id: `${color}-${i}`, color });
    }
  });
  for (let i = 0; i < 4; i++) {
    tiles.push({ id: `joker-${i}`, color: JOKER_COLOR as TileColor });
  }
  return tiles;
}

function createSummerPlayer(id: string, name: string): Player {
  // TODO: Plateau hexagonal, rosettes, etc.
  return {
    id,
    name,
    board: {
      patternLines: [], // Pas utilisé dans Summer Pavilion
      wall: [], // À remplacer par la structure hexagonale
      floorLine: [],
      score: 0,
    },
  };
}

export class SummerPavilionEngine implements AzulGameEngine {
  initializeGame(players: string[]): GameState {
    // Création des joueurs
    const playerObjs: Player[] = players.map((name, i) =>
      createSummerPlayer(`summer-${i}`, name)
    );
    // Création des tuiles
    const tiles = createSummerTiles();
    // Manche 1, couleur joker initiale
    const roundNumber = 1;
    const jokerColor = getJokerColorForRound(roundNumber);
    return {
      players: playerObjs,
      factories: [], // À remplir
      center: [],
      bag: tiles,
      discardPile: [],
      currentPlayer: playerObjs[0].id,
      gamePhase: 'drafting',
      firstPlayerToken: null,
      roundNumber,
      jokerColor,
      maxRounds: MAX_ROUNDS,
    };
  }

  canSelectTiles(gameState: GameState, factoryId: number | null, color: TileColor): boolean {
    // On ne peut pas prendre la couleur joker de la manche
    if (color === gameState.jokerColor) return false;
    if (factoryId !== null) {
      const factory = gameState.factories.find(f => f.id === factoryId);
      if (!factory) return false;
      // Peut-on prendre cette couleur ?
      return factory.tiles.some(t => t.color === color);
    } else {
      // Centre
      return gameState.center.some(t => t.color === color);
    }
  }

  applyMove(gameState: GameState, move: any): GameState {
    // move = { factoryId, color }
    // PHASE 1 : Récupérer des tuiles
    if (gameState.gamePhase === 'drafting') {
      let newState = { ...gameState };
      let tilesTaken: Tile[] = [];
      let jokerTaken: Tile | null = null;
      if (move.factoryId !== null) {
        // Prise dans une fabrique
        const factory = newState.factories.find(f => f.id === move.factoryId);
        if (!factory) return gameState;
        // Prendre toutes les tuiles de la couleur (hors joker)
        tilesTaken = factory.tiles.filter(t => t.color === move.color);
        // Prendre une tuile joker si présente
        const jokers = factory.tiles.filter(t => t.color === newState.jokerColor);
        if (jokers.length > 0) {
          jokerTaken = jokers[0];
        }
        // Si on ne prend que des jokers, on ne peut en prendre qu'une
        if (move.color === newState.jokerColor) {
          tilesTaken = [factory.tiles.find(t => t.color === newState.jokerColor)!];
        }
        // Mettre les autres tuiles au centre
        const toCenter = factory.tiles.filter(t => !tilesTaken.includes(t) && t !== jokerTaken);
        newState.center = [...newState.center, ...toCenter];
        // Vider la fabrique
        factory.tiles = [];
      } else {
        // Prise dans le centre
        tilesTaken = newState.center.filter(t => t.color === move.color);
        const jokers = newState.center.filter(t => t.color === newState.jokerColor);
        if (jokers.length > 0) {
          jokerTaken = jokers[0];
        }
        if (move.color === newState.jokerColor) {
          tilesTaken = [newState.center.find(t => t.color === newState.jokerColor)!];
        }
        // Retirer les tuiles prises du centre
        newState.center = newState.center.filter(t => !tilesTaken.includes(t) && t !== jokerTaken);
        // Premier joueur à prendre au centre
        if (!newState.firstPlayerToken) {
          newState.firstPlayerToken = newState.currentPlayer;
          // Pénalité : perdre autant de points que de tuiles prises
          const player = newState.players.find(p => p.id === newState.currentPlayer);
          if (player) {
            player.board.score = Math.max(1, player.board.score - (tilesTaken.length + (jokerTaken ? 1 : 0)));
          }
        }
      }
      // Ajouter les tuiles prises au "stock" du joueur (à côté du plateau)
      const player = newState.players.find(p => p.id === gameState.currentPlayer);
      if (player) {
        if (!player.board.collectedTiles) player.board.collectedTiles = [];
        player.board.collectedTiles = [
          ...player.board.collectedTiles,
          ...tilesTaken,
          ...(jokerTaken ? [jokerTaken] : [])
        ];
      }
      // Passer au joueur suivant
      const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
      const nextIdx = (idx + 1) % newState.players.length;
      newState.currentPlayer = newState.players[nextIdx].id;
      // Fin de la phase 1 ?
      const allFactoriesEmpty = newState.factories.every(f => f.tiles.length === 0);
      const centerEmpty = newState.center.length === 0;
      if (allFactoriesEmpty && centerEmpty) {
        newState.gamePhase = 'tiling';
        // TODO: Passer à la phase 2 (placement)
      }
      return newState;
    }
    // PHASE 2 : Placement (TODO)
    // PHASE 3 : Préparation de la manche suivante (TODO)
    return gameState;
  }

  // Changement de manche, changement de couleur joker
  prepareNextRound(gameState: GameState): GameState {
    let newState = { ...gameState };
    if ((newState.roundNumber || 1) < (newState.maxRounds || 6)) {
      newState.roundNumber = (newState.roundNumber || 1) + 1;
      newState.jokerColor = getJokerColorForRound(newState.roundNumber);
      // TODO: Remplir les fabriques avec 4 tuiles chacune, vider le centre, remettre le marqueur premier joueur au centre
      // TODO: Remettre les tuiles conservées dans les coins à côté du plateau
      // Réinitialiser les collectedTiles de chaque joueur
      newState.players.forEach(p => { p.board.collectedTiles = []; });
      newState.gamePhase = 'drafting';
    } else {
      newState.gamePhase = 'gameEnd';
    }
    return newState;
  }

  canPlaceTiles(gameState: GameState, patternLineIndex: number, selectedTiles: Tile[]): boolean {
    // TODO: Placement spécifique
    return true;
  }

  mustPlaceInFloorLine(gameState: GameState, selectedTiles: Tile[]): boolean {
    // TODO: Règle spécifique
    return false;
  }

  calculateScore(gameState: GameState): number {
    return calculateSummerPavilionScore(gameState);
  }
} 