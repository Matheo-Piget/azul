import React, { useState, useEffect } from 'react';
import { audioService } from './SoundService';
import './AudioControls.css';

const AudioControls: React.FC = () => {
  const [muted, setMuted] = useState(audioService.isMuted());
  const [volume, setVolume] = useState(audioService.getVolume());
  const [showVolume, setShowVolume] = useState(false);

  // Effet pour mettre à jour l'état local quand les paramètres audio changent
  useEffect(() => {
    const handleStorageChange = () => {
      setMuted(audioService.isMuted());
      setVolume(audioService.getVolume());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleMute = () => {
    const newMuted = audioService.toggleMute();
    setMuted(newMuted);
    audioService.play('buttonClick');
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioService.setVolume(newVolume);
    if (!muted && newVolume > 0) {
      audioService.play('buttonClick');
    }
  };

  return (
    <div className="audio-controls">
      <button 
        className="audio-toggle-btn"
        onClick={() => setShowVolume(!showVolume)}
        title="Paramètres audio"
      >
        <span className="audio-icon">
          {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </span>
      </button>
      
      {showVolume && (
        <div className="volume-controls">
          <button 
            className="mute-btn"
            onClick={toggleMute}
            title={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
            disabled={muted}
          />
        </div>
      )}
    </div>
  );
};

export default AudioControls;