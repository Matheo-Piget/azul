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
        // For pattern lines, calculate position based on line index
        // The higher index lines have more potential tiles
        const availableSpots = targetIndex + 1; // Pattern lines have 1-5 spaces
        const filledSpots = targetElement.querySelectorAll(".tile").length;

        // Calculate position for the next empty tile space
        // We need to check how many tiles are already there
        // and place the new tile in the next empty space
        const tileWidth = 28; // Width of a tile space
        const tileMargin = 4; // Margin between tiles (2px on each side)

        // Calculate offset to place tile at the right position within the line
        // Move from right to left as tiles fill from right side
        const offsetX =
          (availableSpots - filledSpots - 1) * (tileWidth + tileMargin);

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

  // Rest of the component stays the same
  useEffect(() => {
    if (positions) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 800);

      return () => clearTimeout(timer);
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
            className="ai-animated-tile"
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

      {/* Effet d'impact qui s'active à la fin de l'animation */}
      <div
        className="tile-impact-effect"
        style={{
          left: `${positions.startX + positions.endX}px`,
          top: `${positions.startY + positions.endY}px`,
          animationDelay: `${Math.min(tiles.length, 5) * 50 + 600}ms`, // Apparaît juste avant la fin de l'animation
        }}
      ></div>
    </div>
  );
};

export default AIAnimation;
