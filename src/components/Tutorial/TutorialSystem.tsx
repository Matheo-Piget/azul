import React, { useState, useEffect, createContext, useContext } from 'react';
import './TutorialSystem.css';
import { useGame } from '../../state/GameContext';

interface TutorialStep {
  id: number;
  title: string;
  content: React.ReactNode;
  highlight?: string; // CSS selector to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialContextType {
  isActive: boolean;
  startTutorial: () => void;
  endTutorial: () => void;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Bienvenue dans Azul!',
    content: (
      <div>
        <p>Azul est un jeu de placement de tuiles où votre objectif est de créer le plus beau mur de carrelage.</p>
        <p>Ce tutoriel va vous expliquer les règles étape par étape.</p>
      </div>
    ),
    position: 'center'
  },
  {
    id: 2,
    title: 'Les Fabriques',
    content: (
      <div>
        <p>Le jeu commence avec des fabriques remplies de tuiles colorées.</p>
        <p>À votre tour, vous devez prendre <strong>toutes les tuiles d'une même couleur</strong> d'une fabrique.</p>
        <p>Les tuiles restantes sont déplacées vers le centre.</p>
      </div>
    ),
    highlight: '.factories-area'
    // Fix for step 3
    },
  {
    id: 3,
    title: 'Le Centre',
    content: (
      <div>
        <p>Vous pouvez également prendre toutes les tuiles d'une même couleur du centre.</p>
        <p>Le premier joueur à prendre des tuiles du centre reçoit également le jeton de premier joueur.</p>
        <p>Ce joueur commencera le prochain tour, mais recevra une pénalité d'un point.</p>
      </div>
    ),
    highlight: '.center-area'
  },
  
  // Fix for step 4
  {
    id: 4,
    title: 'Les Lignes de Motif',
    content: (
      <div>
        <p>Après avoir sélectionné des tuiles, vous devez les placer sur l'une de vos lignes de motif.</p>
        <p>Chaque ligne ne peut contenir qu'une seule couleur de tuile.</p>
        <p>Si une ligne est déjà commencée avec une couleur, vous ne pouvez ajouter que des tuiles de cette même couleur.</p>
      </div>
    ),
    highlight: '.pattern-lines'
  },
  
  // Fix for step 5
  {
    id: 5,
    title: 'Le Mur',
    content: (
      <div>
        <p>Quand une ligne de motif est complète, une tuile est placée sur le mur à la fin du tour.</p>
        <p>Chaque ligne du mur ne peut contenir qu'une tuile de chaque couleur.</p>
        <p>Les points sont marqués en fonction des tuiles adjacentes sur le mur.</p>
      </div>
    ),
    highlight: '.wall'
  },
  
  // Fix for step 6
  {
    id: 6,
    title: 'Ligne de Pénalité',
    content: (
      <div>
        <p>Les tuiles que vous ne pouvez pas placer sur vos lignes de motif vont dans la ligne de pénalité.</p>
        <p>Chaque tuile dans cette ligne vous fait perdre des points à la fin du tour.</p>
        <p>Plus vous avez de tuiles ici, plus la pénalité est importante!</p>
      </div>
    ),
    highlight: '.floor-line'
  },
  
  // Fix for step 7
  {
    id: 7,
    title: 'Fin de Partie',
    content: (
      <div>
        <p>La partie se termine quand un joueur complète au moins une ligne horizontale sur son mur.</p>
        <p>Des points bonus sont attribués pour:</p>
        <ul>
          <li>2 points par ligne horizontale complète</li>
          <li>7 points par colonne verticale complète</li>
          <li>10 points par couleur complète (5 tuiles de la même couleur)</li>
        </ul>
      </div>
    ),
    position: 'center'
  },
  
  // Fix for step 8
  {
    id: 8,
    title: 'C\'est parti!',
    content: (
      <div>
        <p>Vous connaissez maintenant les règles de base d'Azul!</p>
        <p>Sélectionnez des tuiles des fabriques ou du centre, puis placez-les sur vos lignes de motif.</p>
        <p>Vous pouvez aussi jouer contre l'IA en utilisant les options de configuration.</p>
        <p>Bonne chance!</p>
      </div>
    ),
    position: 'center'
  },
];

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  // Update highlight when step changes
  useEffect(() => {
    if (!isActive) return;
    
    const step = tutorialSteps[currentStep];
    if (step?.highlight) {
      const element = document.querySelector(step.highlight) as HTMLElement;
      setHighlightElement(element);
    } else {
      setHighlightElement(null);
    }
  }, [currentStep, isActive]);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTutorial = () => {
    setIsActive(false);
    setHighlightElement(null);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < tutorialSteps.length) {
      setCurrentStep(step);
    }
  };

  return (
    <TutorialContext.Provider value={{
      isActive,
      startTutorial,
      endTutorial,
      currentStep,
      totalSteps: tutorialSteps.length,
      nextStep,
      prevStep,
      goToStep
    }}>
      {children}
      {isActive && <TutorialOverlay 
        step={tutorialSteps[currentStep]} 
        currentStep={currentStep}
        totalSteps={tutorialSteps.length}
        onNext={nextStep}
        onPrev={prevStep}
        onClose={endTutorial}
        highlightElement={highlightElement}
      />}
    </TutorialContext.Provider>
  );
};

