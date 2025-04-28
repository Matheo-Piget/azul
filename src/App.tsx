import React from 'react';
import GameBoard from './components/Board/GameBoard';
import { GameProvider } from './state/GameContext';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <GameProvider>
        <GameBoard />
      </GameProvider>
    </div>
  );
};

export default App;