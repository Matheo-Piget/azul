import React, { useEffect, useState } from "react";
import { Player, Tile } from "../../models/types";
import TileComponent from "../Tile/Tile";
import "./ScoringAnimation.css";

export interface AnimationStep {
  row: number;
  col: number;
  points: number;
  color: string;
}

interface Props {
  player: Player;
  steps: AnimationStep[];
  onComplete: () => void;
}

const RoundScoringAnimation: React.FC<Props> = ({ player, steps, onComplete }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current < steps.length) {
      const timer = setTimeout(() => setCurrent(current + 1), 900);
      return () => clearTimeout(timer);
    } else {
      setTimeout(onComplete, 700);
    }
  }, [current, steps.length, onComplete]);

  return (
    <div className="round-scoring-overlay">
      <div className="round-scoring-wall">
        {player.board.wall.map((row, rowIdx) =>
          row.map((space, colIdx) => {
            const stepIdx = steps.findIndex(
              (s, i) => i === current && s.row === rowIdx && s.col === colIdx
            );
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`wall-space ${space.filled ? "filled" : ""} ${
                  stepIdx !== -1 ? "animating" : ""
                }`}
              >
                {space.filled && (
                  <TileComponent color={space.color} size="small" placed />
                )}
                {stepIdx !== -1 && (
                  <span className="points-popup">+{steps[stepIdx].points}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoundScoringAnimation;