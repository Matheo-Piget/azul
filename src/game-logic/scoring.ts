import { GameState, PlayerBoard, Player, Tile } from '../models/types';


// Tableau des pénalités pour la ligne de plancher
const floorPenalties = [-1, -1, -2, -2, -2, -3, -3];

// Calculer le score pour un placement de tuile
const calculateTilePlacementScore = (board: PlayerBoard, row: number, col: number): number => {
  let score = 0;
  let adjacentHorizontal = 0;
  let adjacentVertical = 0;
  
  // Compter les tuiles adjacentes horizontalement
  for (let c = col - 1; c >= 0; c--) {
    if (board.wall[row][c].filled) {
      adjacentHorizontal++;
    } else {
      break;
    }
  }
  
  for (let c = col + 1; c < board.wall[row].length; c++) {
    if (board.wall[row][c].filled) {
      adjacentHorizontal++;
    } else {
      break;
    }
  }
  
  // Compter les tuiles adjacentes verticalement
  for (let r = row - 1; r >= 0; r--) {
    if (board.wall[r][col].filled) {
      adjacentVertical++;
    } else {
      break;
    }
  }
  
  for (let r = row + 1; r < board.wall.length; r++) {
    if (board.wall[r][col].filled) {
      adjacentVertical++;
    } else {
      break;
    }
  }
  
  // Si aucune tuile adjacente, score de 1
  if (adjacentHorizontal === 0 && adjacentVertical === 0) {
    return 1;
  }
  
  // Ajouter les points pour les groupes horizontaux et verticaux
  if (adjacentHorizontal > 0) {
    score += (adjacentHorizontal + 1);
  }
  
  if (adjacentVertical > 0) {
    score += (adjacentVertical + 1);
  }
  
  return score;
};

// Appliquer les pénalités de la ligne de plancher
const applyFloorPenalties = (player: Player): Player => {
  let newPlayer = { ...player };
  let floorLineLength = player.board.floorLine.length;
  
  // Calculer les pénalités totales
  let penalty = 0;
  for (let i = 0; i < floorLineLength && i < floorPenalties.length; i++) {
    penalty += floorPenalties[i];
  }
  
  // Appliquer les pénalités (en s'assurant que le score ne devient pas négatif)
  newPlayer.board.score = Math.max(0, newPlayer.board.score + penalty);
  
  // Vider la ligne de plancher
  newPlayer.board.floorLine = [];
  
  return newPlayer;
};

// Transférer les tuiles des lignes de motif complètes vers le mur
const transferCompletedLinesToWall = (player: Player, gameState: GameState): { player: Player, discardedTiles: Tile[] } => {
  let newPlayer = { ...player };
  let scoreGained = 0;
  let discardedTiles: Tile[] = [];
  
  // Pour chaque ligne de motif
  newPlayer.board.patternLines.forEach((line, rowIndex) => {
    // Si la ligne est complète (nombre de tuiles = nombre d'espaces)
    if (line.tiles.length === line.spaces && line.color) {
      // Trouver la colonne correspondante sur le mur
      const colIndex = newPlayer.board.wall[rowIndex].findIndex(
        space => space.color === line.color
      );
      
      if (colIndex !== -1) {
        // Marquer la case comme remplie
        newPlayer.board.wall[rowIndex][colIndex].filled = true;
        
        // Calculer les points gagnés pour ce placement
        const tileScore = calculateTilePlacementScore(newPlayer.board, rowIndex, colIndex);
        scoreGained += tileScore;
        
        // Envoyer les tuiles à la défausse
        discardedTiles = [...discardedTiles, ...line.tiles];
        
        // Vider la ligne de motif et réinitialiser sa couleur
        line.tiles = [];
        line.color = null;
      }
    }
  });
  
  // Ajouter les points gagnés au score du joueur
  newPlayer.board.score += scoreGained;
  
  return { player: newPlayer, discardedTiles };
};

// Calculer les scores à la fin d'un round
export const calculateRoundScores = (gameState: GameState): GameState => {
  let newGameState = { ...gameState };
  let allDiscardedTiles: Tile[] = [];
  
  // Pour chaque joueur
  newGameState.players = newGameState.players.map(player => {
    // 1. Transférer les tuiles des lignes complètes vers le mur
    const { player: updatedPlayer, discardedTiles } = transferCompletedLinesToWall(player, newGameState);
    allDiscardedTiles = [...allDiscardedTiles, ...discardedTiles];
    
    // 2. Appliquer les pénalités de la ligne de plancher et envoyer ces tuiles à la défausse aussi
    const floorTiles = [...updatedPlayer.board.floorLine];
    allDiscardedTiles = [...allDiscardedTiles, ...floorTiles];
    
    // Vider la ligne de plancher et appliquer les pénalités
    const playerAfterPenalties = applyFloorPenalties(updatedPlayer);
    
    return playerAfterPenalties;
  });
  
  // Ajouter toutes les tuiles discardées à la défausse
  newGameState.discardPile = [...newGameState.discardPile, ...allDiscardedTiles];
  
  return newGameState;
};

// Calculer les scores finaux à la fin de la partie
export const calculateFinalScores = (gameState: GameState): GameState => {
  let newGameState = { ...gameState };
  
  // Pour chaque joueur
  newGameState.players = newGameState.players.map(player => {
    let bonusScore = 0;
    let updatedPlayer = { ...player };
    
    // Bonus 1: 2 points pour chaque ligne horizontale complète
    for (let row = 0; row < 5; row++) {
      if (player.board.wall[row].every(space => space.filled)) {
        bonusScore += 2;
      }
    }
    
    // Bonus 2: 7 points pour chaque colonne verticale complète
    for (let col = 0; col < 5; col++) {
      if (player.board.wall.every(row => row[col].filled)) {
        bonusScore += 7;
      }
    }
    
    // Bonus 3: 10 points pour chaque couleur complète (5 tuiles)
    const colors = ['blue', 'yellow', 'red', 'black', 'teal'];
    colors.forEach(color => {
      const count = player.board.wall.flat().filter(
        space => space.color === color && space.filled
      ).length;
      
      if (count === 5) {
        bonusScore += 10;
      }
    });
    
    // Ajouter les bonus au score final
    updatedPlayer.board.score += bonusScore;
    
    return updatedPlayer;
  });
  
  return newGameState;
};