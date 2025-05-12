import React, { useEffect, useState } from 'react';
import './ScoreAnimation.css';

interface ScoreAnimationProps {
  score: number;
  row: number;
  col: number;
  onComplete: () => void;
}

const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ 
  score, 
  row, 
  col, 
  onComplete 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Animation dure 1 seconde
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div 
      className="score-animation"
      style={{
        '--row': row,
        '--col': col
      } as React.CSSProperties}
    >
      +{score}
    </div>
  );
};

export default ScoreAnimation;