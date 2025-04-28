import { GameState, Tile, TileColor, Player } from '../../models/types';
import { canSelectTiles, canPlaceTiles, mustPlaceInFloorLine } from '../moves';

// Types de difficulté pour l'IA
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Interface pour la décision de l'IA
interface AIDecision {
  factoryId: number | null;
  color: TileColor;
  patternLineIndex: number;
}

// Score pour évaluer un placement potentiel
interface PlacementScore {
  patternLineIndex: number;
  score: number;
}

export const getAIMove = (gameState: GameState, difficulty: AIDifficulty): AIDecision => {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) {
    throw new Error("Joueur courant non trouvé");
  }

  // Stratégies différentes selon le niveau de difficulté
  switch (difficulty) {
    case 'easy':
      return getEasyAIMove(gameState, currentPlayer);
    case 'medium':
      return getMediumAIMove(gameState, currentPlayer);
    case 'hard':
      return getHardAIMove(gameState, currentPlayer);
    default:
      return getEasyAIMove(gameState, currentPlayer);
  }
};

// IA facile : joue de façon aléatoire mais valide
const getEasyAIMove = (gameState: GameState, player: Player): AIDecision => {
  // 1. Trouver toutes les sélections possibles (fabrique + couleur)
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("Aucune sélection possible");
  }
  
  // 2. Choisir une sélection au hasard
  const randomSelection = possibleSelections[Math.floor(Math.random() * possibleSelections.length)];
  
  // Simuler la sélection pour obtenir les tuiles sélectionnées
  const selectedTiles = simulateSelection(gameState, randomSelection.factoryId, randomSelection.color);
  
  // 3. Trouver tous les placements possibles pour ces tuiles
  const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
  
  // Si aucun placement valide n'est possible, placer dans la ligne de plancher
  if (possiblePlacements.length === 0) {
    return {
      ...randomSelection,
      patternLineIndex: -1
    };
  }
  
  // 4. Choisir un placement au hasard
  const randomPlacement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
  
  return {
    ...randomSelection,
    patternLineIndex: randomPlacement
  };
};

// IA moyenne : privilégie les lignes qui peuvent être complétées
const getMediumAIMove = (gameState: GameState, player: Player): AIDecision => {
  // 1. Trouver toutes les sélections possibles
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("Aucune sélection possible");
  }
  
  // Évaluer chaque sélection possible
  let bestMove: AIDecision | null = null;
  let bestScore = -1000;
  
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
      // Évaluer ce placement
      const score = evaluatePlacement(player, lineIndex, selectedTiles, 'medium');
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          ...selection,
          patternLineIndex: lineIndex
        };
      }
    }
  }
  
  // Si aucun bon coup n'est trouvé, jouer un coup aléatoire
  if (!bestMove) {
    return getEasyAIMove(gameState, player);
  }
  
  return bestMove;
};

// IA difficile : planifie à plus long terme et prend en compte le mur
const getHardAIMove = (gameState: GameState, player: Player): AIDecision => {
  // 1. Trouver toutes les sélections possibles
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("Aucune sélection possible");
  }
  
  // Évaluer chaque sélection possible avec une stratégie plus avancée
  let bestMove: AIDecision | null = null;
  let bestScore = -1000;
  
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
      // Évaluer ce placement avec la stratégie avancée
      const score = evaluatePlacement(player, lineIndex, selectedTiles, 'hard');
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          ...selection,
          patternLineIndex: lineIndex
        };
      }
    }
  }
  
  // Si aucun bon coup n'est trouvé, utiliser la stratégie moyenne
  if (!bestMove) {
    return getMediumAIMove(gameState, player);
  }
  
  return bestMove;
};

// Fonctions utilitaires pour l'IA

const getAllPossibleSelections = (gameState: GameState): { factoryId: number | null, color: TileColor }[] => {
  const selections: { factoryId: number | null, color: TileColor }[] = [];
  
  // Vérifier les fabriques
  for (const factory of gameState.factories) {
    if (factory.tiles.length === 0) continue;
    
    // Regrouper les tuiles par couleur
    const colors = new Set(factory.tiles.map(t => t.color));
    
    colors.forEach(color => {
      if (canSelectTiles(gameState, factory.id, color)) {
        selections.push({ factoryId: factory.id, color });
      }
    });
  }
  
  // Vérifier le centre
  if (gameState.center.length > 0) {
    const centerColors = new Set(gameState.center.map(t => t.color));
    
    centerColors.forEach(color => {
      if (canSelectTiles(gameState, null, color)) {
        selections.push({ factoryId: null, color });
      }
    });
  }
  
  return selections;
};

