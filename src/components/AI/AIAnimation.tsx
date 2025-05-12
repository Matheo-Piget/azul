import React, { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import { Tile as TileType, TileColor } from "../../models/types";
import "./AIAnimation.css";

interface AIAnimationProps {
  sourceElement: HTMLElement | null;
  targetElement: HTMLElement | null;
  tiles: TileType[];
  color: TileColor;
  targetType: "patternLine" | "floorLine";
  targetIndex: number;
  onAnimationComplete: () => void;
}

const AIAnimation: React.FC<AIAnimationProps> = ({
  sourceElement,
  targetElement,
  tiles,
  color,
  targetType,
  targetIndex,
  onAnimationComplete,
}) => {
  const [positions, setPositions] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [animationState, setAnimationState] = useState<"moving" | "landing" | "complete">("moving");

  // Calculate positions on mount with improved targeting
  useEffect(() => {
    if (sourceElement && targetElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // Source position (center of factory or center)
      const startX = sourceRect.left + sourceRect.width / 2;
      const startY = sourceRect.top + sourceRect.height / 2;

      // Target position with adjustments based on target type
      let endX, endY;

      if (targetType === "patternLine") {
        // For pattern lines, calculate position based on existing tiles
        const availableSpots = targetIndex + 1; // Pattern lines have 1-5 spaces
        const filledSpots = targetElement.querySelectorAll(".tile").length;

        // Calculate offset for right-to-left filling
        const tileWidth = 28;
        const tileMargin = 4;
        const offsetX = (availableSpots - filledSpots - 1) * (tileWidth + tileMargin);

        // Position at the right side of the pattern line, minus the offset
        endX = targetRect.right - 20 - offsetX;
        endY = targetRect.top + targetRect.height / 2;
      } else {
        // For floor line, position based on existing tiles
        const floorTiles = targetElement.querySelectorAll(".tile").length;
        const tileWidth = 28;
        const tileMargin = 5;

        // Floor line fills from left to right
        endX = targetRect.left + 20 + floorTiles * (tileWidth + tileMargin);
        endY = targetRect.top + targetRect.height / 2;
      }

      setPositions({
        startX,
        startY,
        endX: endX - startX, // Calculate offset for CSS transform
        endY: endY - startY, // Calculate offset for CSS transform
      });
    }
  }, [sourceElement, targetElement, targetType, targetIndex]);

  // Multi-stage animation sequence
  useEffect(() => {
    if (positions) {
      // First phase: moving
      const landingTimer = setTimeout(() => {
        setAnimationState("landing");
        
        // Second phase: landing with impact
        const completeTimer = setTimeout(() => {
          setAnimationState("complete");
          
          // Finally: complete the animation
          setTimeout(onAnimationComplete, 300);
        }, 400);
        
        return () => clearTimeout(completeTimer);
      }, 600);
      
      return () => clearTimeout(landingTimer);
    }
  }, [positions, onAnimationComplete]);

  if (!positions) return null;

  return (
    <div className="ai-animation-container">
      {Array(Math.min(tiles.length, 5))
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`ai-animated-tile ${animationState === "landing" ? "landing" : ""} 
                        ${animationState === "complete" ? "placed" : ""}`}
            style={
              {
                left: `${positions.startX}px`,
                top: `${positions.startY}px`,
                "--end-x": `${positions.endX}px`,
                "--end-y": `${positions.endY}px`,
                animationDelay: `${i * 50}ms`,
              } as React.CSSProperties
            }
          >
            <Tile color={color} />
          </div>
        ))}

      {animationState === "landing" && (
        <div
          className="tile-impact-effect"
          style={{
            left: `${positions.startX + positions.endX}px`,
            top: `${positions.startY + positions.endY}px`,
          }}
        ></div>
      )}
    </div>
  );
};

export default AIAnimation;