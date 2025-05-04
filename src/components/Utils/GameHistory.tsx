import React, { useState } from 'react';
import { getGameHistory, clearGameHistory, getGameStats, GameStats } from '../../utils/SaveService';
import './GameHistory.css';

const GameHistory: React.FC = () => {
  const [history, setHistory] = useState(getGameHistory());
  const [viewMode, setViewMode] = useState<'list' | 'stats'>('list');
  const stats = getGameStats();

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your game history?')) {
      clearGameHistory();
      setHistory([]);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="game-history">
      <div className="history-header">
        <h3>Game History</h3>
        <div className="history-actions">
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''} 
              onClick={() => setViewMode('list')}
            >
              Games
            </button>
            <button 
              className={viewMode === 'stats' ? 'active' : ''} 
              onClick={() => setViewMode('stats')}
            >
              Statistics
            </button>
          </div>
          <button onClick={handleClear} className="clear-btn">Clear History</button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <div className="game-list">
          {history.length === 0 ? (
            <div className="no-history">No games played yet</div>
          ) : (
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Players</th>
                    <th>Duration</th>
                    <th>Rounds</th>
                    <th>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice().reverse().map((game: GameStats, idx: number) => (
                    <tr key={game.id || idx} className="game-entry">
                      <td>{new Date(game.date).toLocaleString()}</td>
                      <td className="players-column">
                        {game.players.map((p, i) => (
                          <span key={i} className="player-score">
                            {p} ({game.scores[i]})
                            {game.aiLevels && game.aiLevels[i] !== 'human' && 
                              <span className="ai-label">{game.aiLevels[i]}</span>
                            }
                            {p === game.winner && <span className="winner-trophy">🏆</span>}
                          </span>
                        ))}
                      </td>
                      <td>{game.duration ? formatDuration(game.duration) : 'N/A'}</td>
                      <td>{game.rounds || 'N/A'}</td>
                      <td className="winner-column">{game.winner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="game-stats">
          {!stats ? (
            <div className="no-history">No games played yet</div>
          ) : (
            <div className="stats-content">
              <div className="stat-card">
                <div className="stat-value">{stats.totalGames}</div>
                <div className="stat-label">Games Played</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.highestScore}</div>
                <div className="stat-label">Highest Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.averageScore.toFixed(1)}</div>
                <div className="stat-label">Avg. Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{formatDuration(stats.averageDuration)}</div>
                <div className="stat-label">Avg. Duration</div>
              </div>
              {stats.mostFrequentWinner && (
                <div className="stat-card">
                  <div className="stat-value">{stats.mostFrequentWinner}</div>
                  <div className="stat-label">Most Wins</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameHistory;