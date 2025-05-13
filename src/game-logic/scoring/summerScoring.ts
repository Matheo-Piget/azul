// Logique de scoring spécifique à Azul : Summer Pavilion
import { GameState, TileColor } from '../../models/types';

export function calculateSummerPavilionScore(gameState: GameState): number {
  // Calculer la somme des scores de tous les joueurs
  return gameState.players.reduce((totalScore, player) => {
    // Points de base du joueur
    let playerScore = player.board.score;
    
    // Si on est en fin de partie, on ajoute les bonus
    if (gameState.gamePhase === 'gameEnd') {
      const placedTiles = player.board.placedTiles || [];
      
      // Bonus pour les étoiles complètes
      // Étoile centrale (multicolore) : 12 points
      const centerStarComplete = isStarComplete(placedTiles, -1);
      if (centerStarComplete) playerScore += 12;
      
      // Autres étoiles (14-20 points selon la couleur)
      const starBonuses = [14, 16, 17, 18, 20, 15]; // rouge, jaune, orange, vert, violet, bleu
      for (let i = 0; i < 6; i++) {
        if (isStarComplete(placedTiles, i)) {
          playerScore += starBonuses[i];
        }
      }
      
      // Bonus pour tous les espaces de même coût
      const costBonuses = [4, 8, 12, 16, 20, 24]; // espaces 1, 2, 3, 4, 5, 6
      for (let cost = 1; cost <= 6; cost++) {
        if (allCostSpacesFilled(placedTiles, cost)) {
          playerScore += costBonuses[cost - 1];
        }
      }
      
      // Bonus pour sculptures (piliers, statues, fenêtres)
      const pillarBonus = calculatePillarBonus(placedTiles);
      const statueBonus = calculateStatueBonus(placedTiles);
      const windowBonus = calculateWindowBonus(placedTiles);
      
      playerScore += pillarBonus + statueBonus + windowBonus;
      
      // Pénalité pour les tuiles non utilisées
      const unusedTiles = (player.board.savedTiles || []).length;
      playerScore = Math.max(1, playerScore - unusedTiles);
    }
    
    return totalScore + playerScore;
  }, 0);
}

// Vérifie si une étoile est complète (toutes les 6 positions remplies)
function isStarComplete(placedTiles: { color: TileColor; flower: number; pos: number }[], flowerIndex: number): boolean {
  const tilesOnFlower = placedTiles.filter(t => t.flower === flowerIndex);
  return tilesOnFlower.length === 6; // 6 positions par étoile
}

// Vérifie si tous les espaces d'un même coût sont remplis
function allCostSpacesFilled(placedTiles: { color: TileColor; flower: number; pos: number }[], cost: number): boolean {
  // Dans Summer Pavilion, chaque étoile a une position de chaque coût (1 à 6)
  // On vérifie que pour chaque fleur, la position correspondant au coût est remplie
  const flowers = [0, 1, 2, 3, 4, 5]; // Les 6 fleurs
  
  // Chaque position dans une fleur a un coût spécifique
  // La position cost-1 correspond au coût 'cost'
  const costPosition = cost - 1;
  
  // Vérifie si chaque fleur a une tuile à la position du coût spécifié
  return flowers.every(flower => 
    placedTiles.some(tile => tile.flower === flower && tile.pos === costPosition)
  );
}

// Calcule les bonus pour les piliers (colonnes verticales)
function calculatePillarBonus(placedTiles: { color: TileColor; flower: number; pos: number }[]): number {
  // Un pilier est formé lorsque toutes les fleurs ont une tuile à la même position
  let bonus = 0;
  
  // Pour chaque position possible (0-5)
  for (let pos = 0; pos < 6; pos++) {
    const flowers = [0, 1, 2, 3, 4, 5]; // Les 6 fleurs
    
    // Vérifie si toutes les fleurs ont une tuile à cette position
    const isPillarComplete = flowers.every(flower => 
      placedTiles.some(tile => tile.flower === flower && tile.pos === pos)
    );
    
    if (isPillarComplete) {
      // Le bonus pour un pilier complet est de 8 points
      bonus += 8;
    }
  }
  
  return bonus;
}

// Calcule les bonus pour les statues (tuiles adjacentes de même couleur)
function calculateStatueBonus(placedTiles: { color: TileColor; flower: number; pos: number }[]): number {
  // Les statues sont des regroupements de tuiles adjacentes de même couleur
  // Pour simplifier, on considère uniquement les paires de tuiles adjacentes
  const checkedPairs = new Set<string>();
  let bonus = 0;
  
  // On examine chaque tuile placée
  for (const tile of placedTiles) {
    // On regarde les tuiles adjacentes de même couleur
    for (const otherTile of placedTiles) {
      // Même tuile, on passe
      if (tile === otherTile) continue;
      
      // Si même couleur et adjacentes
      if (tile.color === otherTile.color && areTilesAdjacent(tile, otherTile)) {
        // Créer une clé unique pour la paire (peu importe l'ordre)
        const pairKey = [tile, otherTile]
          .sort((a, b) => (a.flower * 10 + a.pos) - (b.flower * 10 + b.pos))
          .map(t => `${t.flower}-${t.pos}`)
          .join('|');
        
        // Si cette paire n'a pas déjà été comptée
        if (!checkedPairs.has(pairKey)) {
          checkedPairs.add(pairKey);
          // Bonus de 2 points par paire de tuiles adjacentes de même couleur
          bonus += 2;
        }
      }
    }
  }
  
  return bonus;
}

// Calcule les bonus pour les fenêtres (ensemble de tuiles qui forment un motif spécifique)
function calculateWindowBonus(placedTiles: { color: TileColor; flower: number; pos: number }[]): number {
  // Les fenêtres sont des configurations particulières de tuiles
  // Pour simplifier, on considère qu'une fenêtre est formée lorsqu'une fleur
  // contient 3 tuiles ou plus de la même couleur
  let bonus = 0;
  
  // Pour chaque fleur
  for (let flower = 0; flower < 6; flower++) {
    // Compter les tuiles par couleur dans cette fleur
    const tilesByColor: Record<string, number> = {};
    
    placedTiles
      .filter(tile => tile.flower === flower)
      .forEach(tile => {
        tilesByColor[tile.color] = (tilesByColor[tile.color] || 0) + 1;
      });
    
    // Pour chaque couleur présente dans la fleur
    Object.values(tilesByColor).forEach(count => {
      // Si 3 tuiles ou plus de la même couleur
      if (count >= 3) {
        // Bonus de 4 points par fenêtre
        bonus += 4;
      }
    });
  }
  
  return bonus;
}

// Détermine si deux tuiles sont adjacentes
function areTilesAdjacent(tile1: { flower: number; pos: number }, tile2: { flower: number; pos: number }): boolean {
  // Tuiles de la même fleur, positions adjacentes
  if (tile1.flower === tile2.flower && Math.abs(tile1.pos - tile2.pos) === 1) {
    return true;
  }
  
  // Tuiles de fleurs adjacentes
  // Les fleurs sont disposées en cercle: 0-1-2-3-4-5-0
  const flowersAdjacent = 
    Math.abs(tile1.flower - tile2.flower) === 1 || 
    Math.abs(tile1.flower - tile2.flower) === 5; // 0 et 5 sont adjacents
  
  // Pour les fleurs adjacentes, les positions qui se touchent sont spécifiques
  // Simplification: on considère que les positions identiques sont adjacentes entre fleurs
  return flowersAdjacent && tile1.pos === tile2.pos;
} 