import React, { useState, useEffect } from 'react';
import { audioService } from './SoundService';
import './AudioControls.css';

/**
 * AudioControls component for controlling sound volume and muting
 * Displays a button that toggles a volume slider when clicked
 * @returns React component for audio controls
 */
const AudioControls: React.FC = () => {
  /** Whether the audio is currently muted */
  const [muted, setMuted] = useState(audioService.isMuted());
  
  /** Current audio volume level (0-1) */
  const [volume, setVolume] = useState(audioService.getVolume());
  
  /** Whether the volume slider is currently visible */
  const [showVolume, setShowVolume] = useState(false);

  /**
   * Effect to update local state when audio settings change elsewhere
   * Listens for storage events to keep UI in sync with audio service
   */
  useEffect(() => {
    const handleStorageChange = () => {
      setMuted(audioService.isMuted());
      setVolume(audioService.getVolume());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Toggles mute state and plays a click sound
   */
  const toggleMute = () => {
    const newMuted = audioService.toggleMute();
    setMuted(newMuted);
    audioService.play('buttonClick');
  };

  /**
   * Handles volume slider changes
   * @param e - Input change event from volume slider
   */
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
        title="Audio Settings"
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
            title={muted ? "Enable sound" : "Mute sound"}
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