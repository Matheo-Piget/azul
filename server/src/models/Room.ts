import pool from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface Room {
  id: string;
  code: string;
  host_id: string;
  settings: any;
  status: 'waiting' | 'playing' | 'finished';
  created_at: Date;
  last_activity: Date;
  max_players: number;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  is_host: boolean;
  is_connected: boolean;
  last_seen: Date;
  player_order?: number;
}

export class RoomModel {
  // Générer un code de salle unique
  static generateCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Créer une nouvelle salle
  static async createRoom(hostName: string, settings: any = {}): Promise<{ room: Room; player: Player }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const roomId = uuidv4();
      const playerId = uuidv4();
      const code = this.generateCode();
      
      // Créer la salle
      const roomResult = await client.query(
        `INSERT INTO rooms (id, code, host_id, settings, max_players) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [roomId, code, playerId, JSON.stringify(settings), settings.maxPlayers || 4]
      );
      
      // Ajouter le host comme joueur
      const playerResult = await client.query(
        `INSERT INTO players (id, room_id, name, is_host, player_order) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [playerId, roomId, hostName, true, 1]
      );
      
      await client.query('COMMIT');
      
      return {
        room: roomResult.rows[0],
        player: playerResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Rejoindre une salle
  static async joinRoom(code: string, playerName: string): Promise<{ room: Room; player: Player } | null> {
    const client = await pool.connect();
    
    try {
      // Trouver la salle
      const roomResult = await client.query(
        'SELECT * FROM rooms WHERE code = $1 AND status = $2',
        [code, 'waiting']
      );
      
      if (roomResult.rows.length === 0) {
        return null;
      }
      
      const room = roomResult.rows[0];
      
      // Vérifier si la salle n'est pas pleine
      const playersCount = await client.query(
        'SELECT COUNT(*) FROM players WHERE room_id = $1',
        [room.id]
      );
      
      if (parseInt(playersCount.rows[0].count) >= room.max_players) {
        throw new Error('Salle pleine');
      }
      
      // Ajouter le joueur
      const playerId = uuidv4();
      const playerOrder = parseInt(playersCount.rows[0].count) + 1;
      
      const playerResult = await client.query(
        `INSERT INTO players (id, room_id, name, is_host, player_order) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [playerId, room.id, playerName, false, playerOrder]
      );
      
      return {
        room,
        player: playerResult.rows[0]
      };
    } finally {
      client.release();
    }
  }

  // Récupérer une salle avec ses joueurs
  static async getRoomWithPlayers(roomId: string): Promise<{ room: Room; players: Player[] } | null> {
    const client = await pool.connect();
    
    try {
      const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
      if (roomResult.rows.length === 0) return null;
      
      const playersResult = await client.query(
        'SELECT * FROM players WHERE room_id = $1 ORDER BY player_order',
        [roomId]
      );
      
      return {
        room: roomResult.rows[0],
        players: playersResult.rows
      };
    } finally {
      client.release();
    }
  }

  // Supprimer un joueur
  static async removePlayer(playerId: string): Promise<void> {
    await pool.query('DELETE FROM players WHERE id = $1', [playerId]);
  }

  // Mettre à jour le statut de connexion
  static async updatePlayerConnection(playerId: string, isConnected: boolean): Promise<void> {
    await pool.query(
      'UPDATE players SET is_connected = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2',
      [isConnected, playerId]
    );
  }
}