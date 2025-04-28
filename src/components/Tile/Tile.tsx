import React from 'react';
import { TileColor } from '../../models/types';
import './Tile.css';

interface TileProps {
  color: TileColor;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  placed?: boolean; // Pour les tuiles placées sur le mur
}

const Tile: React.FC<TileProps> = ({
  color,
  size = 'medium',
  onClick,
  selected = false,
  disabled = false,
  placed = false
}) => {
  // Couleurs plus précises du jeu Azul
  const colorMap: Record<TileColor, string> = {
    blue: '#1e88e5',     // Bleu azulejos
    yellow: '#fdd835',   // Jaune azulejos
    red: '#e53935',      // Rouge azulejos
    black: '#424242',    // Noir azulejos
    teal: '#00897b'      // Turquoise azulejos
  };
  
  const sizeClasses = {
    small: 'tile-small',
    medium: 'tile-medium',
    large: 'tile-large'
  };
  
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };
  
  const tileClasses = [
    'tile',
    sizeClasses[size],
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
    placed ? 'placed' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={tileClasses}
      style={{ backgroundColor: colorMap[color] }}
      onClick={handleClick}
      title={`Tuile ${color}`}
    >
      {/* Motif décoratif pour imiter le style azulejos */}
      <div className="tile-pattern"></div>
    </div>
  );
};

export default Tile;