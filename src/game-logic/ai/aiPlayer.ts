import { GameState, Tile, TileColor, Player } from '../../models/types';
import { canSelectTiles, canPlaceTiles, mustPlaceInFloorLine } from '../moves';

/**
 * Difficulty levels for the AI player
 * @typedef {'easy' | 'medium' | 'hard'} AIDifficulty
 */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Interface representing an AI decision
 * @interface
 * @property {number|null} factoryId - ID of the selected factory (null for center)
 * @property {TileColor} color - Selected tile color
 * @property {number} patternLineIndex - Index of the pattern line to place tiles (-1 for floor line)
 */
interface AIDecision {
  factoryId: number | null;
  color: TileColor;
  patternLineIndex: number;
}

/**
 * Gets the best move for the AI player based on game state and difficulty
 * @param {GameState} gameState - Current game state
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {AIDecision} The AI's decision
 * @throws {Error} If current player is not found
 */
export const getAIMove = (gameState: GameState, difficulty: AIDifficulty): AIDecision => {
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) {
    throw new Error("Current player not found");
  }

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

/**
 * Gets a random valid move for easy AI difficulty
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Random valid move
 * @throws {Error} If no valid selections are available
 */
const getEasyAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  // Choose random selection
  const randomSelection = possibleSelections[Math.floor(Math.random() * possibleSelections.length)];
  const selectedTiles = simulateSelection(gameState, randomSelection.factoryId, randomSelection.color);
  const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
  
  // Default to floor line if no valid placements
  if (possiblePlacements.length === 0) {
    return {
      ...randomSelection,
      patternLineIndex: -1
    };
  }
  
  // Choose random placement
  const randomPlacement = possiblePlacements[Math.floor(Math.random() * possiblePlacements.length)];
  
  return {
    ...randomSelection,
    patternLineIndex: randomPlacement
  };
};

/**
 * Gets a semi-smart move for medium AI difficulty using basic evaluation
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Best move according to medium difficulty logic
 */
const getMediumAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  let bestMove: AIDecision | null = null;
  let bestScore = -Infinity;
  
  // Evaluate all possible moves
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
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
  
  // Fallback to easy AI if no good move found
  return bestMove || getEasyAIMove(gameState, player);
};

/**
 * Gets a smart move for hard AI difficulty using advanced evaluation
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current AI player
 * @returns {AIDecision} Best move according to hard difficulty logic
 */
const getHardAIMove = (gameState: GameState, player: Player): AIDecision => {
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    throw new Error("No valid selections available");
  }
  
  let bestMove: AIDecision | null = null;
  let bestScore = -Infinity;
  
  // Profondeur variable selon la phase de jeu
  let searchDepth = 2;
  const totalOptions = possibleSelections.reduce((count, selection) => {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
    return count + possiblePlacements.length;
  }, 0);
  
  // Profondeur adaptative
  if (totalOptions < 12) searchDepth = 3;
  if (gameState.roundNumber >= 4) searchDepth += 1; // Plus profond en fin de partie
  if (totalOptions > 25) searchDepth = Math.max(1, searchDepth - 1);
  
  // Effacer la table de transposition entre les coups
  if (gameState.roundNumber > 3) transpositionTable.clear();
  
  // Analyser la position
  const isEndgame = gameState.roundNumber >= 4 || 
                    gameState.players.some(p => 
                      p.board.wall.some(row => 
                        row.filter(space => space.filled).length >= 4));
  
  // Stratégie différente pour end-game
  if (isEndgame) {
    // Priorité à compléter les lignes/colonnes en fin de partie
    for (const selection of possibleSelections) {
      const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
      const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
      
      for (const lineIndex of possiblePlacements) {
        // Score immédiat avec priorité sur complétion
        const immediateScore = evaluateEndgamePlacement(player, lineIndex, selectedTiles, gameState);
        
        const nextState = simulateMove(gameState, selection, lineIndex, player.id);
        
        // Recherche plus profonde en fin de partie
        const lookAheadScore = lookupWithTransposition(
          nextState,
          nextState.currentPlayer,
          searchDepth,
          'hard',
          false,
          player.id,
          -Infinity,
          Infinity
        );
        
        // Endgame valorise plus les gains immédiats
        const totalScore = immediateScore * 1.5 + lookAheadScore;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMove = {
            ...selection,
            patternLineIndex: lineIndex
          };
        }
      }
    }
  } else {
    // Stratégie normale
    for (const selection of possibleSelections) {
      const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
      const possiblePlacements = getPossiblePlacements(gameState, player, selectedTiles);
      
      for (const lineIndex of possiblePlacements) {
        const immediateScore = evaluatePlacement(player, lineIndex, selectedTiles, 'hard');
        
        const nextState = simulateMove(gameState, selection, lineIndex, player.id);
        
        const lookAheadScore = lookupWithTransposition(
          nextState,
          nextState.currentPlayer,
          searchDepth,
          'hard',
          false,
          player.id,
          -Infinity,
          Infinity
        );
        
        const totalScore = immediateScore * 1.2 + lookAheadScore;
        
        if (totalScore > bestScore) {
          bestScore = totalScore;
          bestMove = {
            ...selection,
            patternLineIndex: lineIndex
          };
        }
      }
    }
  }
  
  return bestMove || getMediumAIMove(gameState, player);
};

