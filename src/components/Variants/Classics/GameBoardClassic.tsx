import React from "react";
import PlayerBoardClassic from "./PlayerBoardClassic";
import FactoryClassic from "./FactoryClassic";
import CenterClassic from "./CenterClassic";
import { useGame } from "../../../state/GameContext";
import "./Gameboard.css";

const GameBoardClassic: React.FC = () => {
  const { gameState } = useGame();

  return (
    <div className="game-board">
      <div className="factories-center-row">
        <div className="factories">
          {gameState.factories.map((factory) => (
            <FactoryClassic key={factory.id} factoryId={factory.id} />
          ))}
        </div>
        <CenterClassic />
      </div>
      <div className="player-boards">
        {gameState.players.map((player) => (
          <PlayerBoardClassic key={player.id} playerId={player.id} />
        ))}
      </div>
    </div>
  );
};

export default GameBoardClassic; 