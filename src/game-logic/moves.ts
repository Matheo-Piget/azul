import { GameState, Tile, TileColor } from '../models/types';

export const canSelectTiles = (gameState: GameState, factoryId: number | null, color: TileColor): boolean => {
  // Vérifier si c'est la phase de sélection
  if (gameState.gamePhase !== 'drafting') {
    return false;
  }
  
  if (factoryId !== null) {
    // Sélection depuis une fabrique
    const factory = gameState.factories.find(f => f.id === factoryId);
    if (!factory) return false;
    
    // Vérifier s'il y a des tuiles de cette couleur dans la fabrique
    return factory.tiles.some(t => t.color === color);
  } else {
    // Sélection depuis le centre
    return gameState.center.some(t => t.color === color);
  }
};

export const canPlaceTiles = (gameState: GameState, patternLineIndex: number, selectedTiles: Tile[]): boolean => {
  // Vérifier si c'est la phase de sélection
  if (gameState.gamePhase !== 'drafting') {
    return false;
  }
  
  // Trouver le joueur courant
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return false;
  
  // Si on essaye de placer directement dans la ligne de plancher (indiqué par patternLineIndex = -1)
  if (patternLineIndex === -1) {
    return true; // On permet toujours de placer dans la ligne de plancher
  }
  
  // Vérifier si l'index de ligne est valide pour les lignes de motif
  if (patternLineIndex < 0 || patternLineIndex >= currentPlayer.board.patternLines.length) {
    return false;
  }
  
  const patternLine = currentPlayer.board.patternLines[patternLineIndex];
  const sampleTile = selectedTiles[0];
  
  if (!sampleTile) return false;
  
  // Vérifier si la ligne a déjà une couleur différente
  if (patternLine.color !== null && patternLine.color !== sampleTile.color) {
    return false;
  }
  
  // Vérifier s'il reste de l'espace dans la ligne
  if (patternLine.tiles.length >= patternLine.spaces) {
    return false;
  }

  // Vérifier si la couleur est déjà sur le mur dans cette ligne
  const wallRow = currentPlayer.board.wall[patternLineIndex];
  const colorAlreadyOnWall = wallRow.some(
    space => space.color === sampleTile.color && space.filled
  );
  
  return !colorAlreadyOnWall;
};

// Nouvelle fonction pour vérifier si un joueur doit obligatoirement placer les tuiles dans la ligne de plancher
export const mustPlaceInFloorLine = (gameState: GameState, selectedTiles: Tile[]): boolean => {
  if (!selectedTiles.length) return false;
  
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
  if (!currentPlayer) return false;
  
  const color = selectedTiles[0].color;
  
  // Vérifier ligne par ligne si la couleur peut être placée quelque part
  for (let i = 0; i < currentPlayer.board.patternLines.length; i++) {
    const line = currentPlayer.board.patternLines[i];
    
    if (line.tiles.length < line.spaces && 
        (line.color === null || line.color === color)) {
      
      const wallRow = currentPlayer.board.wall[i];
      const colorAlreadyOnWall = wallRow.some(
        space => space.color === color && space.filled
      );
      
      if (!colorAlreadyOnWall) {
        return false; // Il existe une ligne valide où placer les tuiles
      }
    }
  }
  
  // Si on arrive ici, aucune ligne ne peut accueillir ces tuiles
  return true;
};