/**
 * Gets all possible tile selections from factories and center
 * @param {GameState} gameState - Current game state
 * @returns {Array<{factoryId: number|null, color: TileColor}>} All valid selections
 */
const getAllPossibleSelections = (gameState: GameState): { factoryId: number | null, color: TileColor }[] => {
  const selections: { factoryId: number | null, color: TileColor }[] = [];
  
  // Check factories
  for (const factory of gameState.factories) {
    if (factory.tiles.length === 0) continue;
    
    // Group tiles by color
    const colors = new Set<TileColor>(factory.tiles.map(t => t.color));
    
    colors.forEach(color => {
      if (canSelectTiles(gameState, factory.id, color)) {
        selections.push({ factoryId: factory.id, color });
      }
    });
  }
  
  // Check center
  if (gameState.center.length > 0) {
    const centerColors = new Set<TileColor>(gameState.center.map(t => t.color));
    
    centerColors.forEach(color => {
      if (canSelectTiles(gameState, null, color)) {
        selections.push({ factoryId: null, color });
      }
    });
  }
  
  return selections;
};

/**
 * Simulates tile selection from a factory or center
 * @param {GameState} gameState - Current game state
 * @param {number|null} factoryId - Factory ID or null for center
 * @param {TileColor} color - Color to select
 * @returns {Tile[]} Array of tiles that would be selected
 */
const simulateSelection = (gameState: GameState, factoryId: number | null, color: TileColor): Tile[] => {
  return factoryId !== null
    ? gameState.factories.find(f => f.id === factoryId)?.tiles.filter(t => t.color === color) || []
    : gameState.center.filter(t => t.color === color);
};


/**
 * Performs a minimax search with alpha-beta pruning to evaluate future game states
 * @param {GameState} gameState - Current game state
 * @param {string} currentPlayerId - ID of the player making move decisions
 * @param {number} depth - Remaining search depth
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @param {boolean} maximizing - Whether we're maximizing or minimizing score
 * @param {string} originalPlayerId - ID of the player whose score we're optimizing
 * @param {number} alpha - Alpha value for pruning
 * @param {number} beta - Beta value for pruning
 * @returns {number} Evaluation score
 */
