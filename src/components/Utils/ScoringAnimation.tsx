import React, { useEffect, useState } from 'react';
import './ScoringAnimation.css';

interface ScoringAnimationProps {
  points: number;
  x: number;
  y: number;
  onComplete: () => void;
  type?: 'regular' | 'bonus' | 'penalty' | 'row' | 'column' | 'color';
  label?: string;
  highlightElements?: HTMLElement[];
}

const ScoringAnimation: React.FC<ScoringAnimationProps> = ({ 
  points, 
  x, 
  y, 
  onComplete, 
  type = 'regular',
  label,
  highlightElements = []
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showHighlights, setShowHighlights] = useState(false);

  // First show the animation, then highlight relevant elements
  useEffect(() => {
    // First phase: show highlights after a short delay
    const highlightTimer = setTimeout(() => {
      setShowHighlights(true);
      
      // Add highlight divs to the elements
      highlightElements.forEach(el => {
        const highlight = document.createElement('div');
        highlight.className = 'wall-tile-highlight';
        if (type === 'row') highlight.classList.add('row-highlight');
        if (type === 'column') highlight.classList.add('column-highlight');
        if (type === 'color') highlight.classList.add('color-highlight');
        el.appendChild(highlight);
      });
      
      // Second phase: complete animation after highlights are shown
      const completeTimer = setTimeout(() => {
        // Remove highlight elements
        highlightElements.forEach(el => {
          const highlights = el.querySelectorAll('.wall-tile-highlight');
          highlights.forEach(h => h.remove());
        });
        
        setIsVisible(false);
        onComplete();
      }, 1500);
      
      return () => clearTimeout(completeTimer);
    }, 300);
    
    return () => clearTimeout(highlightTimer);
  }, [onComplete, highlightElements, type]);

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