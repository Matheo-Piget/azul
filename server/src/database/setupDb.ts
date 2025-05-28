import { pool } from './connection';

export async function setupDatabase() {
  try {
    console.log('🔧 Initialisation de la base de données...');
    
    // SQL intégré directement dans le code
    const sql = `
      -- Créer les tables si elles n'existent pas
      CREATE TABLE IF NOT EXISTS rooms (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          code VARCHAR(6) UNIQUE NOT NULL,
          host_id UUID NOT NULL,
          settings JSONB NOT NULL DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'waiting',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          max_players INTEGER DEFAULT 4
      );

      CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
          name VARCHAR(50) NOT NULL,
          is_host BOOLEAN DEFAULT FALSE,
          is_connected BOOLEAN DEFAULT TRUE,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          player_order INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_states (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
          game_data JSONB NOT NULL,
          round_number INTEGER DEFAULT 1,
          current_player_id UUID,
          game_phase VARCHAR(50) DEFAULT 'setup',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS game_moves (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
          player_id UUID REFERENCES players(id) ON DELETE CASCADE,
          move_data JSONB NOT NULL,
          move_number INTEGER,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Index pour les performances
      CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
      CREATE INDEX IF NOT EXISTS idx_players_room ON players(room_id);
      CREATE INDEX IF NOT EXISTS idx_game_states_room ON game_states(room_id);
      CREATE INDEX IF NOT EXISTS idx_moves_room ON game_moves(room_id);
    `;
    
    await pool.query(sql);
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base :', error);
    throw error;
  }
}