function lookahead(
  gameState: GameState,
  currentPlayerId: string,
  depth: number,
  difficulty: AIDifficulty,
  maximizing: boolean = true,
  originalPlayerId?: string,
  alpha: number = -Infinity,
  beta: number = Infinity,
  timeLimit: number = 500 // ms de temps maximum
): number {
  if (!originalPlayerId) originalPlayerId = currentPlayerId;
  const startTime = Date.now();
  
  // Conditions terminales
  if (depth === 0 || gameState.gamePhase === 'gameEnd') {
    return evaluateGameState(gameState, originalPlayerId, difficulty);
  }

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return 0;
  
  const possibleSelections = getAllPossibleSelections(gameState);
  
  if (possibleSelections.length === 0) {
    return evaluateGameState(gameState, originalPlayerId, difficulty);
  }

  let bestScore = maximizing ? -Infinity : Infinity;
  
  // Pré-évaluer tous les mouvements pour les ordonner
  const moveScores: {selection: any, lineIndex: number, score: number}[] = [];
  
  for (const selection of possibleSelections) {
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    const possiblePlacements = getPossiblePlacements(gameState, currentPlayer, selectedTiles);
    
    for (const lineIndex of possiblePlacements) {
      const immediateScore = evaluatePlacement(currentPlayer, lineIndex, selectedTiles, difficulty);
      moveScores.push({
        selection,
        lineIndex,
        score: immediateScore
      });
    }
  }
  
  // Ordonner les mouvements (meilleurs d'abord pour maximizing, pires d'abord pour minimizing)
  moveScores.sort((a, b) => maximizing ? b.score - a.score : a.score - b.score);
  
  // Évaluer les mouvements ordonnés
  for (const {selection, lineIndex} of moveScores) {
    // Vérifier le temps écoulé
    if (Date.now() - startTime > timeLimit) {
      break; // Arrêter la recherche si on dépasse le temps alloué
    }
    
    const selectedTiles = simulateSelection(gameState, selection.factoryId, selection.color);
    
    // Calculer le score immédiat
    let immediatePlacementScore = 0;
    if (currentPlayer.id === originalPlayerId) {
      immediatePlacementScore = evaluatePlacement(currentPlayer, lineIndex, selectedTiles, difficulty);
    } else if (!maximizing) {
      immediatePlacementScore = -evaluatePlacement(currentPlayer, lineIndex, selectedTiles, difficulty) * 0.6;
    }
    
    // Simuler le mouvement
    const nextState = simulateMove(gameState, selection, lineIndex, currentPlayer.id);
    
    // Évaluation récursive
    let futureScore = 0;
    if (depth > 1) {
      futureScore = lookahead(
        nextState,
        nextState.currentPlayer,
        depth - 1,
        difficulty,
        !maximizing,
        originalPlayerId,
        alpha,
        beta,
        timeLimit - (Date.now() - startTime) // Ajuster le temps restant
      );
    }
    
    // Combiner les scores
    const weightFactor = difficulty === 'hard' ? 0.85 : 0.5;
    const totalScore = immediatePlacementScore + (futureScore * weightFactor);
    
    // Mettre à jour le meilleur score et alpha/beta
    if (maximizing) {
      bestScore = Math.max(bestScore, totalScore);
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Élagage alpha-beta
    } else {
      bestScore = Math.min(bestScore, totalScore);
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break; // Élagage alpha-beta
    }
  }
  
  return bestScore;
}

/**
 * Evaluates placement during endgame with focus on completions
 * @param {Player} player - Current player
 * @param {number} lineIndex - Pattern line index (-1 for floor line)
 * @param {Tile[]} tiles - Tiles to be placed
 * @param {GameState} gameState - Current game state
 * @returns {number} Score for the placement
 */
function evaluateEndgamePlacement(
  player: Player,
  lineIndex: number,
  tiles: Tile[],
  gameState: GameState
): number {
  // Start with regular evaluation
  let score = evaluatePlacement(player, lineIndex, tiles, 'hard');
  
  // Floor line is especially bad in endgame
  if (lineIndex === -1) {
    return score * 1.5; // Increase floor line penalty
  }
  
  const line = player.board.patternLines[lineIndex];
  const tileCount = tiles.length;
  const color = tiles[0].color;
  
  // Massively boost score for line completion in endgame
  if (line.tiles.length + tileCount === line.spaces) {
    score += 25; // Higher completion bonus
    
    // Evaluate wall placement impact
    const wallRow = player.board.wall[lineIndex];
    const wallColumn = wallRow.findIndex(space => space.color === color);
    
    if (wallColumn !== -1 && !wallRow[wallColumn].filled) {
      // Check for potential row/column/color completions
      const wall = player.board.wall;
      
      // Row completion bonus (would complete a row)
      const filledInRow = wall[lineIndex].filter(space => space.filled).length;
      if (filledInRow === 4) {
        score += 40; // Major bonus for row completion
      } else if (filledInRow === 3) {
        score += 25; // Good bonus for setting up row completion
      }
      
      // Column completion bonus
      const filledInCol = wall.map(row => row[wallColumn]).filter(space => space.filled).length;
      if (filledInCol === 4) {
        score += 50; // Major bonus for column completion
      } else if (filledInCol === 3) {
        score += 30;
      }
      
      // Color set completion bonus
      const sameColorFilled = wall.flat().filter(space => space.color === color && space.filled).length;
      if (sameColorFilled === 4) {
        score += 30; // Bonus for completing a color set
      } else if (sameColorFilled === 3) {
        score += 15;
      }
    }
  }
  
  // Consider remaining rounds
  const roundsRemaining = Math.max(0, 5 - gameState.roundNumber);
  if (roundsRemaining <= 1) {
    // Last round - heavily prioritize immediate scoring
    score *= 1.5;
  }
  
  return score;
}

