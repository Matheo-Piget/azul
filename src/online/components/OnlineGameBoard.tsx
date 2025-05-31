import React from 'react';
import { useOnlineGame } from '../hooks/useOnlineGame';
import Factory from '../../components/Variants/Classics/FactoryClassic';
import Center from '../../components/Variants/Classics/CenterClassic';
import PlayerBoard from '../../components/Variants/Classics/PlayerBoardClassic';

const OnlineGameBoard: React.FC = () => {
  const { onlineGameState, currentPlayer } = useOnlineGame();
  
  if (!onlineGameState) {
    return <div>Chargement de la partie...</div>;
  }
  
  // Suppression temporaire des handlers non utilisés
  // TODO: Implémenter l'intégration avec les composants Factory, Center et PlayerBoard
  // const handleSelectTiles = (factoryId: number | null, color: TileColor) => {
  //   sendGameMove({
  //     type: 'selectTiles',
  //     factoryId,
  //     color
  //   });
  // };
  
  // const handlePlaceTiles = (patternLineIndex: number, selectedTiles: Tile[]) => {
  //   sendGameMove({
  //     type: 'placeTiles',
  //     patternLineIndex,
  //     selectedTiles
  //   });
  // };
  
  const isMyTurn = onlineGameState.currentPlayer === currentPlayer?.id;
  
  return (
    <div className="online-game-board">
      <div className="game-status">
        {isMyTurn ? "C'est votre tour" : "En attente..."}
      </div>
      
      <div className="factories-area">
        {onlineGameState.factories.map((factory: any) => (
          <Factory
            key={factory.id}
            factoryId={factory.id}
            // TODO: Ajouter onTileSelect quand l'interface sera mise à jour
          />
        ))}
      </div>
      
      <Center 
        // TODO: Ajouter onTileSelect quand l'interface sera mise à jour
      />
      
      <div className="players-area">
        {onlineGameState.players.map((player: any) => (
          <PlayerBoard
            key={player.id}
            playerId={player.id}
            // TODO: Ajouter onPlaceTiles quand l'interface sera mise à jour
          />
        ))}
      </div>
    </div>
  );
};

export default OnlineGameBoard;