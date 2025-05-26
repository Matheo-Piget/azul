import React, { useEffect, useState } from 'react';
import './ScoringAnimation.css'; // Utiliser le même fichier CSS

interface RoundTransitionProps {
  roundNumber: number;
  onComplete: () => void;
  autoProgress?: boolean;
  delay?: number;
}

const RoundTransition: React.FC<RoundTransitionProps> = ({ 
  roundNumber, 
  onComplete, 
  autoProgress = true,
  delay = 2000 
}) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Show transition with slight delay
    const showTimer = setTimeout(() => {
      setVisible(true);
      
      // Auto-progress after delay if enabled
      if (autoProgress) {
        const progressTimer = setTimeout(handleContinue, delay);
        return () => clearTimeout(progressTimer);
      }
    }, 500);
    
    return () => clearTimeout(showTimer);
  });
  
  const handleContinue = () => {
    setVisible(false);
    setTimeout(onComplete, 300); // Allow fade-out animation to complete
  };
  
  return (
    <div className={`round-transition ${visible ? 'visible' : ''}`}>
      <div className="round-message">
        <div className="round-number">Manche {roundNumber}</div>
        <div>Préparation en cours...</div>
        {!autoProgress && (
          <button className="continue-btn" onClick={handleContinue}>
            Continuer
          </button>
        )}
      </div>
    </div>
  );
};

export default RoundTransition;