/**
 * Evaluates future options and flexibility created by a move
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current player
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @param {TileColor} color - Tile color
 * @returns {number} Value of future options
 */
function evaluateFutureOptions(
  gameState: GameState,
  player: Player,
  row: number,
  col: number,
  color: TileColor
): number {
  let optionValue = 0;
  
  // Check tile availability in future rounds
  const availableTiles = countAvailableTiles(gameState, color);
  const tilePotential = Math.min(5, availableTiles) / 5;
  optionValue += tilePotential * 10;
  
  // Value positioning that creates multiple follow-up options
  // Check if this placement enables valuable future placements
  const wall = player.board.wall;
  
  // Check surrounding wall positions
  const surroundingPositions = [
    { r: row-1, c: col },   // above
    { r: row+1, c: col },   // below
    { r: row, c: col-1 },   // left
    { r: row, c: col+1 }    // right
  ];
  
  for (const pos of surroundingPositions) {
    if (pos.r >= 0 && pos.r < 5 && pos.c >= 0 && pos.c < 5) {
      const space = wall[pos.r][pos.c];
      if (!space.filled) {
        // Check if surrounding positions would be valuable to fill next
        const surroundingValue = calculatePositionValue(player, pos.r, pos.c, space.color);
        optionValue += surroundingValue * 0.3; // Scaled down as it's future potential
      }
    }
  }
  
  // Value opening pattern lines that match well with available tiles
  player.board.patternLines.forEach((line, lineIdx) => {
    if (!line.color || line.color === color) {
      // Consider lines that could take this color next round
      if (line.tiles.length < line.spaces) {
        const lineValue = (line.tiles.length / line.spaces) * 5;
        optionValue += lineValue * tilePotential * 0.4;
      }
    }
  });
  
  return optionValue;
}

/**
 * Counts available tiles of a specific color
 * @param {GameState} gameState - Current game state
 * @param {TileColor} color - Tile color to count
 * @returns {number} Count of available tiles
 */
function countAvailableTiles(gameState: GameState, color: TileColor): number {
  let count = 0;
  
  // Count tiles in factories
  gameState.factories.forEach(factory => {
    count += factory.tiles.filter(t => t.color === color).length;
  });
  
  // Count tiles in center
  count += gameState.center.filter(t => t.color === color).length;
  
  // Count tiles in bag (estimation)
  const bagAndDiscard = [...gameState.bag, ...gameState.discardPile];
  count += bagAndDiscard.filter(t => t.color === color).length;
  
  return count;
}

/**
 * Calculates the strategic value of a wall position
 * @param {Player} player - Current player
 * @param {number} row - Wall row
 * @param {number} col - Wall column
 * @param {TileColor} color - Tile color
 * @returns {number} Strategic position value
 */
function calculatePositionValue(player: Player, row: number, col: number, color: TileColor): number {
  let value = 0;
  const wall = player.board.wall;
  
  // Base value
  value += 5;
  
  // Value center positions more
  if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
    value += 3;
  }
  
  // Value based on potential completions
  // Row potential
  const filledInRow = wall[row].filter(space => space.filled).length;
  value += filledInRow * 2;
  
  // Column potential
  const filledInCol = wall.map(r => r[col]).filter(space => space.filled).length;
  value += filledInCol * 2;
  
  // Same color potential
  const sameColorFilled = wall.flat().filter(space => space.color === color && space.filled).length;
  value += sameColorFilled * 2;
  
  return value;
}

