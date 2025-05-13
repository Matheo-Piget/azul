import React from "react";
import PlayerBoardSummer from "./PlayerBoardSummer";
import FactorySummer from "./FactorySummer";
import CenterSummer from "./CenterSummer";
import { useGame } from "../../../state/GameContext";
import "../Classics/Gameboard.css";

const GameBoardSummer: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="game-board">
      <div className="factories-center-row">
        <div className="factories">
          {gameState.factories.map((factory) => (
            <FactorySummer key={factory.id} factoryId={factory.id} />
          ))}
        </div>
        <CenterSummer />
      </div>
      <div className="player-boards">
        {gameState.players.map((player) => (
          <PlayerBoardSummer key={player.id} playerId={player.id} />
        ))}
      </div>
    </div>
  );
};

export default GameBoardSummer; 