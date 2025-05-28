import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomModel } from './models/Room';
import { setupDatabase } from './database/setupDb';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://azul91.netlify.app/"] // Remplacez par votre domaine frontend
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes API
app.post('/api/rooms/create', async (req, res) => {
  try {
    const { playerName, settings } = req.body;
    const result = await RoomModel.createRoom(playerName, settings);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/rooms/join', async (req, res) => {
  try {
    const { code, playerName } = req.body;
    const result = await RoomModel.joinRoom(code, playerName);
    
    if (!result) {
      return res.status(404).json({ error: 'Salle introuvable ou pleine' });
    }
    
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const result = await RoomModel.getRoomWithPlayers(req.params.roomId);
    if (!result) {
      return res.status(404).json({ error: 'Salle introuvable' });
    }
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: errorMessage });
  }
});

// Socket.IO pour le temps réel
io.on('connection', (socket) => {
  console.log('Joueur connecté:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, playerId } = data;
    socket.join(roomId);
    
    // Mettre à jour le statut de connexion
    await RoomModel.updatePlayerConnection(playerId, true);
    
    // Notifier les autres joueurs
    const roomData = await RoomModel.getRoomWithPlayers(roomId);
    io.to(roomId).emit('room-updated', roomData);
  });

  socket.on('game-move', (data) => {
    const { roomId, move } = data;
    // Diffuser le mouvement à tous les joueurs de la salle
    socket.to(roomId).emit('game-move', move);
  });

  socket.on('disconnect', async () => {
    console.log('Joueur déconnecté:', socket.id);
    // Gérer la déconnexion...
  });
});

async function startServer() {
  try {
    await setupDatabase();
    
    const PORT = process.env.PORT || process.env.SERVER_PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

startServer();