import { AzulGameEngine } from '../../models/AzulGameEngine';
import { GameState, TileColor, Tile, Player } from '../../models/types';
import { calculateSummerPavilionScore } from '../scoring/summerScoring';
import { shuffle } from '../utils';

// Couleurs Summer Pavilion officielles (violet, vert, orange, jaune, bleu, rouge)
const SUMMER_COLORS: TileColor[] = ['purple', 'green', 'orange', 'yellow', 'blue', 'red'];
const JOKER_COLOR = 'joker';
const MAX_ROUNDS = 6;

// Ordre des couleurs joker pour les 6 manches (officiel)
const JOKER_COLORS: TileColor[] = ['purple', 'green', 'orange', 'yellow', 'blue', 'red'];

// Coût des espaces (1 à 6)
const SPACE_COSTS = [1, 2, 3, 4, 5, 6];

function getJokerColorForRound(round: number): TileColor {
  // round: 1 à 6 => index 0 à 5
  const safeRound = Math.max(1, Math.min(6, round));
  return JOKER_COLORS[safeRound - 1];
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

const createSummerFactories = (playerCount: number) => {
  const factoryCount = playerCount * 2 + 1;
  const factories = [];
  
  for (let i = 0; i < factoryCount; i++) {
    factories.push({
      id: i,
      tiles: []
    });
  }
  
  return factories;
};

export class SummerPavilionEngine implements AzulGameEngine {
  initializeGame(players: string[]): GameState {
    // Création des joueurs
    const playerObjs: Player[] = players.map((name, i) =>
      createSummerPlayer(`summer-${i}`, name)
    );
    
    // Création des tuiles
    const tiles = createSummerTiles();

    // Shuffle the tiles
    const shuffledTiles = shuffle(tiles);

    // Create factories
    const factories = createSummerFactories(players.length);

    // Manche 1, couleur joker initiale
    const roundNumber = 1;

    // Create initial game state
    let gameState: GameState = {
      players: playerObjs,
      factories: factories,
      center: [],
      bag: shuffledTiles,
      discardPile: [],
      currentPlayer: playerObjs[0].id,
      gamePhase: "drafting",
      firstPlayerToken: null,
      roundNumber: 1,
      jokerColor: getJokerColorForRound(roundNumber),
      maxRounds: MAX_ROUNDS,
    };

    // Distribute tiles to factories
    gameState = this.distributeFactoryTiles(gameState);

    return gameState;
  }

  handleRoundEnd(gameState: GameState): GameState {
    let newState = { ...gameState };
    if (gameState.gamePhase === 'drafting') {
      newState.gamePhase = 'tiling';
      return newState;
    }
    return newState;
  }

  canSelectTiles(gameState: GameState, factoryId: number | null, color: TileColor): boolean {
    // Vérifications de base
    if (gameState.gamePhase !== 'drafting') return false;

    // Détermine la source (factory ou centre)
    const source = factoryId !== null
      ? gameState.factories.find(f => f.id === factoryId)?.tiles || []
      : gameState.center;

    // Vérifie si la couleur est disponible dans la source
    const hasColor = source.some(t => t.color === color);
    if (!hasColor) return false;

    // La couleur joker actuelle
    const jokerColor = gameState.jokerColor;

    // Si on essaie de sélectionner la couleur joker directement
    if (color === jokerColor) {
      // On ne peut sélectionner que 1 tuile joker si c'est tout ce qui reste
      const hasOnlyJokers = source.every(t => t.color === jokerColor);
      return hasOnlyJokers;
    }

    // Règle normale : on peut sélectionner des tuiles non-joker
    return true;
  }

  applyMove(gameState: GameState, move: any): GameState {
    // PHASE 1 : Récupérer des tuiles (move = { factoryId, color })
    if (gameState.gamePhase === 'drafting') {
      let newState = { ...gameState };
      const currentPlayer = newState.players.find(p => p.id === newState.currentPlayer);
      if (!currentPlayer) return gameState;

      // Initialiser collectedTiles si pas encore fait
      if (!currentPlayer.board.collectedTiles) {
        currentPlayer.board.collectedTiles = [];
      }

      const { factoryId, color } = move;
      const jokerColor = newState.jokerColor;

      if (factoryId !== null) {
        // Sélection depuis une fabrique
        const factoryIndex = newState.factories.findIndex(f => f.id === factoryId);
        if (factoryIndex === -1) return gameState;

        const factory = newState.factories[factoryIndex];
        
        // Sélectionne toutes les tuiles de la couleur choisie
        const selectedTiles = factory.tiles.filter(t => t.color === color);
        
        // Si on ne sélectionne pas directement des jokers, il faut prendre une tuile joker si présente
        if (color !== jokerColor) {
          const jokerTiles = factory.tiles.filter(t => t.color === jokerColor);
          // Si jokers présents, ajoute un seul joker à la sélection
          if (jokerTiles.length > 0) {
            selectedTiles.push(jokerTiles[0]);
          }
        } else {
          // Si on sélectionne des jokers directement, on ne peut en prendre qu'un seul
          // (uniquement possible s'il n'y a que des jokers dans la fabrique)
          while (selectedTiles.length > 1) {
            selectedTiles.pop();
          }
        }
        
        // Retire toutes les tuiles sélectionnées de la fabrique
        const remainingTiles = factory.tiles.filter(t => 
          !selectedTiles.includes(t)
        );
        
        // Ajoute les tuiles sélectionnées au joueur
        currentPlayer.board.collectedTiles = [
          ...currentPlayer.board.collectedTiles,
          ...selectedTiles
        ];
        
        // Met à jour la fabrique et le centre
        newState.factories = [
          ...newState.factories.slice(0, factoryIndex),
          { ...factory, tiles: [] },
          ...newState.factories.slice(factoryIndex + 1)
        ];
        newState.center = [...newState.center, ...remainingTiles];
      } else {
        // Sélection depuis le centre
        // Sélectionne toutes les tuiles de la couleur choisie
        const selectedTiles = newState.center.filter(t => t.color === color);
        
        // Si on prend au centre et que personne n'a encore pris le marqueur premier joueur
        let pointPenalty = 0;
        if (newState.firstPlayerToken === null) {
          newState.firstPlayerToken = currentPlayer.id;
          
          // Pénalité de points égale au nombre de tuiles prises
          pointPenalty = selectedTiles.length;
          
          // Si on prend une couleur normale et qu'il y a des jokers, on en prend un
          const jokerInCenter = newState.center.find(t => t.color === jokerColor);
          if (color !== jokerColor && jokerInCenter) {
            pointPenalty += 1; // Un joker de plus
          }
          
          // Pénalité limitée par la position de score (pas en dessous de 1)
          const newScore = Math.max(1, currentPlayer.board.score - pointPenalty);
          currentPlayer.board.score = newScore;
        }
        
        // Si on ne sélectionne pas directement des jokers, il faut prendre une tuile joker si présente
        if (color !== jokerColor) {
          const jokerTiles = newState.center.filter(t => t.color === jokerColor);
          // Si jokers présents, ajoute un seul joker à la sélection
          if (jokerTiles.length > 0) {
            selectedTiles.push(jokerTiles[0]);
          }
        } else {
          // Si on sélectionne des jokers directement, on ne peut en prendre qu'un seul
          // (uniquement possible s'il n'y a que des jokers dans le centre)
          while (selectedTiles.length > 1) {
            selectedTiles.pop();
          }
        }
        
        // Retire toutes les tuiles sélectionnées du centre
        newState.center = newState.center.filter(t => 
          !selectedTiles.includes(t)
        );
        
        // Ajoute les tuiles sélectionnées au joueur
        currentPlayer.board.collectedTiles = [
          ...currentPlayer.board.collectedTiles,
          ...selectedTiles
        ];
      }

      // Passe au joueur suivant
      const currentPlayerIndex = newState.players.findIndex(p => p.id === newState.currentPlayer);
      const nextPlayerIndex = (currentPlayerIndex + 1) % newState.players.length;
      newState.currentPlayer = newState.players[nextPlayerIndex].id;

      // Vérifie si toutes les tuiles ont été prises pour passer à la phase 2
      const factoriesEmpty = newState.factories.every(f => f.tiles.length === 0);
      const centerEmpty = newState.center.length === 0;
      
      if (factoriesEmpty && centerEmpty) {
        newState.gamePhase = 'tiling';
        // Le joueur avec le marqueur Premier joueur commence la phase de placement
        if (newState.firstPlayerToken) {
          newState.currentPlayer = newState.firstPlayerToken;
        }
      }

      return newState;
    }
    
    // PHASE 2 : Placement tour par tour (move = { color, targetFlower, targetPos, cost })
    if (gameState.gamePhase === 'tiling') {
      let newState = { ...gameState };
      const player = newState.players.find(p => p.id === newState.currentPlayer);
      if (!player) return gameState;
      
      // Si le joueur n'a plus de tuiles à placer, passe son tour
      if (!player.board.collectedTiles || player.board.collectedTiles.length === 0) {
        // Passe au joueur suivant
        const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
        const nextIdx = (idx + 1) % newState.players.length;
        newState.currentPlayer = newState.players[nextIdx].id;
        return newState;
      }

      // Si c'est une action "passer" (move = { pass: true, keepTiles: [...] })
      if (move.pass) {
        // Le joueur garde jusqu'à 4 tuiles pour la prochaine manche
        const tilesToKeep = move.keepTiles || [];
        
        // Perds 1 point par tuile défaussée
        const tilesToDiscard = player.board.collectedTiles.filter(
          t => !tilesToKeep.some((kt: Tile) => kt.id === t.id)
        );
        
        // Met à jour le score (minimum 1)
        player.board.score = Math.max(1, player.board.score - tilesToDiscard.length);
        
        // Défausse les tuiles non conservées
        newState.discardPile = [...newState.discardPile, ...tilesToDiscard];
        
        // Met de côté les tuiles conservées pour la prochaine manche
        player.board.collectedTiles = [];
        player.board.savedTiles = tilesToKeep.slice(0, 4);
        
        // Passe au joueur suivant
        const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
        const nextIdx = (idx + 1) % newState.players.length;
        newState.currentPlayer = newState.players[nextIdx].id;
        
        // Vérifie si tous les joueurs ont passé
        const allPassed = newState.players.every(p => !p.board.collectedTiles || p.board.collectedTiles.length === 0);
        if (allPassed) {
          return this.prepareNextRound(newState);
        }
        
        return newState;
      }

      // Placement normal d'une tuile (move = { color, targetFlower, targetPos, cost })
      const { color, targetFlower, targetPos, cost } = move;
      
      // Vérifie si le joueur a les tuiles nécessaires
      const availableTiles = player.board.collectedTiles;
      const jokerColor = newState.jokerColor || 'joker';
      
      // On doit avoir au moins une tuile de la couleur exacte (sauf si on place un joker)
      const hasExactColor = availableTiles.some(t => t.color === color);
      const hasJokers = availableTiles.filter(t => t.color === jokerColor);
      
      if (!hasExactColor && color !== jokerColor) return gameState;
      
      // Vérifie si on a assez de tuiles pour payer le coût
      if ((hasExactColor ? 1 : 0) + hasJokers.length < cost) return gameState;
      
      // Prépare les tuiles à dépenser
      const tilesToPlace: Tile[] = [];
      let colorTiles = availableTiles.filter(t => t.color === color);
      let jokerTiles = availableTiles.filter(t => t.color === jokerColor);
      
      // Une tuile de la couleur exacte + possiblement des jokers
      if (hasExactColor) {
        tilesToPlace.push(colorTiles[0]);
        // Complète avec des jokers si besoin
        for (let i = 1; i < cost && jokerTiles.length > 0; i++) {
          tilesToPlace.push(jokerTiles.shift()!);
        }
      } else {
        // Placement direct d'un joker (doit aller sur un espace de la couleur joker)
        tilesToPlace.push(jokerTiles[0]);
      }
      
      // Simuler le plateau Summer Pavilion : stocke les placements dans board.placedTiles
      if (!player.board.placedTiles) player.board.placedTiles = [];
      player.board.placedTiles.push({
        color: color,
        flower: targetFlower,
        pos: targetPos,
      });
      
      // Retire les tuiles dépensées du bag
      const remainingTiles = [...player.board.collectedTiles];
      for (const tile of tilesToPlace) {
        const idx = remainingTiles.findIndex(t => t.id === tile.id);
        if (idx !== -1) {
          remainingTiles.splice(idx, 1);
        }
      }
      player.board.collectedTiles = remainingTiles;
      
      // Défausse les tuiles utilisées pour le coût (sauf celle placée)
      const tilesToDefausse = tilesToPlace.slice(1);
      newState.discardPile = [...newState.discardPile, ...tilesToDefausse];
      
      // Calcul des points (adjacence, bonus, etc.)
      let points = 1; // Le point de base pour la tuile placée
      
      // 1. Adjacences dans la même fleur
      const placed = player.board.placedTiles || [];
      const adjacentsInSameFlower = placed.filter(pt => {
        // Même fleur, position voisine
        return pt.flower === targetFlower && Math.abs(pt.pos - targetPos) === 1;
      });
      points += adjacentsInSameFlower.length;
      
      // 2. Adjacences entre fleurs
      // Les fleurs sont disposées en cercle: 0-1-2-3-4-5-0
      const adjacentFlowers = [
        (targetFlower + 1) % 6, // Fleur suivante
        (targetFlower + 5) % 6  // Fleur précédente (6-1=5)
      ];
      
      // Pour chaque fleur adjacente, chercher si la même position a une tuile
      const adjacentsBetweenFlowers = placed.filter(pt => 
        adjacentFlowers.includes(pt.flower) && pt.pos === targetPos
      );
      points += adjacentsBetweenFlowers.length;
      
      // 3. Bonus rosette : si la fleur est complète après ce placement
      const tilesOnFlower = placed.filter(pt => pt.flower === targetFlower).length;
      if (tilesOnFlower === 6) { // 6 positions par fleur
        // Bonus Rosette variable selon la couleur de la fleur
        const rosetteBonuses = [14, 16, 17, 18, 20, 15]; // rouge, jaune, orange, vert, violet, bleu
        points += rosetteBonuses[targetFlower];
      }
      
      // 4. Bonus pilier : si cette tuile complète un pilier (toutes les fleurs ont une tuile à la même position)
      const allFlowers = [0, 1, 2, 3, 4, 5];
      const isPillarComplete = allFlowers.every(flower => 
        placed.some(tile => tile.flower === flower && tile.pos === targetPos)
      );
      
      if (isPillarComplete) {
        points += 8; // Bonus pilier
      }
      
      // 5. Bonus pour compléter les coûts
      // Si cette tuile complète un ensemble de tuiles du même coût à travers toutes les fleurs
      const isCostSetComplete = allFlowers.every(flower => 
        placed.some(tile => tile.flower === flower && tile.pos === targetPos)
      );
      
      if (isCostSetComplete) {
        // Bonus selon le coût (1-6)
        const costBonus = [4, 8, 12, 16, 20, 24]; // Bonus pour coûts 1, 2, 3, 4, 5, 6
        points += costBonus[targetPos];
      }
      
      // Mise à jour du score
      player.board.score += points;
      
      // Passer au joueur suivant qui a encore des tuiles
      const idx = newState.players.findIndex(p => p.id === newState.currentPlayer);
      let nextIdx = (idx + 1) % newState.players.length;
      
      // Si tous les joueurs ont passé ou n'ont plus de tuiles
      const anyoneHasTiles = newState.players.some(p => 
        p.board.collectedTiles && p.board.collectedTiles.length > 0
      );
      
      if (!anyoneHasTiles) {
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
    
    // PHASE 3 : Préparation de la manche suivante
    return gameState;
  }

  prepareNextRound(gameState: GameState): GameState {
    let newState = { ...gameState };
    
    // Incrémente le numéro de manche
    newState.roundNumber += 1;
    
    // Vérifie si c'est la fin de la partie (après 6 manches)
    if (newState.roundNumber > 6) {
      newState.gamePhase = 'gameEnd';
      // Calcul du score final
      return this.calculateFinalScore(newState);
    }
    
    // Réinitialise la phase à "drafting"
    newState.gamePhase = 'drafting';
    
    // Met à jour la couleur joker pour la nouvelle manche
    newState.jokerColor = getJokerColorForRound(newState.roundNumber);
    
    // Réinitialise le marqueur premier joueur
    // Si un joueur avait le marqueur, il commence la nouvelle manche
    const firstPlayer = newState.firstPlayerToken 
      ? newState.players.find(p => p.id === newState.firstPlayerToken)
      : null;
      
    if (firstPlayer) {
      newState.currentPlayer = firstPlayer.id;
    }
    
    newState.firstPlayerToken = null;
    
    // Récupère les tuiles sauvegardées par les joueurs
    newState.players = newState.players.map(player => {
      return {
        ...player,
        board: {
          ...player.board,
          collectedTiles: player.board.savedTiles || [],
          savedTiles: [],
        }
      };
    });
    
    // Remplir le sac si nécessaire
    if (newState.bag.length < newState.factories.length * 4) {
      newState.bag = [...newState.bag, ...newState.discardPile];
      newState.discardPile = [];
      
      // Mélange le sac
      newState.bag = this.shuffle(newState.bag);
    }
    
    // Distribue les tuiles aux fabriques
    newState = this.distributeFactoryTiles(newState);
    
    return newState;
  }
  
  distributeFactoryTiles(gameState: GameState): GameState {
    const newState = { ...gameState };
    
    // Pour chaque fabrique
    for (let i = 0; i < newState.factories.length; i++) {
      // Piocher 4 tuiles aléatoires du sac
      const tiles: Tile[] = [];
      for (let j = 0; j < 4 && newState.bag.length > 0; j++) {
        const randomIndex = Math.floor(Math.random() * newState.bag.length);
        tiles.push(newState.bag[randomIndex]);
        newState.bag.splice(randomIndex, 1);
      }
      
      // Mettre à jour la fabrique
      newState.factories[i] = {
        ...newState.factories[i],
        tiles,
      };
    }
    
    return newState;
  }
  
  shuffle<T>(array: T[]): T[] {
    return shuffle(array);
  }
  
  calculateFinalScore(gameState: GameState): GameState {
    let newState = { ...gameState };
    
    // Pour chaque joueur
    newState.players = newState.players.map(player => {
      let finalScore = player.board.score;
      const placedTiles = player.board.placedTiles || [];
      
      // Bonus pour les étoiles complètes
      // Étoile centrale (multicolore) : 12 points
      const centerStarComplete = this.isStarComplete(placedTiles, -1);
      if (centerStarComplete) finalScore += 12;
      
      // Autres étoiles (14-20 points selon la couleur)
      const starBonuses = [14, 16, 17, 18, 20, 15]; // rouge, jaune, orange, vert, violet, bleu
      for (let i = 0; i < 6; i++) {
        if (this.isStarComplete(placedTiles, i)) {
          finalScore += starBonuses[i];
        }
      }
      
      // Bonus pour tous les espaces de même coût
      const costBonuses = [4, 8, 12, 16, 0, 0]; // espaces 1, 2, 3, 4, (5, 6 n'ont pas de bonus)
      for (let cost = 1; cost <= 4; cost++) {
        if (this.allCostSpacesFilled(placedTiles, cost)) {
          finalScore += costBonuses[cost - 1];
        }
      }
      
      // Pénalité pour les tuiles non utilisées
      const unusedTiles = (player.board.savedTiles || []).length;
      finalScore = Math.max(1, finalScore - unusedTiles);
      
      return {
        ...player,
        board: {
          ...player.board,
          score: finalScore,
        }
      };
    });
    
    return newState;
  }
  
  isStarComplete(placedTiles: { color: TileColor; flower: number; pos: number }[], flowerIndex: number): boolean {
    const tilesOnFlower = placedTiles.filter(t => t.flower === flowerIndex);
    return tilesOnFlower.length === 6; // 6 positions par étoile
  }
  
  allCostSpacesFilled(placedTiles: { color: TileColor; flower: number; pos: number }[], cost: number): boolean {
    // Dans Summer Pavilion, chaque étoile a une position de chaque coût (1 à 6)
    // Le coût est lié à la position dans la fleur (0-5 correspond aux coûts 1-6)
    const flowers = [0, 1, 2, 3, 4, 5]; // Les 6 fleurs

    // La position cost-1 correspond au coût 'cost'
    const costPosition = cost - 1;
    
    // Vérifier si chaque fleur a une tuile à la position du coût spécifié
    return flowers.every(flower => 
      placedTiles.some(tile => tile.flower === flower && tile.pos === costPosition)
    );
  }
  
  canPlaceTiles(gameState: GameState, placement: any, selectedTiles: Tile[]): boolean {
    // Vérifie si on est en phase de placement
    if (gameState.gamePhase !== 'tiling') return false;
    
    // Vérifie si le joueur est le joueur actif
    const player = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (!player) return false;
    
    // Si c'est une action "passer", c'est toujours valide
    if (placement.pass) return true;
    
    const { color, targetFlower, targetPos, cost } = placement;
    
    // Vérifier si l'emplacement est libre
    const placedTiles = player.board.placedTiles || [];
    const isOccupied = placedTiles.some(pt => pt.flower === targetFlower && pt.pos === targetPos);
    if (isOccupied) return false;
    
    // Vérifier si la couleur est valide pour cette fleur
    // Dans Summer Pavilion, chaque fleur a une couleur assignée, mais le joker peut aller n'importe où
    const jokerColor = gameState.jokerColor || 'joker';
    
    // Si c'est le joker de la manche, il peut aller dans sa fleur correspondante
    if (color === jokerColor) {
      return targetFlower === SUMMER_COLORS.indexOf(color as TileColor);
    }
    
    // Pour les couleurs normales, vérifier si elles correspondent à la fleur
    // Ou si la couleur est le joker (peut aller n'importe où)
    const flowerColor = SUMMER_COLORS[targetFlower];
    if (color !== flowerColor && color !== 'joker') return false;
    
    // Vérifier le coût
    // Le coût réel est basé sur la position: position 0-5 correspond aux coûts 1-6
    const actualCost = targetPos + 1;
    
    // Vérifier si le joueur a suffisamment de tuiles
    // Pour un coût de N, il faut N tuiles (dont au moins une de la bonne couleur, le reste peut être des jokers)
    const availableTiles = player.board.collectedTiles || [];
    const colorTiles = availableTiles.filter(t => t.color === color);
    const jokerTiles = availableTiles.filter(t => t.color === jokerColor);
    
    // Il faut au moins une tuile de la couleur exacte (sauf si on place directement un joker)
    const hasColorTile = colorTiles.length > 0 || color === jokerColor;
    
    // Nombre total de tuiles disponibles pour payer le coût
    let availableCount = 0;
    if (color === jokerColor) {
      // Si on place un joker, on n'a besoin que d'une seule tuile
      availableCount = jokerTiles.length;
    } else {
      // Sinon, on utilise une tuile de la couleur + des jokers au besoin
      availableCount = colorTiles.length + jokerTiles.length;
    }
    
    // Vérifier si le joueur a assez de tuiles pour payer le coût
    return hasColorTile && availableCount >= actualCost;
  }
  
  mustPlaceInFloorLine(gameState: GameState, selectedTiles: Tile[]): boolean {
    // Summer Pavilion n'a pas de ligne de sol
    return false;
  }
  
  calculateScore(gameState: GameState): number {
    // Pour chaque joueur, somme des scores
    return gameState.players.reduce((total, player) => total + player.board.score, 0);
  }
} 