/**
 * Simulates a move without modifying the original game state
 * @param {GameState} gameState - Current game state
 * @param {Object} selection - Tile selection information
 * @param {number} lineIndex - Pattern line index
 * @param {string} playerId - Current player ID
 * @returns {GameState} New simulated game state
 */
function simulateMove(
  gameState: GameState, 
  selection: { factoryId: number | null, color: TileColor }, 
  lineIndex: number, 
  playerId: string
): GameState {
  // Create deep clone of state to avoid modifying original
  const newState = structuredClone(gameState);
  const player = newState.players.find(p => p.id === playerId);
  
  if (!player) return newState;
  
  // Get tiles from factory or center
  const selectedTiles = selection.factoryId !== null
    ? newState.factories.find(f => f.id === selection.factoryId)?.tiles.filter(t => t.color === selection.color) || []
    : newState.center.filter(t => t.color === selection.color);
  
  // Remove tiles from factory
  if (selection.factoryId !== null) {
    const factory = newState.factories.find(f => f.id === selection.factoryId);
    if (factory) {
      // Move remaining tiles to center
      const remainingTiles = factory.tiles.filter(t => t.color !== selection.color);
      newState.center.push(...remainingTiles);
      factory.tiles = [];
    }
  } else {
    // Remove tiles from center
    newState.center = newState.center.filter(t => t.color !== selection.color);
  }
  
  // Place tiles
  if (lineIndex >= 0) {
    const line = player.board.patternLines[lineIndex];
    
    // Set color if line is empty
    if (line.tiles.length === 0) {
      line.color = selection.color;
    }
    
    // Calculate how many tiles can fit in the line
    const spaceAvailable = line.spaces - line.tiles.length;
    const tilesToPlace = selectedTiles.slice(0, spaceAvailable);
    
    // Add tiles to line
    line.tiles.push(...tilesToPlace);
    
    // Overflow to floor line
    const overflow = selectedTiles.length - spaceAvailable;
    if (overflow > 0) {
      player.board.floorLine.push(...selectedTiles.slice(spaceAvailable));
    }
  } else {
    // Place all tiles in floor line
    player.board.floorLine.push(...selectedTiles);
  }
  
  // Switch to next player - simple rotation for simulation
  const currentPlayerIndex = newState.players.findIndex(p => p.id === playerId);
  const nextPlayerIndex = (currentPlayerIndex + 1) % newState.players.length;
  newState.currentPlayer = newState.players[nextPlayerIndex].id;
  
  // Check if drafting phase is complete
  if (newState.factories.every(f => f.tiles.length === 0) && newState.center.length === 0) {
    newState.gamePhase = 'tiling'; // Simplified phase transition
  }
  
  return newState;
}

/**
 * Comprehensive evaluation of a game state for a player
 * @param {GameState} gameState - Current game state
 * @param {string} playerId - ID of the player to evaluate
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {number} Score representing game state quality
 */
