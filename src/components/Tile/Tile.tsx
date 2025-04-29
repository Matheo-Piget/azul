import React from 'react';
import { TileColor } from '../../models/types';
import './Tile.css';

/**
 * Props for the Tile component used in the Azul game
 * @interface TileProps
 * @property {TileColor} color - The color of the tile
 * @property {'small' | 'medium' | 'large'} [size='medium'] - Size of the tile
 * @property {() => void} [onClick] - Callback function when tile is clicked
 * @property {boolean} [selected=false] - Whether the tile is currently selected
 * @property {boolean} [disabled=false] - Whether the tile is disabled for interaction
 * @property {boolean} [placed=false] - Whether the tile has been placed on the wall
 */
interface TileProps {
  color: TileColor;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  placed?: boolean;
}

/**
 * Tile component for the Azul board game
 * 
 * Renders a colored tile with decorative Azulejo-style pattern based on the provided props.
 * Supports different sizes, selection states, and placement states.
 * 
 * @param {TileProps} props - The component props
 * @returns {React.ReactElement} A styled tile component
 */
const Tile: React.FC<TileProps> = ({
  color,
  size = 'medium',
  onClick,
  selected = false,
  disabled = false,
  placed = false
}) => {
  // Color mapping for authentic Azul game colors
  const colorMap: Record<TileColor, string> = {
    blue: '#1e88e5',   // Azulejo blue
    yellow: '#fdd835', // Azulejo yellow
    red: '#e53935',    // Azulejo red
    black: '#424242',  // Azulejo black
    teal: '#00897b'    // Azulejo turquoise
  };
  
  const sizeClasses = {
    small: 'tile-small',
    medium: 'tile-medium',
    large: 'tile-large'
  };
  
  /**
   * Handles click events on the tile
   * Only triggers the onClick callback if the tile is not disabled
   */
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
      aria-disabled={disabled}
      aria-selected={selected}
    >
      {/* Decorative pattern to mimic azulejos style */}
      <div className="tile-pattern"></div>
    </div>
  );
};

export default Tile;