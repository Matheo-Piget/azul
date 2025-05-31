import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { RoomModel } from "./models/Room";
import { setupDatabase } from "./database/setupDb";
import { GameStateModel } from "./models/GameState";
import { ClassicAzulEngine } from "../../src/game-logic/engines/classicEngine"; // Vous devrez adapter le chemin

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://azul91.netlify.app"] // Remplacez par votre domaine frontend
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://azul91.netlify.app"]
        : "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes API
app.post("/api/rooms/create", async (req, res) => {
  try {
    console.log("📝 Tentative de création de room:", req.body);

    const { playerName, settings } = req.body;

    // Utilisez la vraie base de données
    const result = await RoomModel.createRoom(playerName, settings);
    res.json(result);
  } catch (error) {
    console.error("❌ Erreur dans /api/rooms/create:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/rooms/join", async (req, res) => {
  try {
    const { code, playerName } = req.body;
    const result = await RoomModel.joinRoom(code, playerName);

    if (!result) {
      return res.status(404).json({ error: "Salle introuvable ou pleine" });
    }

    res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    res.status(500).json({ error: errorMessage });
  }
});

app.get("/api/rooms/:roomId", async (req, res) => {
  try {
    const result = await RoomModel.getRoomWithPlayers(req.params.roomId);
    if (!result) {
      return res.status(404).json({ error: "Salle introuvable" });
    }
    res.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    res.status(500).json({ error: errorMessage });
  }
});

// Socket.IO pour le temps réel
io.on("connection", (socket) => {
  console.log("Joueur connecté:", socket.id);

  socket.on("join-room", async (data) => {
    const { roomId, playerId } = data;
    socket.join(roomId);

    // Mettre à jour le statut de connexion
    await RoomModel.updatePlayerConnection(playerId, true);

    // Notifier les autres joueurs
    const roomData = await RoomModel.getRoomWithPlayers(roomId);
    io.to(roomId).emit("room-updated", roomData);
  });

  socket.on("start-game", async (data) => {
    const { roomId } = data;

    try {
      // Récupérer les joueurs de la room
      const roomData = await RoomModel.getRoomWithPlayers(roomId);
      if (!roomData) return;

      // Initialiser le jeu avec les noms des joueurs
      const engine = new ClassicAzulEngine();
      const playerNames = roomData.players.map((p) => p.name);
      const initialGameState = engine.initializeGame(playerNames);

      // Mapper les IDs des joueurs
      initialGameState.players = initialGameState.players.map(
        (player, index) => ({
          ...player,
          id: roomData.players[index].id,
        })
      );

      // Sauvegarder en base
      await GameStateModel.createGameState(roomId, initialGameState);

      // Notifier tous les joueurs
      io.to(roomId).emit("game-started", { gameState: initialGameState });
    } catch (error) {
      console.error("Erreur start-game:", error);
      socket.emit("game-error", { error: "Impossible de démarrer la partie" });
    }
  });

  socket.on("game-move", async (data) => {
    const { roomId, move, playerId } = data;

    try {
      // Récupérer l'état actuel du jeu
      const currentGameState = await GameStateModel.getGameState(roomId);
      if (!currentGameState) {
        socket.emit("game-error", { error: "Partie introuvable" });
        return;
      }

      const gameState = currentGameState.game_data;

      // Vérifier que c'est le tour du joueur
      if (gameState.currentPlayer !== playerId) {
        socket.emit("game-error", { error: "Ce n'est pas votre tour" });
        return;
      }

      // Appliquer le mouvement avec le moteur de jeu
      const engine = new ClassicAzulEngine();
      let newGameState;
      if (move.type === "selectTiles") {
        // Logique pour sélectionner des tuiles
        if (!engine.canSelectTiles(gameState, move.factoryId, move.color)) {
          socket.emit("game-error", { error: "Sélection invalide" });
          return;
        }
        // Appliquer la sélection (vous devrez adapter selon votre logique)
        newGameState = { ...gameState }; // À implémenter selon votre logique
      } else if (move.type === "placeTiles") {
        // Logique pour placer des tuiles
        newGameState = engine.applyMove(gameState, {
          patternLineIndex: move.patternLineIndex,
          selectedTiles: move.selectedTiles,
        });
      }

      // Sauvegarder le nouvel état
      await GameStateModel.updateGameState(roomId, newGameState);

      // Diffuser le nouvel état à tous les joueurs
      io.to(roomId).emit("game-state-updated", { gameState: newGameState });
    } catch (error) {
      console.error("Erreur game-move:", error);
      socket.emit("game-error", { error: "Mouvement invalide" });
    }
  });

  socket.on("disconnect", async () => {
    console.log("Joueur déconnecté:", socket.id);
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
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
}

startServer();