function evaluateGameState(gameState: GameState, playerId: string, difficulty: AIDifficulty): number {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return 0;
  
  // Base score
  let evaluation = player.board.score;
  
  // Évaluer les pattern lines, particulièrement importantes en fin de partie
  player.board.patternLines.forEach((line, rowIndex) => {
    if (line.color && line.tiles.length > 0) {
      const completionRatio = line.tiles.length / line.spaces;
      // Valoriser davantage les lignes presque complètes
      evaluation += completionRatio * completionRatio * (gameState.roundNumber >= 3 ? 8 : 5);
      
      // Évaluer l'emplacement sur le mur
      if (difficulty !== 'easy') {
        const color = line.color;
        const wallRow = player.board.wall[rowIndex];
        const columnIndex = wallRow.findIndex(space => space.color === color);
        
        if (columnIndex !== -1 && !wallRow[columnIndex].filled) {
          // Valeur d'adjacence avec bonus pour les positions stratégiques
          const adjacentValue = calculateWallAdjacencyValue(player, rowIndex, columnIndex);
          
          // Valoriser davantage les adjacences en fin de partie
          const roundMultiplier = Math.min(2.0, 1.0 + gameState.roundNumber * 0.2);
          evaluation += adjacentValue * completionRatio * roundMultiplier;
          
          if (difficulty === 'hard') {
            // Valoriser les opportunités de complétion
            evaluation += evaluateCompletionPotential(player, rowIndex, columnIndex, color) * completionRatio * 1.5;
            
            // Évaluer les options disponibles pour le prochain tour
            if (gameState.gamePhase === 'drafting') {
              evaluation += evaluateFutureOptions(gameState, player, rowIndex, columnIndex, color) * 0.7;
            }
          }
        }
      }
    }
  });
  
  // Pénalisation des tuiles de plancher
  const floorPenalty = estimateFloorPenalty(player.board.floorLine.length);
  
  // Pénaliser davantage en fin de partie
  const penaltyMultiplier = gameState.roundNumber >= 4 ? 1.5 : 1.0;
  evaluation -= floorPenalty * penaltyMultiplier;
  
  // Considérer les positions relatives
  if (difficulty === 'hard') {
    const playerRank = calculatePlayerRank(gameState, playerId);
    
    // Bonus/malus plus important selon le rang
    const rankDiff = gameState.players.length - playerRank;
    const rankBonus = rankDiff * 3;
    evaluation += rankBonus;
    
    // Bonus supérieur si leader en fin de partie
    if (rankDiff > 0 && gameState.roundNumber >= 4) {
      evaluation += rankDiff * gameState.roundNumber;
    }
  }
  
  return evaluation;
}

// Table de transposition pour éviter de recalculer des états déjà vus
const transpositionTable = new Map<string, {score: number, depth: number}>();

function getStateKey(gameState: GameState, maximizing: boolean, playerId: string): string {
  // Créer une clé unique pour l'état du jeu
  const boardStates = gameState.players.map(p => {
    const patternLines = p.board.patternLines.map(l => 
      `${l.color || 'empty'}:${l.tiles.length}`).join('|');
    const wall = p.board.wall.map(row => 
      row.map(cell => cell.filled ? '1' : '0').join('')).join('|');
    const floor = p.board.floorLine.length;
    return `${p.id}:${patternLines};${wall};${floor}`;
  }).join('/');
  
  const factories = gameState.factories.map(f => 
    `${f.id}:${f.tiles.map(t => t.color).join(',')}`).join('|');
  
  const center = gameState.center.map(t => t.color).join(',');
  
  return `${boardStates}/${factories}/${center}/${gameState.currentPlayer}/${maximizing}/${playerId}`;
}

function lookupWithTransposition(
  gameState: GameState, 
  currentPlayerId: string,
  depth: number,
  difficulty: AIDifficulty,
  maximizing: boolean = true,
  originalPlayerId: string,
  alpha: number = -Infinity,
  beta: number = Infinity
): number {
  // Vérifier la table de transposition
  const stateKey = getStateKey(gameState, maximizing, originalPlayerId);
  const cachedResult = transpositionTable.get(stateKey);
  
  if (cachedResult && cachedResult.depth >= depth) {
    return cachedResult.score;
  }
  
  // Calcul normal si pas en cache ou profondeur insuffisante
  const score = lookahead(
    gameState, currentPlayerId, depth, difficulty, 
    maximizing, originalPlayerId, alpha, beta
  );
  
  // Sauvegarder dans la table de transposition
  transpositionTable.set(stateKey, {score, depth});
  
  // Limiter la taille de la table
  if (transpositionTable.size > 100000) {
    // Nettoyer 20% des entrées les plus anciennes
    const keys = Array.from(transpositionTable.keys());
    for (let i = 0; i < keys.length * 0.2; i++) {
      transpositionTable.delete(keys[i]);
    }
  }
  
  return score;
}

/**
 * Calculate the potential adjacency value of placing a tile
 * @param {Player} player - Current player
 * @param {number} row - Wall row
 * @param {number} col - Wall column
 * @returns {number} Value score
 */
