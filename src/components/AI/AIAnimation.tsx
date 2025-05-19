import React, { useEffect, useState } from "react";
import Tile from "../Tile/Tile";
import { Tile as TileType, TileColor } from "../../models/types";
import "./AIAnimation.css";

/**
 * Props pour le composant d'animation des actions de l'IA
 * @interface AIAnimationProps
 */
interface AIAnimationProps {
  /** Élément DOM source du mouvement (factory ou center) */
  sourceElement: HTMLElement | null;
  /** Élément DOM cible du mouvement (patternLine ou floorLine) */
  targetElement: HTMLElement | null;
  /** Tuiles à animer */
  tiles: TileType[];
  /** Couleur des tuiles */
  color: TileColor;
  /** Type de cible ('patternLine' ou 'floorLine') */
  targetType: "patternLine" | "floorLine";
  /** Index de la ligne ciblée (pour les pattern lines) */
  targetIndex: number;
  /** Callback appelé quand l'animation est terminée */
  onAnimationComplete: () => void;
}

/**
 * Composant qui anime les mouvements de l'IA dans le jeu Azul.
 * Gère l'animation des tuiles d'une source (fabrique/centre) vers une destination (ligne).
 * 
 * @component
 */
const AIAnimation: React.FC<AIAnimationProps> = ({
  sourceElement,
  targetElement,
  tiles,
  color,
  targetType,
  targetIndex,
  onAnimationComplete,
}) => {
  // États pour gérer les positions et les phases de l'animation
  const [positions, setPositions] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [animationState, setAnimationState] = useState<"moving" | "landing" | "complete">("moving");
  const [showPath, setShowPath] = useState(false);

  /**
   * Calcule les positions de départ et d'arrivée pour l'animation
   * Ajuste la position d'arrivée en fonction du type de cible
   */
  useEffect(() => {
    if (sourceElement && targetElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // Position de départ (centre de la source)
      const startX = sourceRect.left + sourceRect.width / 2;
      const startY = sourceRect.top + sourceRect.height / 2;

      // Position d'arrivée avec ajustements basés sur le type de cible
      let endX, endY;

      if (targetType === "patternLine") {
        // Pour les lignes de motif, calcule la position basée sur les tuiles existantes
        const availableSpots = targetIndex + 1; // Les lignes ont 1-5 espaces
        const filledSpots = targetElement.querySelectorAll(".tile").length;

        // Calcule le décalage pour le remplissage de droite à gauche
        const tileWidth = 28;
        const tileMargin = 4;
        const offsetX = (availableSpots - filledSpots - 1) * (tileWidth + tileMargin);

        // Positionne à droite de la ligne, moins le décalage
        endX = targetRect.right - 20 - offsetX;
        endY = targetRect.top + targetRect.height / 2;
      } else {
        // Pour la ligne de pénalité, positionne en fonction des tuiles existantes
        const floorTiles = targetElement.querySelectorAll(".tile").length;
        const tileWidth = 28;
        const tileMargin = 5;

        // La ligne de pénalité se remplit de gauche à droite
        endX = targetRect.left + 20 + floorTiles * (tileWidth + tileMargin);
        endY = targetRect.top + targetRect.height / 2;
      }

      // Stocke les positions calculées
      setPositions({
        startX,
        startY,
        endX: endX - startX, // Calcule le décalage pour la transformation CSS
        endY: endY - startY, // Calcule le décalage pour la transformation CSS
      });
      
      // Affiche l'effet de chemin après un court délai
      setTimeout(() => setShowPath(true), 100);
    }
  }, [sourceElement, targetElement, targetType, targetIndex]);

  /**
   * Gère la séquence d'animation en plusieurs phases
   * 1. Moving: déplacement des tuiles de la source vers la cible
   * 2. Landing: effet d'impact à l'arrivée
   * 3. Complete: fin de l'animation et callback
   */
  useEffect(() => {
    if (positions) {
      // Première phase: déplacement
      const landingTimer = setTimeout(() => {
        setAnimationState("landing");
        setShowPath(false);
        
        // Deuxième phase: atterrissage avec impact
        const completeTimer = setTimeout(() => {
          setAnimationState("complete");
          
          // Finalement: complète l'animation
          setTimeout(onAnimationComplete, 300);
        }, 400);
        
        return () => clearTimeout(completeTimer);
      }, 600);
      
      return () => clearTimeout(landingTimer);
    }
  }, [positions, onAnimationComplete]);

  // Ne rend rien si les positions ne sont pas calculées
  if (!positions) return null;

  // Calcule l'angle pour le chemin de mouvement
  const angle = Math.atan2(positions.endY, positions.endX) * (180 / Math.PI);
  const distance = Math.sqrt(positions.endX * positions.endX + positions.endY * positions.endY);

  return (
    <div className="ai-animation-container">
      {/* Chemin animé du mouvement */}
      {showPath && (
        <div
          className="ai-move-path"
          style={{
            top: `${positions.startY}px`,
            left: `${positions.startX}px`,
            width: `${distance}px`,
            transform: `rotate(${angle}deg)`,
          }}
        />
      )}
      
      {/* Effet d'ondulation à la source */}
      {animationState === "moving" && (
        <div
          className="ai-ripple"
          style={{
            top: `${positions.startY}px`,
            left: `${positions.startX}px`,
          }}
        />
      )}
      
      {/* Tuiles animées */}
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
                animationDelay: `${i * 80}ms`,
              } as React.CSSProperties
            }
          >
            <Tile color={color} />
          </div>
        ))}

      {/* Effet d'impact quand les tuiles atterrissent */}
      {animationState === "landing" && (
        <div
          className="tile-impact-effect"
          style={{
            left: `${positions.startX + positions.endX}px`,
            top: `${positions.startY + positions.endY}px`,
          }}
        />
      )}
      
      {/* Effet d'ondulation à la cible pendant l'atterrissage */}
      {animationState === "landing" && (
        <div
          className="ai-ripple"
          style={{
            top: `${positions.startY + positions.endY}px`,
            left: `${positions.startX + positions.endX}px`,
          }}
        />
      )}
    </div>
  );
};

export default AIAnimation;