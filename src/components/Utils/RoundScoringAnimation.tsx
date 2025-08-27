import React, { useEffect, useMemo, useState } from "react";
import { Player, TileColor } from "../../models/types";
import TileComponent from "../Tile/Tile";
import "./ScoringAnimation.css";

export interface AnimationStep {
  row: number;
  col: number;
  points: number;
  color: TileColor;
}

interface Props {
  player: Player;
  steps: AnimationStep[];
  onComplete: () => void;
  stepDelay?: number; // ms between steps
  endDelay?: number;  // ms before closing after last step
}

const RoundScoringAnimation: React.FC<Props> = ({ player, steps, onComplete, stepDelay = 1300, endDelay = 1200 }) => {
  const [current, setCurrent] = useState(0);

  // Precompute lookup map: position => { index, color }
  const stepMap = useMemo(() => {
    const map = new Map<string, { index: number; color: TileColor; points: number }>();
    steps.forEach((s, i) => {
      const key = `${s.row}-${s.col}`;
      if (!map.has(key)) {
        map.set(key, { index: i, color: s.color, points: s.points });
      }
    });
    return map;
  }, [steps]);

  useEffect(() => {
    if (steps.length === 0) {
      const timer = setTimeout(onComplete, Math.max(300, endDelay));
      return () => clearTimeout(timer);
    }
    if (current < steps.length) {
      const timer = setTimeout(() => setCurrent((c) => c + 1), stepDelay);
      return () => clearTimeout(timer);
    } else {
      const endTimer = setTimeout(onComplete, endDelay);
      return () => clearTimeout(endTimer);
    }
  }, [current, steps.length, onComplete, stepDelay, endDelay]);

  return (
    <div className="round-scoring-overlay">
      <div className="round-scoring-header">
        <div className="round-scoring-title">Décompte - {player.name}</div>
        <div className="round-scoring-progress">{Math.min(current, steps.length)} / {steps.length}</div>
      </div>
      <div className="round-scoring-wall">
        {player.board.wall.map((row, rowIdx) =>
          row.map((_, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            const info = stepMap.get(key);
            const appeared = info && info.index <= current - 1; // already revealed
            const isCurrent = info && info.index === current - 1; // just revealed at this tick
            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`wall-space ${appeared ? "filled" : ""} ${isCurrent ? "animating" : ""}`}
              >
                {appeared && (
                  <TileComponent color={info!.color} size="small" placed />
                )}
                {isCurrent && (
                  <span className="points-popup">+{info!.points}</span>
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