function calculateWallAdjacencyValue(player: Player, row: number, col: number): number {
  let value = 0;
  const wall = player.board.wall;
  
  // Check horizontal adjacency (already filled)
  if (col > 0 && wall[row][col-1].filled) value += 2;
  if (col < 4 && wall[row][col+1].filled) value += 2;
  
  // Check vertical adjacency (already filled)
  if (row > 0 && wall[row-1][col].filled) value += 2;
  if (row < 4 && wall[row+1][col].filled) value += 2;
  
  // Higher value for strategic center positions
  if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
    value += 1;
  }
  
  return value;
}

/**
 * Evaluate potential for completing rows, columns, and colors
 * @param {Player} player - Current player
 * @param {number} row - Wall row
 * @param {number} col - Wall column
 * @param {TileColor} color - Tile color
 * @returns {number} Potential completion value
 */
function evaluateCompletionPotential(player: Player, row: number, col: number, color: TileColor): number {
  const wall = player.board.wall;
  let potential = 0;
  
  // How close are we to completing this row?
  const filledInRow = wall[row].filter(space => space.filled).length;
  potential += Math.pow(filledInRow, 1.5);
  
  // How close are we to completing this column?
  const filledInCol = wall.map(r => r[col]).filter(space => space.filled).length;
  potential += Math.pow(filledInCol, 1.5);
  
  // How close are we to completing this color?
  const sameColorFilled = wall.flat().filter(space => space.color === color && space.filled).length;
  potential += Math.pow(sameColorFilled, 1.5);
  
  return potential;
}

/**
 * Estimate floor line penalty
 * @param {number} floorLineCount - Number of tiles in floor line
 * @returns {number} Estimated penalty
 */
function estimateFloorPenalty(floorLineCount: number): number {
  // Approximately matches floor line penalties in Azul
  const penalties = [0, 1, 2, 4, 6, 8, 11, 14];
  return floorLineCount >= penalties.length ? penalties[penalties.length-1] : penalties[floorLineCount];
}

/**
 * Calculate player's rank in current game state (1 = highest score)
 * @param {GameState} gameState - Current game state
 * @param {string} playerId - Player ID
 * @returns {number} Player rank (1-based)
 */
function calculatePlayerRank(gameState: GameState, playerId: string): number {
  const playerScores = gameState.players.map(p => ({ id: p.id, score: p.board.score }));
  playerScores.sort((a, b) => b.score - a.score);
  const rank = playerScores.findIndex(p => p.id === playerId) + 1;
  return rank;
}

/**
 * Gets all possible placement options for selected tiles
 * @param {GameState} gameState - Current game state
 * @param {Player} player - Current player
 * @param {Tile[]} selectedTiles - Tiles to be placed
 * @returns {number[]} Array of valid pattern line indices (-1 for floor line)
 */
const getPossiblePlacements = (gameState: GameState, player: Player, selectedTiles: Tile[]): number[] => {
  if (selectedTiles.length === 0) return [];
  
  // Check if floor line is mandatory
  if (mustPlaceInFloorLine(gameState, selectedTiles)) {
    return [-1];
  }
  
  const possiblePlacements: number[] = [];
  
  // Check each pattern line
  for (let i = 0; i < player.board.patternLines.length; i++) {
    if (canPlaceTiles(gameState, i, selectedTiles)) {
      possiblePlacements.push(i);
    }
  }
  
  // Floor line is always an option
  possiblePlacements.push(-1);
  
  return possiblePlacements;
};

/**
 * Evaluates a potential move based on advanced strategy
 * @param {Player} player - Current player
 * @param {number} lineIndex - Pattern line index (-1 for floor line)
 * @param {Tile[]} tiles - Tiles to be placed
 * @param {AIDifficulty} difficulty - AI difficulty level
 * @returns {number} Score representing move quality (higher is better)
 */
