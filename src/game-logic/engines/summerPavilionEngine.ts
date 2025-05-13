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
    // move = { factoryId, color } en drafting
    // move = { color, targetFlower, targetPos } en tiling
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
    // PHASE 2 : Placement tour par tour
    if (gameState.gamePhase === 'tiling') {
      let newState = { ...gameState };
      const player = newState.players.find(p => p.id === newState.currentPlayer);
      if (!player) return gameState;
      if (!player.board.collectedTiles || player.board.collectedTiles.length === 0) {
        // Si le joueur n'a plus de tuiles à placer, passer au suivant
        const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
        const nextIdx = (idx + 1) % newState.players.length;
        newState.currentPlayer = newState.players[nextIdx].id;
        return newState;
      }
      // Vérifier que la tuile à placer est bien dans le bag
      const tileIdx = player.board.collectedTiles.findIndex(t => t.color === move.color);
      if (tileIdx === -1) return gameState;
      // Simuler le plateau Summer Pavilion : on stocke les placements dans board.placedTiles (à créer si besoin)
      if (!player.board.placedTiles) player.board.placedTiles = [];
      player.board.placedTiles.push({
        color: move.color,
        flower: move.targetFlower,
        pos: move.targetPos,
      });
      // Retirer la tuile du bag
      player.board.collectedTiles.splice(tileIdx, 1);
      // Calcul des points (adjacence, bonus, etc.)
      // Calculer la position absolue de la tuile sur le plateau (pour l'adjacence)
      // On suppose que chaque fleur a 6 positions, et qu'il y a 6 fleurs autour du centre
      // Pour la démo, on fait un calcul simple : +1 pour la tuile, +1 par tuile adjacente orthogonale
      let points = 1;
      // Chercher les tuiles adjacentes (dans placedTiles)
      const placed = player.board.placedTiles || [];
      const adjacents = placed.filter(pt => {
        // Même fleur, position voisine
        if (pt.flower === move.targetFlower && Math.abs(pt.pos - move.targetPos) === 1) return true;
        // TODO : gérer les adjacences entre fleurs (pour le vrai jeu)
        return false;
      });
      points += adjacents.length;
      // Bonus rosette : si la fleur est complète après ce placement
      const tilesOnFlower = placed.filter(pt => pt.flower === move.targetFlower).length;
      if (tilesOnFlower === 6) {
        points += 1; // Bonus rosette (à ajuster selon la règle)
      }
      // Bonus centre (si on place au centre, à adapter si besoin)
      if (move.targetFlower === -1) {
        points += 1;
      }
      player.board.score += points;
      // Passer au joueur suivant
      const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
      let nextIdx = (idx + 1) % newState.players.length;
      // Si tous les bags sont vides, fin de la phase
      const allBagsEmpty = newState.players.every(p => !p.board.collectedTiles || p.board.collectedTiles.length === 0);
      if (allBagsEmpty) {
        // Préparer la manche suivante
        return this.prepareNextRound(newState);
      } else {
        // Passer au prochain joueur qui a encore des tuiles
        let tries = 0;
        while (tries < newState.players.length) {
          const nextPlayer = newState.players[nextIdx];
          if (nextPlayer && nextPlayer.board && nextPlayer.board.collectedTiles && nextPlayer.board.collectedTiles.length > 0) {
            break;
          }
          nextIdx = (nextIdx + 1) % newState.players.length;
          tries++;
        }
        newState.currentPlayer = newState.players[nextIdx].id;
      }
      return newState;
    }
    // PHASE 3 : Préparation de la manche suivante (inchangé)
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