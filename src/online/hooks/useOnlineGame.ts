import { useState, useEffect, useCallback } from 'react';
import { roomService } from '../services/RoomService';
import { OnlineRoom, OnlinePlayer, RoomWithPlayers } from '../types/online';
import { GameState } from '../../models/types'; // Import ajouté

export const useOnlineGame = () => {
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<OnlinePlayer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineGameState, setOnlineGameState] = useState<GameState | null>(null);

  const startOnlineGame = useCallback(async () => {
    if (!currentRoom || !currentPlayer?.is_host) return;
    
    const socket = roomService.connect();
    socket.emit('start-game', { roomId: currentRoom.id });
  }, [currentRoom, currentPlayer]);

  const sendGameMove = useCallback(async (move: any) => {
    if (!currentRoom || !currentPlayer) return;
    
    const socket = roomService.connect();
    socket.emit('game-move', {
      roomId: currentRoom.id,
      playerId: currentPlayer.id,
      move
    });
  }, [currentRoom, currentPlayer]);

  // Créer une salle
  const createRoom = useCallback(async (playerName: string, isPrivate: boolean = false) => {
    if (isLoading) return null;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const settings = {
        maxPlayers: 4,
        variant: 'classic',
        isPrivate,
        allowSpectators: false
      };

      const result = await roomService.createRoom(playerName, settings);
      
      setCurrentRoom(result.room);
      setCurrentPlayer(result.player);
      setPlayers([result.player]);
      setIsConnected(true);
      
      // Connecter socket
      const socket = roomService.connect();
      socket.emit('join-room', { 
        roomId: result.room.id, 
        playerId: result.player.id 
      });
      
      return result.room.code;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Rejoindre une salle
  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    if (isLoading) return false;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await roomService.joinRoom(roomCode, playerName);
      
      setCurrentRoom(result.room);
      setCurrentPlayer(result.player);
      setIsConnected(true);
      
      // Récupérer tous les joueurs
      const roomData = await roomService.getRoomData(result.room.id);
      setPlayers(roomData.players);
      
      // Connecter socket
      const socket = roomService.connect();
      socket.emit('join-room', { 
        roomId: result.room.id, 
        playerId: result.player.id 
      });
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Quitter la salle
  const leaveRoom = useCallback(async () => {
    roomService.disconnect();
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setIsConnected(false);
    setError(null);
    setOnlineGameState(null);
  }, []);

  // Écouter les mises à jour de la salle
  useEffect(() => {
    if (isConnected && currentRoom) {
      const socket = roomService.connect();
      
      socket.on('room-updated', (roomData: RoomWithPlayers) => {
        setCurrentRoom(roomData.room);
        setPlayers(roomData.players);
      });
      
      return () => {
        socket.off('room-updated');
      };
    }
  }, [isConnected, currentRoom]);

  useEffect(() => {
    if (isConnected && currentRoom) {
      const socket = roomService.connect();
      
      socket.on('game-started', (data) => {
        setOnlineGameState(data.gameState);
      });
      
      socket.on('game-state-updated', (data) => {
        setOnlineGameState(data.gameState);
      });
      
      socket.on('game-error', (data) => {
        setError(data.error);
      });
      
      return () => {
        socket.off('game-started');
        socket.off('game-state-updated');
        socket.off('game-error');
      };
    }
  }, [isConnected, currentRoom]);

  return {
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
    startOnlineGame,
    sendGameMove
  };
};