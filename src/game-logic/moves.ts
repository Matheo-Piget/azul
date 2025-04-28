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
  
  // Vérifier si l'index de ligne est valide
  if (patternLineIndex < 0 || patternLineIndex >= currentPlayer.board.patternLines.length) {
    return false;
  }
  
  const patternLine = currentPlayer.board.patternLines[patternLineIndex];
  const sampleTile = selectedTiles[0]; // Now using the parameter instead of gameState property
  
  if (!sampleTile) return false;
  
  // Vérifier si la ligne a déjà une couleur différente
  if (patternLine.color !== null && patternLine.color !== sampleTile.color) {
    return false;
  }
  
  // Vérifier s'il reste de l'espace dans la ligne
  if (patternLine.tiles.length >= patternLine.spaces) {
    return false;
  }
  
  const wallRow = currentPlayer.board.wall[patternLineIndex];
  const colorAlreadyOnWall = wallRow.some(
    space => space.color === sampleTile.color && space.filled
  );
  
  return !colorAlreadyOnWall;
};