/**
 *  TutorialOverlay component
 */
const TutorialOverlay: React.FC<{
  step: TutorialStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  highlightElement: HTMLElement | null;
}> = ({ step, currentStep, totalSteps, onNext, onPrev, onClose, highlightElement }) => {
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' });

  useEffect(() => {
    if (highlightElement && step.position !== 'center') {
      const rect = highlightElement.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
            const position = { top: '50%', left: '50%' };

      switch (step.position || 'bottom') {
        case 'top':
          position.top = `${Math.max(rect.top - 280, 20)}px`;
          position.left = `${rect.left + rect.width / 2}px`;
          break;
        case 'bottom':
          position.top = `${rect.bottom + 20}px`;
          position.left = `${rect.left + rect.width / 2}px`;
          break;
        case 'left':
          position.top = `${rect.top + rect.height / 2}px`;
          position.left = `${Math.max(rect.left - 350, 20)}px`;
          break;
        case 'right':
          position.top = `${rect.top + rect.height / 2}px`;
          position.left = `${rect.right + 20}px`;
          break;
      }

      setModalPosition(position);
    } else {
      setModalPosition({ top: '50%', left: '50%' });
    }
  }, [highlightElement, step]);

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-highlight-container">
        {highlightElement && (
          <div 
            className="tutorial-highlight"
            style={{
              top: highlightElement.getBoundingClientRect().top + 'px',
              left: highlightElement.getBoundingClientRect().left + 'px',
              width: highlightElement.getBoundingClientRect().width + 'px',
              height: highlightElement.getBoundingClientRect().height + 'px',
            }}
          />
        )}
      </div>
      
      <div 
        className={`tutorial-modal ${step.position === 'center' ? 'tutorial-modal-center' : ''}`}
        style={{
          left: modalPosition.left,
          top: modalPosition.top,
          transform: step.position === 'center' ? 'translate(-50%, -50%)' : 'none'
        }}
      >
        <div className="tutorial-header">
          <h3>{step.title}</h3>
          <button className="tutorial-close" onClick={onClose}>×</button>
        </div>
        
        <div className="tutorial-content">
          {step.content}
        </div>
        
        <div className="tutorial-progress">
          <div className="tutorial-dots">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`tutorial-dot ${index === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="tutorial-navigation">
            {currentStep > 0 && (
              <button className="tutorial-prev" onClick={onPrev}>Précédent</button>
            )}
            <button className="tutorial-next" onClick={onNext}>
              {currentStep === totalSteps - 1 ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialProvider;