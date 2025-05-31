import React, { useState } from 'react';
import { useOnlineGame } from '../hooks/useOnlineGame';
import './RoomLobby.css';
import OnlineGameBoard from './OnlineGameBoard';

const RoomLobby: React.FC = () => {
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'waiting'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const { 
    currentRoom, 
    players, 
    currentPlayer, 
    isConnected, 
    isLoading, 
    error, 
    onlineGameState,
    createRoom, 
    joinRoom, 
    leaveRoom,
    startOnlineGame
  } = useOnlineGame();

  const handleCreateRoom = async () => {
    if (!playerName.trim() || isLoading) return;
    
    const code = await createRoom(playerName, isPrivate);
    if (code) {
      setMode('waiting');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim() || isLoading) return;
    
    const success = await joinRoom(roomCode.toUpperCase(), playerName);
    if (success) {
      setMode('waiting');
    }
  };

  const handleStartGame = () => {
    startOnlineGame();
  };

  const canStartGame = currentPlayer?.is_host && players.length >= 2;

  if (onlineGameState) {
    return <OnlineGameBoard />;
  }

  // Mode d'attente dans la salle
  if (mode === 'waiting' && isConnected && currentRoom) {
    return (
      <div className="room-lobby">
        <div className="room-waiting">
          <h2>🎲 Salle de jeu</h2>
          <div className="room-info">
            <div className="room-code-display">
              <span>Code: <strong>{currentRoom.code}</strong></span>
            </div>
            <p>Joueurs connectés: {players.length}/{currentRoom.max_players}</p>
          </div>

          <div className="players-list">
            <h3>Joueurs:</h3>
            {players.map((player, index) => (
              <div key={player.id} className={`player-item ${player.is_host ? 'host' : ''}`}>
                <span className="player-name">{player.name}</span>
                {player.is_host && <span className="host-badge">👑</span>}
                <span className={`status ${player.is_connected ? 'online' : 'offline'}`}>
                  {player.is_connected ? '🟢' : '🔴'}
                </span>
              </div>
            ))}
          </div>

          <div className="room-actions">
            {canStartGame && (
              <button 
                className="btn-primary"
                onClick={handleStartGame}
                disabled={isLoading}
              >
                Démarrer la partie
              </button>
            )}
            
            <button 
              className="btn-secondary"
              onClick={() => {
                leaveRoom();
                setMode('menu');
              }}
              disabled={isLoading}
            >
              Quitter la salle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Menu principal
  return (
    <div className="room-lobby">
      <h1>🎲 Azul Multijoueur</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {mode === 'menu' && (
        <div className="lobby-menu">
          <button 
            className="btn-primary lobby-btn"
            onClick={() => setMode('create')}
            disabled={isLoading}
          >
            <span className="btn-icon">➕</span>
            Créer une partie
          </button>
          
          <button 
            className="btn-secondary lobby-btn"
            onClick={() => setMode('join')}
            disabled={isLoading}
          >
            <span className="btn-icon">🚪</span>
            Rejoindre une partie
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="create-room">
          <h2>Créer une nouvelle partie</h2>
          
          <div className="form-group">
            <label>Votre nom :</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Entrez votre nom"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isLoading}
              />
              Partie privée
            </label>
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || isLoading}
            >
              {isLoading ? 'Création...' : 'Créer la salle'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setMode('menu')}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="join-room">
          <h2>Rejoindre une partie</h2>
          
          <div className="form-group">
            <label>Votre nom :</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Entrez votre nom"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Code de la salle :</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABC123"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !roomCode.trim() || isLoading}
            >
              {isLoading ? 'Connexion...' : 'Rejoindre'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setMode('menu')}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomLobby;