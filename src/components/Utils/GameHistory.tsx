import React from 'react';
import { getGameHistory, clearGameHistory } from '../../utils/SaveService';

const GameHistory: React.FC = () => {
  const [history, setHistory] = React.useState(getGameHistory());

  const handleClear = () => {
    clearGameHistory();
    setHistory([]);
  };

  return (
    <div className="game-history">
      <h3>Historique des parties</h3>
      <button onClick={handleClear}>Effacer l’historique</button>
      <ul>
        {history.slice().reverse().map((game: { date: string | number | Date; players: any[]; scores: number[]; }, idx: React.Key | null | undefined) => (
          <li key={idx}>
            <strong>{new Date(game.date).toLocaleString()}</strong> — 
            {game.players.map((p, i) => (
              <span key={i}> {p} ({game.scores[i]}){i === game.scores.indexOf(Math.max(...game.scores)) ? ' 🏆' : ''}</span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameHistory;