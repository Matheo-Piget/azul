export interface OnlineGameState {
  id: string;
  room_id: string;
  game_data: any; // Le GameState de votre jeu
  current_player_id: string;
  created_at: Date;
  updated_at: Date;
}

export class GameStateModel {
  static async createGameState(roomId: string, initialGameData: any): Promise<OnlineGameState> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO game_states (room_id, game_data, current_player_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [roomId, JSON.stringify(initialGameData), initialGameData.currentPlayer]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async updateGameState(roomId: string, gameData: any): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE game_states 
        SET game_data = $1, current_player_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE room_id = $3
      `, [JSON.stringify(gameData), gameData.currentPlayer, roomId]);
    } finally {
      client.release();
    }
  }

  static async getGameState(roomId: string): Promise<OnlineGameState | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM game_states WHERE room_id = $1
      `, [roomId]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }
}