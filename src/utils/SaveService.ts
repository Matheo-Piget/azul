export interface GameStats {
    date: string;
    players: string[];
    scores: number[];
    winner: string;
    aiLevels?: string[];
  }
  
  const STORAGE_KEY = 'azul_game_history';
  
  export function saveGameStats(stats: GameStats) {
    const history = getGameHistory();
    history.push(stats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
  
  export function getGameHistory(): GameStats[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  
  export function clearGameHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }