import { useState, useEffect, useCallback } from 'react';
import { roomService } from '../services/RoomService';
import { OnlineRoom, OnlinePlayer, RoomWithPlayers } from '../types/online';

export const useOnlineGame = () => {
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<OnlinePlayer | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return {
    currentRoom,
    players,
    currentPlayer,
    isConnected,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom
  };
};