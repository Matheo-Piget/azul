export interface GameStats {
  id: string;            // Unique identifier for each game
  date: string;          // When the game was played
  players: string[];     // Player names
  scores: number[];      // Final scores
  winner: string;        // Name of the winner
  aiLevels?: string[];   // AI difficulty levels, if applicable
  duration: number;      // Game duration in seconds
  rounds: number;        // Total number of rounds played
  completedRows: number[]; // Number of rows each player completed
  completedColumns: number[]; // Number of columns each player completed
  completedColors: number[]; // Number of color sets each player completed
  moves: number[];       // Number of moves each player made
}

const STORAGE_KEY = 'azul_game_history';

export function saveGameStats(stats: GameStats) {
  const history = getGameHistory();
  history.push(stats);
  
  // Keep only the latest 50 games
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function getGameHistory(): GameStats[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearGameHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getGameStats() {
  const history = getGameHistory();
  
  if (history.length === 0) return null;
  
  return {
    totalGames: history.length,
    averageScore: history.reduce((sum, game) => 
      sum + game.scores.reduce((a, b) => a + b, 0) / game.scores.length, 0) / history.length,
    averageDuration: history.reduce((sum, game) => sum + game.duration, 0) / history.length,
    highestScore: Math.max(...history.flatMap(game => game.scores)),
    mostFrequentWinner: findMostFrequent(history.map(game => game.winner))
  };
}

function findMostFrequent(arr: string[]) {
  return arr.sort((a, b) => 
    arr.filter(v => v === a).length - arr.filter(v => v === b).length
  ).pop();
}

export function generateGameId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}