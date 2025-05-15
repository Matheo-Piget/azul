import React, { useState } from "react";
import PlayerBoardSummer from "./PlayerBoardSummer";
import FactorySummer from "./FactorySummer";
import CenterSummer from "./CenterSummer";
import JokerIndicator from "./JokerIndicator";
import { useGame } from "../../../state/GameContext";
import "./GameboardSummer.css";
import AIPlayerConfig from "../../AI/AIPlayerConfig";

const GameBoardSummer: React.FC = () => {
  const { gameState, startNewGame } = useGame();
  const [playerCount, setPlayerCount] = useState(2);

  // Trouver le joueur actif
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayer
  );

  // Vérifier si un joueur a le marqueur premier joueur
  const firstPlayerName = gameState.firstPlayerToken 
    ? gameState.players.find(p => p.id === gameState.firstPlayerToken)?.name
    : null;

  /**
   * Gère le clic sur le bouton nouvelle partie
   */
  const handleNewGame = () => {
    startNewGame(playerCount);
  };

  return (
    <div className="game-board game-board-summer">
      <div className="game-header">
        <div className="logo-container">
          <h1>Azul Summer Pavilion</h1>
          <div className="azulejo-pattern"></div>
        </div>
        <div className="game-banner">
          <div className="game-status">
            <div className="status-item">
              <span className="status-label">Manche</span>
              <span className="status-value">{gameState.roundNumber}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Phase</span>
              <span className="status-value">
                {gameState.gamePhase === "drafting"
                  ? "Sélection"
                  : gameState.gamePhase === "tiling"
                  ? "Placement"
                  : gameState.gamePhase === "scoring"
                  ? "Décompte"
                  : "Fin de partie"}
              </span>
            </div>
            <div className="status-item current-player-info">
              <span className="status-label">Joueur actif</span>
              <span className="status-value">
                {currentPlayer?.name}
                {gameState.firstPlayerToken === currentPlayer?.id && (
                  <span className="first-player-marker" title="Premier joueur">1</span>
                )}
              </span>
            </div>
            {firstPlayerName && gameState.firstPlayerToken && (
              <div className="status-item">
                <span className="status-label">Premier joueur</span>
                <span className="status-value">{firstPlayerName}</span>
              </div>
            )}
          </div>

          <div className="game-controls">
            <select
              id="player-count-select"
              value={playerCount}
              onChange={(e) => setPlayerCount(parseInt(e.target.value))}
              className="player-select"
              aria-label="Sélectionner le nombre de joueurs"
            >
              <option value="2">2 joueurs</option>
              <option value="3">3 joueurs</option>
              <option value="4">4 joueurs</option>
            </select>
            <button
              onClick={handleNewGame}
              className="new-game-btn"
              aria-label="Démarrer une nouvelle partie"
            >
              <span className="btn-icon">+</span>
              <span>Nouvelle partie</span>
            </button>
          </div>
        </div>
      </div>

      <JokerIndicator />

      <div className="main-area">
        <div className="factories-area">
          <h2>Fabriques</h2>
          <div className="factories-container">
            {gameState.factories.map((factory) => (
              <FactorySummer key={factory.id} factoryId={factory.id} />
            ))}
          </div>
          <div className="center-area">
            <h2>Centre</h2>
            <CenterSummer />
          </div>
        </div>
        <div className="players-area">
          <AIPlayerConfig />
          <h2>Plateaux des joueurs</h2>
          <div className="players-container">
            {gameState.players.map((player) => (
              <div 
                key={player.id}
                className={`player-board-container ${player.id === gameState.currentPlayer ? 'active-player' : ''}`}
              >
                <PlayerBoardSummer playerId={player.id} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer className="game-footer">
        <div className="game-signature">
          Azul Summer Pavilion - Inspiré du jeu de société créé par Michael Kiesling
        </div>
      </footer>
    </div>
  );
};

export default GameBoardSummer; 