const evaluatePlacement = (player: Player, lineIndex: number, tiles: Tile[], difficulty: AIDifficulty): number => {
  // Floor line placement is usually bad
  if (lineIndex === -1) {
    // Calculate how bad based on existing floor tiles
    const floorCount = player.board.floorLine.length;
    return -10 - (Math.min(floorCount, 5) * 2);
  }
  
  const line = player.board.patternLines[lineIndex];
  const tileCount = tiles.length;
  const color = tiles[0].color;
  
  // Base score calculation
  let score = 0;
  
  // Value for line progress
  const progressRatio = (line.tiles.length + tileCount) / line.spaces;
  score += progressRatio * 10;
  
  // Bonus for completing lines (fills the pattern line exactly)
  if (line.tiles.length + tileCount === line.spaces) {
    score += 15 + lineIndex * 2; // Higher lines worth more when complete
  }
  // Penalty for overflow
  else if (line.tiles.length + tileCount > line.spaces) {
    const overflow = (line.tiles.length + tileCount) - line.spaces;
    score -= overflow * 3; // Penalty for wasted tiles
  }
  
  // Value efficiency of using more tiles
  score += tileCount * (difficulty === 'easy' ? 1 : 3);
  
  // Advanced strategies for medium/hard difficulties
  if (difficulty !== 'easy') {
    // Starting new lines penalty if can't complete
    if (line.tiles.length === 0 && tileCount < line.spaces) {
      score -= (line.spaces - tileCount) * 1.5;
    }
    
    // Wall placement strategic evaluation for completed lines
    if (line.tiles.length + tileCount >= line.spaces) {
      const wallRow = player.board.wall[lineIndex];
      const wallColumn = wallRow.findIndex(space => space.color === color);
      
      if (wallColumn !== -1) {
        // Strategy: prioritize positions with adjacency bonuses
        score += calculateWallAdjacencyScore(player, lineIndex, wallColumn);
        
        // Strategy: prioritize completing rows/columns/colors
        if (difficulty === 'hard') {
          score += evaluateWallCompletion(player, lineIndex, wallColumn, color);
          
          // Additional strategy: prioritize center positions
          if (wallColumn >= 1 && wallColumn <= 3) {
            score += 5;
          }
          
          // Consider existing wall state for planning
          const sameColorCount = player.board.wall.flat()
            .filter(space => space.color === color && space.filled).length;
          if (sameColorCount >= 2) {
            score += 5; // Value completing color sets more
          }
        }
      }
    }
  }
  
  return score;
};

/**
 * Calculates wall adjacency score for a potential tile placement
 * @param {Player} player - Current player
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @returns {number} Adjacency score
 */
const calculateWallAdjacencyScore = (player: Player, row: number, col: number): number => {
  let adjacentHorizontal = 0;
  let adjacentVertical = 0;
  const wall = player.board.wall;
  
  // Count horizontal adjacency
  for (let c = col - 1; c >= 0; c--) {
    if (wall[row][c].filled) adjacentHorizontal++;
    else break;
  }
  for (let c = col + 1; c < wall[row].length; c++) {
    if (wall[row][c].filled) adjacentHorizontal++;
    else break;
  }
  
  // Count vertical adjacency
  for (let r = row - 1; r >= 0; r--) {
    if (wall[r][col].filled) adjacentVertical++;
    else break;
  }
  for (let r = row + 1; r < wall.length; r++) {
    if (wall[r][col].filled) adjacentVertical++;
    else break;
  }
  
  return (adjacentHorizontal + adjacentVertical) * 5;
};

/**
 * Evaluates potential wall completion bonuses
 * @param {Player} player - Current player
 * @param {number} row - Wall row index
 * @param {number} col - Wall column index
 * @param {TileColor} color - Tile color being placed
 * @returns {number} Completion bonus score
 */
const evaluateWallCompletion = (player: Player, row: number, col: number, color: TileColor): number => {
  const wall = player.board.wall;
  let bonus = 0;
  
  // Check for row completion (5 tiles)
  if (wall[row].filter(space => space.filled).length === 4) {
    bonus += 10;
  }
  
  // Check for column completion (5 tiles)
  if (wall.filter(row => row[col].filled).length === 4) {
    bonus += 20;
  }
  
  // Check for color completion (5 tiles of same color)
  const sameColorCount = wall.flat().filter(space => space.color === color && space.filled).length;
  if (sameColorCount === 4) {
    bonus += 15;
  }
  
  return bonus;
};