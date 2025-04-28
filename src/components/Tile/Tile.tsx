import React from 'react';
import { TileColor } from '../../models/types';
import './Tile.css';

interface TileProps {
  color: TileColor;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

const Tile: React.FC<TileProps> = ({ 
  color,
  size = 'medium',
  onClick,
  selected = false,
  disabled = false
}) => {
  const sizeMap = {
    small: '30px',
    medium: '40px',
    large: '50px'
  };
  
  const colorMap: Record<TileColor, string> = {
    blue: '#1e88e5',
    yellow: '#fdd835',
    red: '#e53935',
    black: '#424242',
    teal: '#00897b'
  };
  
  const style = {
    backgroundColor: colorMap[color],
    width: sizeMap[size],
    height: sizeMap[size],
    border: selected ? '2px solid white' : '1px solid rgba(0, 0, 0, 0.2)',
    boxShadow: selected ? '0 0 5px white' : 'none',
    opacity: disabled ? 0.5 : 1
  };
  
  return (
    <div 
      className="tile"
      style={style}
      onClick={disabled ? undefined : onClick}
    />
  );
};

export default Tile;