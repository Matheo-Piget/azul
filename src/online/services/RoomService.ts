import io, { Socket } from 'socket.io-client';

export class RoomService {
  private socket: Socket | null = null;
  private serverUrl = 'http://azul-production.up.railway.app';

  connect() {
    if (!this.socket) {
      this.socket = io(this.serverUrl);
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async createRoom(playerName: string, settings: any) {
    const response = await fetch(`${this.serverUrl}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, settings })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création');
    }
    return response.json();
  }

  async joinRoom(code: string, playerName: string) {
    const response = await fetch(`${this.serverUrl}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerName })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la connexion');
    }
    return response.json();
  }

  async getRoomData(roomId: string) {
    const response = await fetch(`${this.serverUrl}/api/rooms/${roomId}`);
    if (!response.ok) {
      throw new Error('Salle introuvable');
    }
    return response.json();
  }
}

export const roomService = new RoomService();