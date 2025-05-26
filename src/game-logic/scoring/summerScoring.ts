// Logique de scoring spécifique à Azul : Summer Pavilion
import { GameState, TileColor } from '../../models/types';

export function calculateSummerPavilionScore(gameState: GameState): number {
  // Calculer la somme des scores de tous les joueurs
  return gameState.players.reduce((totalScore, player) => {
    // Points de base du joueur
    let playerScore = player.board.score;
    
    // Dans Summer Pavilion, le scoring se fait différemment
    // Les bonus sont obtenus pendant le jeu, pas à la fin
    // Ici on retourne juste le score actuel du joueur
    
    return totalScore + playerScore;
  }, 0);
}

// Vérifie si on doit obtenir un bonus pilier (4 espaces adjacents à un pilier remplis)
function checkPillarBonus(placedTiles: { color: TileColor; flower: number; pos: number }[], newTile: { flower: number; pos: number }): boolean {
  // Les piliers sont situés entre la fleur centrale (6) et les fleurs extérieures (0-5)
  // Il y a 6 piliers, un entre chaque fleur extérieure et la centrale
  
  // Pour chaque pilier (position entre fleur extérieure et centrale)
  for (let pillarIndex = 0; pillarIndex < 6; pillarIndex++) {
    const outerFlower = pillarIndex; // Fleur extérieure
    const centerFlower = 6; // Fleur centrale
    
    // Les 4 espaces adjacents au pilier sont :
    // - 2 espaces sur la fleur extérieure (positions qui touchent le centre)
    // - 2 espaces sur la fleur centrale (positions qui touchent cette fleur extérieure)
    
    const adjacentSpaces = [
      { flower: outerFlower, pos: 0 }, // Position vers le centre sur fleur extérieure
      { flower: outerFlower, pos: 1 }, // Position adjacente sur fleur extérieure
      { flower: centerFlower, pos: pillarIndex }, // Position correspondante sur fleur centrale
      { flower: centerFlower, pos: (pillarIndex + 1) % 6 } // Position adjacente sur fleur centrale
    ];
    
    // Vérifier si tous les espaces adjacents sont remplis après ce placement
    const allFilled = adjacentSpaces.every(space => {
      return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos) ||
             (newTile.flower === space.flower && newTile.pos === space.pos);
    });
    
    if (allFilled) {
      // Vérifier que ce bonus n'a pas déjà été obtenu
      const wasAlreadyComplete = adjacentSpaces.every(space => {
        return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos);
      });
      
      if (!wasAlreadyComplete) {
        return true; // Nouveau bonus pilier obtenu !
      }
    }
  }
  
  return false;
}

// Vérifie si on doit obtenir un bonus statue (4 espaces adjacents à une statue remplis)
function checkStatueBonus(placedTiles: { color: TileColor; flower: number; pos: number }[], newTile: { flower: number; pos: number }): boolean {
  // Les statues sont situées entre les fleurs extérieures adjacentes
  // Il y a 6 statues, une entre chaque paire de fleurs extérieures adjacentes
  
  for (let statueIndex = 0; statueIndex < 6; statueIndex++) {
    const flower1 = statueIndex;
    const flower2 = (statueIndex + 1) % 6; // Fleur adjacente
    
    // Les 4 espaces adjacents à la statue sont :
    // - 2 espaces sur la première fleur (côtés qui touchent la statue)
    // - 2 espaces sur la deuxième fleur (côtés qui touchent la statue)
    
    const adjacentSpaces = [
      { flower: flower1, pos: 5 }, // Côté droit de flower1
      { flower: flower1, pos: 4 }, // Position adjacente sur flower1
      { flower: flower2, pos: 0 }, // Côté gauche de flower2
      { flower: flower2, pos: 1 }  // Position adjacente sur flower2
    ];
    
    // Vérifier si tous les espaces adjacents sont remplis après ce placement
    const allFilled = adjacentSpaces.every(space => {
      return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos) ||
             (newTile.flower === space.flower && newTile.pos === space.pos);
    });
    
    if (allFilled) {
      // Vérifier que ce bonus n'a pas déjà été obtenu
      const wasAlreadyComplete = adjacentSpaces.every(space => {
        return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos);
      });
      
      if (!wasAlreadyComplete) {
        return true; // Nouveau bonus statue obtenu !
      }
    }
  }
  
  return false;
}

// Vérifie si on doit obtenir un bonus fenêtre (2 espaces adjacents à une fenêtre remplis)
function checkWindowBonus(placedTiles: { color: TileColor; flower: number; pos: number }[], newTile: { flower: number; pos: number }): boolean {
  // Les fenêtres sont situées aux extrémités des fleurs extérieures
  // Il y a 12 fenêtres, 2 par fleur extérieure (une à chaque extrémité)
  
  for (let flower = 0; flower < 6; flower++) {
    // Fenêtre 1 : extrémité "gauche" de la fleur (positions 2-3)
    const window1Spaces = [
      { flower: flower, pos: 2 },
      { flower: flower, pos: 3 }
    ];
    
    // Fenêtre 2 : extrémité "droite" de la fleur (positions 4-5)
    const window2Spaces = [
      { flower: flower, pos: 4 },
      { flower: flower, pos: 5 }
    ];
    
    // Vérifier chaque fenêtre
    for (const windowSpaces of [window1Spaces, window2Spaces]) {
      const allFilled = windowSpaces.every(space => {
        return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos) ||
               (newTile.flower === space.flower && newTile.pos === space.pos);
      });
      
      if (allFilled) {
        // Vérifier que ce bonus n'a pas déjà été obtenu
        const wasAlreadyComplete = windowSpaces.every(space => {
          return placedTiles.some(tile => tile.flower === space.flower && tile.pos === space.pos);
        });
        
        if (!wasAlreadyComplete) {
          return true; // Nouveau bonus fenêtre obtenu !
        }
      }
    }
  }
  
  return false;
}

// Fonction pour vérifier tous les bonus lors du placement d'une tuile
export function checkBonusesOnPlacement(
  placedTiles: { color: TileColor; flower: number; pos: number }[], 
  newTile: { flower: number; pos: number }
): { 
  pillar: boolean; 
  statue: boolean; 
  window: boolean;
  bonusTiles: number; // Nombre total de tuiles bonus à récupérer
} {
  const pillarBonus = checkPillarBonus(placedTiles, newTile);
  const statueBonus = checkStatueBonus(placedTiles, newTile);
  const windowBonus = checkWindowBonus(placedTiles, newTile);
  
  let bonusTiles = 0;
  if (pillarBonus) bonusTiles += 1; // 1 tuile pour pilier
  if (statueBonus) bonusTiles += 2;  // 2 tuiles pour statue
  if (windowBonus) bonusTiles += 3;  // 3 tuiles pour fenêtre
  
  return {
    pillar: pillarBonus,
    statue: statueBonus,
    window: windowBonus,
    bonusTiles
  };
}