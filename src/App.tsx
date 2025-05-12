import React from 'react';
import GameBoard from './components/Board/GameBoard';
import { GameProvider } from './state/GameContext';
import { NotificationProvider } from './components/UI/NotificationSystem';
import { TutorialProvider } from './components/Tutorial/TutorialSystem';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <NotificationProvider>
        <TutorialProvider>
          <GameProvider>
            <GameBoard />
          </GameProvider>
        </TutorialProvider>
      </NotificationProvider>
    </div>
  );
};

export default App;