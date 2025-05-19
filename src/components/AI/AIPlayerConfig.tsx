import React, { useCallback } from "react";
import { useGame } from "../../state/GameContext";
import { AIDifficulty } from "../../game-logic/ai/aiPlayer";
import "./AIPlayerConfig.css";

/**
 * Configuration des joueurs IA dans le jeu Azul
 * 
 * @component AIPlayerConfig
 * @description Fournit une interface pour configurer les joueurs IA dans le jeu.
 * Ce composant permet aux utilisateurs de:
 * - Activer/désactiver le contrôle IA pour chaque joueur
 * - Sélectionner le niveau de difficulté des IA (facile, moyen, difficile)
 * - Ajuster la vitesse globale des actions de l'IA
 * 
 * @returns {React.ReactElement|null} L'interface de configuration de l'IA ou null si le jeu n'est pas initialisé
 */
const AIPlayerConfig: React.FC = () => {
  // Récupération du contexte du jeu
  const { 
    gameState, 
    aiPlayers, 
    addAIPlayer, 
    removeAIPlayer, 
    aiSpeed, 
    setAISpeed 
  } = useGame();

  /**
   * Active/désactive le contrôle IA pour un joueur spécifique
   * 
   * @param {string} playerId - L'identifiant unique du joueur
   */
  const handleToggleAI = useCallback((playerId: string) => {
    if (aiPlayers[playerId]) {
      removeAIPlayer(playerId);
    } else {
      addAIPlayer(playerId, "medium");
    }
  }, [aiPlayers, addAIPlayer, removeAIPlayer]);

  /**
   * Change le niveau de difficulté d'un joueur IA
   * 
   * @param {string} playerId - L'identifiant unique du joueur
   * @param {AIDifficulty} difficulty - Le niveau de difficulté à définir
   */
  const handleChangeDifficulty = useCallback((
    playerId: string,
    difficulty: AIDifficulty
  ) => {
    removeAIPlayer(playerId);
    addAIPlayer(playerId, difficulty);
  }, [removeAIPlayer, addAIPlayer]);

  /**
   * Change la vitesse globale des actions de l'IA
   * 
   * @param {"fast" | "normal" | "slow"} speed - La vitesse à appliquer
   */
  const handleSpeedChange = useCallback((speed: "fast" | "normal" | "slow") => {
    setAISpeed(speed);
  }, [setAISpeed]);

  // Ne rien afficher si le jeu n'est pas initialisé
  if (!gameState) return null;

  // Constantes pour les traductions
  const difficultyLabels = {
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile"
  };

  const speedLabels = {
    fast: "Rapide",
    normal: "Normal", 
    slow: "Lent"
  };

  return (
    <div className="ai-player-config" role="region" aria-label="Configuration des IA">
      <h3>Configuration des IA</h3>
      <div className="ai-players-list">
        {gameState.players.map((player) => (
          <div key={player.id} className="ai-player-item">
            <div className="player-name-toggle">
              <span>{player.name}</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={!!aiPlayers[player.id]}
                  onChange={() => handleToggleAI(player.id)}
                  aria-label={`Activer l'IA pour ${player.name}`}
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
                  onChange={(e) =>
                    handleChangeDifficulty(
                      player.id,
                      e.target.value as AIDifficulty
                    )
                  }
                >
                  {Object.entries(difficultyLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="ai-global-settings">
        <h4>Vitesse de l'IA</h4>
        <div className="ai-speed-setting">
          {Object.entries(speedLabels).map(([speed, label]) => (
            <button
              key={speed}
              className={`speed-btn ${aiSpeed === speed ? "active" : ""}`}
              onClick={() => handleSpeedChange(speed as "fast" | "normal" | "slow")}
              aria-pressed={aiSpeed === speed}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIPlayerConfig;