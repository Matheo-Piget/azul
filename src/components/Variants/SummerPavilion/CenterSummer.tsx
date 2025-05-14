import React, { useEffect, useState, useMemo } from 'react';
import { useGame } from '../../../state/GameContext';
import { TileColor } from '../../../models/types';
import '../Classics/Center.css';

const CenterSummer: React.FC = () => {
  const { gameState, selectTiles, selectedTiles } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  const [showPenalty, setShowPenalty] = useState(false);
  const isCurrentPlayer = gameState.currentPlayer === gameState.players.find(p => p.id === gameState.currentPlayer)?.id;
  const jokerColor = gameState.jokerColor || 'joker';
  
  // Animation d'apparition
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Regrouper les tuiles par couleur
  const tilesByColor = useMemo(() => {
    const groupedTiles: Record<TileColor, number> = {
      blue: 0,
      yellow: 0,
      red: 0,
      black: 0,
      teal: 0,
      green: 0,
      purple: 0,
      orange: 0,
    };
    
    gameState.center.forEach(tile => {
      groupedTiles[tile.color]++;
    });
    
    return groupedTiles;
  }, [gameState.center]);
  
  // Vérifier si des tuiles sont déjà sélectionnées
  const hasSelectedTiles = selectedTiles && selectedTiles.length > 0;
  
  // Si le centre est vide, afficher un message
  if (gameState.center.length === 0) {
    return (
      <div className="center-container empty">
        <div className="center center-empty">
          <div className="center-label">Aucune tuile</div>
        </div>
      </div>
    );
  }
  
  // Fonction pour gérer la sélection des tuiles
  const handleSelectTiles = (color: TileColor) => {
    // Ne peut sélectionner que si c'est la phase drafting, aucune tuile n'est déjà sélectionnée, et c'est le tour du joueur
    if (gameState.gamePhase !== 'drafting' || hasSelectedTiles || !isCurrentPlayer) return;
    
    // Ne peut pas sélectionner la couleur joker directement, sauf exception
    const hasOnlyJokers = gameState.center.every(t => t.color === jokerColor);
    
    // Si on essaie de sélectionner directement des jokers mais ce n'est pas que des jokers
    if (color === jokerColor && !hasOnlyJokers) {
      return;
    }
    
    // Si c'est le premier joueur à prendre du centre
    if (gameState.firstPlayerToken === null) {
      // Animation pour montrer la pénalité
      setShowPenalty(true);
      setTimeout(() => setShowPenalty(false), 2000);
    }
    
    selectTiles(null, color); // null indique le centre
  };
  
  // Calcul de la pénalité potentielle si on prend du centre
  const calculatePenalty = (color: TileColor) => {
    if (gameState.firstPlayerToken !== null) return 0;
    
    // Nombre de tuiles de la couleur sélectionnée
    const colorCount = tilesByColor[color];
    
    // Si on prend une couleur autre que joker, et qu'il y a des jokers, on en prend un
    const jokerCount = color !== jokerColor && tilesByColor[jokerColor as TileColor] > 0 ? 1 : 0;
    
    return colorCount + jokerCount;
  };
  
  return (
    <div className={`center-container ${showPenalty ? 'penalty-animation' : ''}`}>
      <div className={`center ${isVisible ? 'visible' : ''}`}>
        {gameState.firstPlayerToken === null && (
          <div className="first-player-token" title="Premier joueur">
            <span className="marker-icon">1</span>
          </div>
        )}
        
        <div className="center-tiles">
          {Object.entries(tilesByColor).map(([color, count]) => {
            if (count === 0) return null;
            
            const tileColor = color as TileColor;
            
            // Règles spéciales pour le joker:
            // 1. Si ce sont uniquement des jokers, on peut en prendre un seul
            // 2. Sinon, on ne peut pas sélectionner directement des jokers
            const isJokerColor = tileColor === jokerColor;
            const onlyJokers = isJokerColor && gameState.center.every(t => t.color === jokerColor);
            
            // Une couleur est sélectionnable si:
            // - C'est le tour du joueur
            // - C'est la phase de drafting
            // - Aucune tuile n'est déjà sélectionnée
            // - Et (ce n'est pas la couleur joker OU ce sont uniquement des jokers)
            const isSelectable = 
              gameState.gamePhase === 'drafting' && 
              !hasSelectedTiles && 
              (!isJokerColor || onlyJokers) && 
              isCurrentPlayer;
            
            // Calcul de la pénalité
            const penalty = isSelectable ? calculatePenalty(tileColor) : 0;
            
            return (
              <div 
                key={color}
                className={`tile-group ${isSelectable ? 'selectable' : ''}`}
                onClick={() => isSelectable && handleSelectTiles(tileColor)}
                title={
                  isJokerColor && !onlyJokers 
                    ? "Vous ne pouvez pas sélectionner directement des tuiles joker" 
                    : `Sélectionner ${count} tuile${count > 1 ? 's' : ''} ${tileColor}${isJokerColor ? " (une seule)" : ""}${
                        gameState.firstPlayerToken === null 
                          ? ` (-${penalty} points)`
                          : ""
                      }`
                }
              >
                {/* Afficher une tuile en losange pour Summer Pavilion */}
                <div className={`diamond-tile tile-${color}`} />
                
                {count > 1 && (
                  <div className="tile-count">{count}</div>
                )}
                
                {/* Indicateur de pénalité pour premier joueur */}
                {gameState.firstPlayerToken === null && isSelectable && (
                  <div className="penalty-indicator">-{penalty}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CenterSummer; 