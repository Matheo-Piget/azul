import React from 'react';
import { useGame } from '../../state/GameContext';
import { AIDifficulty } from '../../game-logic/ai/aiPlayer';
import './AIPlayerConfig.css';

/**
 * AIPlayerConfig Component
 * 
 * @component
 * @description Provides an interface to configure AI players in the game.
 * This component allows users to:
 * - Toggle AI control for any player
 * - Select difficulty level for AI players (easy, medium, hard)
 * 
 * @returns {React.ReactElement|null} The AI configuration UI or null if game is not initialized
 */
const AIPlayerConfig: React.FC = () => {
  const { gameState, aiPlayers, addAIPlayer, removeAIPlayer } = useGame();
  
  // Don't render if game isn't initialized
  if (!gameState) return null;
  
  /**
   * Toggles AI control for a specific player
   * 
   * @param {string} playerId - The unique identifier of the player
   */
  const handleToggleAI = (playerId: string) => {
    if (aiPlayers[playerId]) {
      removeAIPlayer(playerId);
    } else {
      addAIPlayer(playerId, 'medium');
    }
  };
  
  /**
   * Changes the difficulty level for an AI player
   * 
   * @param {string} playerId - The unique identifier of the player
   * @param {AIDifficulty} difficulty - The difficulty level to set
   */
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
                  aria-label={`Toggle AI for ${player.name}`}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            {aiPlayers[player.id] && (
              <div className="difficulty-selector">
                <label htmlFor={`difficulty-${player.id}`}>Difficulté:</label>
                <select
                  id={`difficulty-${player.id}`}
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