const simulateSelection = (gameState: GameState, factoryId: number | null, color: TileColor): Tile[] => {
  if (factoryId !== null) {
    // Sélection depuis une fabrique
    return gameState.factories.find(f => f.id === factoryId)?.tiles.filter(t => t.color === color) || [];
  } else {
    // Sélection depuis le centre
    return gameState.center.filter(t => t.color === color);
  }
};

const getPossiblePlacements = (gameState: GameState, player: Player, selectedTiles: Tile[]): number[] => {
  if (selectedTiles.length === 0) return [];
  
  const possiblePlacements: number[] = [];
  
  // Vérifier si on doit obligatoirement placer dans la ligne de plancher
  if (mustPlaceInFloorLine(gameState, selectedTiles)) {
    return [-1]; // Ligne de plancher
  }
  
  // Pour chaque ligne de motif, vérifier si on peut y placer les tuiles
  for (let i = 0; i < player.board.patternLines.length; i++) {
    if (canPlaceTiles(gameState, i, selectedTiles)) {
      possiblePlacements.push(i);
    }
  }
  
  // On peut toujours placer dans la ligne de plancher
  possiblePlacements.push(-1);
  
  return possiblePlacements;
};

const evaluatePlacement = (player: Player, lineIndex: number, tiles: Tile[], difficulty: AIDifficulty): number => {
  // Si on place dans la ligne de plancher, c'est généralement un mauvais coup
  if (lineIndex === -1) {
    return -10;
  }
  
  const line = player.board.patternLines[lineIndex];
  const tileCount = tiles.length;
  
  // Base score: plus la ligne est avancée, mieux c'est
  let score = (line.tiles.length + tileCount) / line.spaces * 10;
  
  // Bonus si le placement complète la ligne
  if (line.tiles.length + tileCount >= line.spaces) {
    score += 15;
    
    // Pour l'IA difficile, vérifier l'impact sur le mur
    if (difficulty === 'hard') {
      const color = tiles[0].color;
      const wallRow = player.board.wall[lineIndex];
      
      // Trouver la position correspondante dans le mur
      const wallColumn = wallRow.findIndex(space => space.color === color);
      
      // Bonus pour compléter des séquences dans le mur
      let adjacentHorizontal = 0;
      let adjacentVertical = 0;
      
      // Compter tuiles adjacentes horizontalement
      for (let c = wallColumn - 1; c >= 0; c--) {
        if (wallRow[c].filled) {
          adjacentHorizontal++;
        } else {
          break;
        }
      }
      
      for (let c = wallColumn + 1; c < wallRow.length; c++) {
        if (wallRow[c].filled) {
          adjacentHorizontal++;
        } else {
          break;
        }
      }
      
      // Compter tuiles adjacentes verticalement
      for (let r = lineIndex - 1; r >= 0; r--) {
        if (player.board.wall[r][wallColumn].filled) {
          adjacentVertical++;
        } else {
          break;
        }
      }
      
      for (let r = lineIndex + 1; r < player.board.wall.length; r++) {
        if (player.board.wall[r][wallColumn].filled) {
          adjacentVertical++;
        } else {
          break;
        }
      }
      
      // Ajouter des points pour les tuiles adjacentes
      score += (adjacentHorizontal + adjacentVertical) * 5;
      
      // Bonus pour les objectifs de fin de partie
      // Compléter une ligne horizontale
      const canCompleteRow = wallRow.filter(s => s.filled).length === 4;
      if (canCompleteRow) score += 10;
      
      // Compléter une colonne verticale
      const canCompleteColumn = player.board.wall.filter(row => row[wallColumn].filled).length === 4;
      if (canCompleteColumn) score += 20;
      
      // Compléter une couleur (5 tuiles de même couleur)
      const sameColorCount = player.board.wall.flat().filter(s => s.color === color && s.filled).length;
      if (sameColorCount === 4) score += 15;
    }
  }
  
  // Pour l'IA moyenne et difficile, préférer les lignes qui utilisent plus de tuiles
  if (difficulty !== 'easy') {
    score += tileCount * 3;
  }
  
  // Pénalité pour placer sur des lignes presque vides quand on ne peut pas les compléter
  if (line.tiles.length === 0 && line.tiles.length + tileCount < line.spaces) {
    score -= 5;
  }
  
  return score;
};