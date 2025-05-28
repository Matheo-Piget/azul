import { pool } from './connection';
import fs from 'fs';
import path from 'path';

export async function setupDatabase() {
  try {
    console.log('🔧 Initialisation de la base de données...');
    
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base :', error);
    throw error;
  }
}