import React, { useEffect, useState } from 'react';
import './ScoringAnimation.css';

interface ScoringAnimationProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
  type?: 'regular' | 'bonus' | 'penalty';
  label?: string;
}

const ScoringAnimation: React.FC<ScoringAnimationProps> = ({ 
  points, 
  x, 
  y, 
  onComplete, 
  type = 'regular',
  label
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Don't render if no points or animation completed
  if (!isVisible || points === 0) return null;

  // Determine sign based on type
  const sign = type === 'penalty' ? '-' : '+';
  
  // Determine CSS class based on type
  const cssClass = `scoring-animation ${type}`;

  return (
    <div 
      className={cssClass} 
      style={{ 
        left: `${x}px`, 
        top: `${y}px` 
      }}
    >
      <span className="scoring-points">
        {sign}{Math.abs(points)}
      </span>
      {label && <span className="scoring-label">{label}</span>}
    </div>
  );
};

export default ScoringAnimation;