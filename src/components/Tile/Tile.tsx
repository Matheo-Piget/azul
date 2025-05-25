import React, { memo } from 'react';
import { TileColor } from '../../models/types';
import './Tile.css';

/**
 * Props pour le composant Tile utilisé dans le jeu Azul
 */
interface TileProps {
  /** Couleur de la tuile */
  color: TileColor;
  /** Taille de la tuile ('small', 'medium' ou 'large') */
  size?: 'small' | 'medium' | 'large';
  /** Callback appelé quand la tuile est cliquée */
  onClick?: () => void;
  /** Indique si la tuile est actuellement sélectionnée */
  selected?: boolean;
  /** Indique si la tuile est désactivée pour l'interaction */
  disabled?: boolean;
  /** Indique si la tuile a été placée sur le mur */
  placed?: boolean;
}

/**
 * Mapping des couleurs du jeu vers des valeurs CSS
 * Utilise les couleurs authentiques du jeu Azul
 */
const TILE_COLORS: Record<TileColor, string> = {
  blue: '#1e88e5',   // Bleu azulejo
  yellow: '#fdd835', // Jaune azulejo
  red: '#e53935',    // Rouge azulejo
  black: '#424242',  // Noir azulejo
  teal: '#00897b',   // Turquoise azulejo
  green: '#43a047',  // Vert
  purple: '#9c27b0', // Violet
  orange: '#ff9800', // Orange
};

/**
 * Composant Tile pour le jeu de société Azul
 * 
 * Représente une tuile colorée avec motif décoratif de style Azulejo selon les props fournies.
 * Supporte différentes tailles, états de sélection et de placement.
 * 
 * @param {TileProps} props - Les props du composant
 * @returns {React.ReactElement} Un composant de tuile stylisé
 */
const Tile: React.FC<TileProps> = ({
  color,
  size = 'medium',
  onClick,
  selected = false,
  disabled = false,
  placed = false
}: TileProps): React.ReactElement => {
  const sizeClasses = {
    small: 'tile-small',
    medium: 'tile-medium',
    large: 'tile-large'
  };
  
  /**
   * Gère les événements de clic sur la tuile
   * Ne déclenche le callback onClick que si la tuile n'est pas désactivée
   */
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };
  
  const tileClasses = [
    'tile',
    sizeClasses[size],
    color === 'green' ? 'tile-diamond' : '',
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
    placed ? 'placed' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={tileClasses}
      style={{ backgroundColor: TILE_COLORS[color] }}
      onClick={handleClick}
      aria-disabled={disabled}
      aria-selected={selected}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {/* Motif décoratif pour imiter le style azulejos */}
      <div className="tile-pattern"></div>
    </div>
  );
};

// Utilisation de memo pour éviter les re-rendus inutiles
export default memo(Tile);