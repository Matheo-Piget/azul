import React from 'react';
import { useGame } from '../../state/GameContext';
import { AIDifficulty } from '../../game-logic/ai/aiPlayer';
import './AIPlayerConfig.css';

const AIPlayerConfig: React.FC = () => {
  const { gameState, aiPlayers, addAIPlayer, removeAIPlayer } = useGame();

  // Pas de configuration disponible si le jeu n'est pas initialisé
  if (!gameState) return null;

  const handleToggleAI = (playerId: string) => {
    if (aiPlayers[playerId]) {
      removeAIPlayer(playerId);
    } else {
      addAIPlayer(playerId, 'medium');
    }
  };

  const handleChangeDifficulty = (playerId: string, difficulty: AIDifficulty) => {
    removeAIPlayer(playerId);
    addAIPlayer(playerId, difficulty);
  };

  return (
    <div className="ai-player-config">
      <h3>Configuration des IA</h3>
      <div className="ai-players-list">
        {gameState.players.map(player => (
          <div key={player.id} className="ai-player-item">
            <div className="player-name-toggle">
              <span>{player.name}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={!!aiPlayers[player.id]}
                  onChange={() => handleToggleAI(player.id)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {aiPlayers[player.id] && (
              <div className="difficulty-selector">
                <label>Difficulté:</label>
                <select
                  value={aiPlayers[player.id]}
                  onChange={(e) => handleChangeDifficulty(player.id, e.target.value as AIDifficulty)}
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIPlayerConfig;