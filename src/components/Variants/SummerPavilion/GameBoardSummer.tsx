import React from "react";
import PlayerBoardSummer from "./PlayerBoardSummer";
import FactorySummer from "./FactorySummer";
import CenterSummer from "./CenterSummer";
import { useGame } from "../../../state/GameContext";
import "../Classics/Gameboard.css";
import AIPlayerConfig from "../../AI/AIPlayerConfig";

const GameBoardSummer: React.FC = () => {
  const { gameState } = useGame();

  // Trouver le joueur actif
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayer
  );

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
              <span className="status-value">{currentPlayer?.name}</span>
            </div>
          </div>
        </div>
      </div>
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
              <PlayerBoardSummer key={player.id} playerId={player.id} />
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