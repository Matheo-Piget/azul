import React, { useEffect, useState, useRef } from 'react';
import './ScoringAnimation.css';

interface ScoringAnimationProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
  type?: 'regular' | 'bonus' | 'penalty' | 'row' | 'column' | 'color';
  label?: string;
  highlightElements?: HTMLElement[];
  delay?: number;
}

const ScoringAnimation: React.FC<ScoringAnimationProps> = ({ 
  points, 
  x, 
  y, 
  onComplete, 
  type = 'regular',
  label,
  highlightElements = [],
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);

  // Manage animation lifecycle with delays
  useEffect(() => {
    // Initial delay before showing the animation
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
      
      // Add highlight after animation starts
      const highlightTimer = setTimeout(() => {
        setShowHighlights(true);
        
        highlightElements.forEach(el => {
          el.classList.add('highlight-placement');
          
          // Add sliding animation
          if (el.classList.contains('wall-space')) {
            const tileElement = document.createElement('div');
            tileElement.className = 'tile-sliding';
            el.appendChild(tileElement);
          }
        });
        
        // Complete after highlights are shown and animation finishes
        const completeTimer = setTimeout(() => {
          // Remove added elements
          highlightElements.forEach(el => {
            el.classList.remove('highlight-placement');
            const slidingTile = el.querySelector('.tile-sliding');
            if (slidingTile) slidingTile.remove();
          });
          
          setIsVisible(false);
          onComplete();
        }, 1500);
        
        return () => clearTimeout(completeTimer);
      }, 300);
      
      return () => clearTimeout(highlightTimer);
    }, delay);
    
    return () => clearTimeout(initialTimer);
  }, [onComplete, highlightElements, delay]);

  // Don't render if no points or animation completed
  if (!isVisible || points === 0) return null;

  // Determine sign based on type
  const sign = type === 'penalty' ? '-' : '+';
  
  // Determine CSS class based on type
  const cssClass = `scoring-animation ${type}`;

  return (
    <div 
      ref={animationRef}
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