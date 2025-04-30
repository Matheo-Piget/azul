/**
 * Available sound effects in the game.
 */
export type SoundEffect =
  | 'tileSelect'    // Played when selecting a tile
  | 'tilePlacement' // Played when successfully placing a tile
  | 'completeLine'  // Played when completing a line
  | 'invalidMove'   // Played when attempting an invalid move
  | 'roundComplete' // Played when a round is completed
  | 'gameOver'      // Played when the game ends (loss)
  | 'victory'       // Played when winning the game
  | 'buttonClick';  // Played when clicking UI buttons

/** 
 * Configuration for sound effect playback
 */
interface SoundConfig {
  /** Optional volume multiplier for this specific sound (0-1) */
  volumeMultiplier?: number;
  /** Optional playback rate (speed) for this sound (0.5-2.0) */
  playbackRate?: number;
}

/**
 * Service for managing game audio.
 * 
 * This class handles loading, playing, and configuring sound effects
 * while maintaining user preferences across sessions using localStorage.
 */
class AudioService {
  /** Map of preloaded audio elements for each sound effect */
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  
  /** Whether audio is currently muted */
  private muted: boolean = false;
  
  /** Current volume level (0-1) */
  private volume: number = 0.7;
  
  /** Storage keys used for persisting settings */
  private readonly STORAGE_KEY_PREFIX = 'azul_';
  private readonly VOLUME_KEY = 'volume';
  private readonly MUTED_KEY = 'muted';

  /**
   * Creates a new AudioService instance and initializes sounds.
   */
  constructor() {
    this.initSounds();
    this.loadVolumeSettings();
  }

  /**
   * Initializes and preloads all sound effects.
   * @private
   */
  private initSounds(): void {
    // Define paths to audio files
    const soundPaths: Record<SoundEffect, string> = {
      tileSelect: '/assets/sounds/tile-select.mp3',
      tilePlacement: '/assets/sounds/tile-placement.mp3',
      completeLine: '/assets/sounds/complete-line.mp3',
      invalidMove: '/assets/sounds/invalid-move.mp3',
      roundComplete: '/assets/sounds/round-complete.mp3',
      gameOver: '/assets/sounds/game-over.mp3',
      victory: '/assets/sounds/victory.mp3',
      buttonClick: '/assets/sounds/button-click.mp3'
    };

    // Create and preconfigure audio elements
    Object.entries(soundPaths).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(key as SoundEffect, audio);
    });
  }

  /**
   * Loads volume settings from localStorage.
   * @private
   */
  private loadVolumeSettings(): void {
    const savedVolume = localStorage.getItem(this.STORAGE_KEY_PREFIX + this.VOLUME_KEY);
    if (savedVolume !== null) {
      const parsedVolume = parseFloat(savedVolume);
      // Ensure volume is valid
      if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
        this.volume = parsedVolume;
      }
    }

    const savedMuted = localStorage.getItem(this.STORAGE_KEY_PREFIX + this.MUTED_KEY);
    if (savedMuted !== null) {
      this.muted = savedMuted === 'true';
    }
  }

  /**
   * Saves current volume settings to localStorage.
   * @private
   */
  private saveVolumeSettings(): void {
    localStorage.setItem(this.STORAGE_KEY_PREFIX + this.VOLUME_KEY, this.volume.toString());
    localStorage.setItem(this.STORAGE_KEY_PREFIX + this.MUTED_KEY, this.muted.toString());
  }

  /**
   * Plays the specified sound effect.
   * Does nothing if audio is muted.
   * 
   * @param sound - The sound effect to play
   * @param config - Optional configuration for this specific sound playback
   */
  play(sound: SoundEffect, config?: SoundConfig): void {
    if (this.muted) return;
    
    const audio = this.sounds.get(sound);
    if (audio) {
      try {
        // Clone the audio to allow for simultaneous playback
        const clone = audio.cloneNode() as HTMLAudioElement;
        
        // Apply volume (with optional multiplier)
        const volumeMultiplier = config?.volumeMultiplier ?? 1;
        clone.volume = this.volume * Math.max(0, Math.min(1, volumeMultiplier));
        
        // Apply playback rate if specified
        if (config?.playbackRate) {
          clone.playbackRate = Math.max(0.5, Math.min(2.0, config.playbackRate));
        }
        
        clone.play().catch(error => console.error(`Error playing sound "${sound}":`, error));
      } catch (error) {
        console.error(`Failed to play sound "${sound}":`, error);
      }
    } else {
      console.warn(`Sound "${sound}" not found`);
    }
  }

  /**
   * Sets the volume level for all sounds.
   * 
   * @param volume - Volume level between 0 (silent) and 1 (maximum)
   */
  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.saveVolumeSettings();
  }

  /**
   * Gets the current volume level.
   * 
   * @returns The current volume level (0-1)
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Toggles mute state.
   * 
   * @returns The new mute state (true if muted, false otherwise)
   */
  toggleMute(): boolean {
    this.muted = !this.muted;
    this.saveVolumeSettings();
    return this.muted;
  }

  /**
   * Sets the mute state directly.
   * 
   * @param muted - True to mute, false to unmute
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.saveVolumeSettings();
  }

  /**
   * Checks if audio is currently muted.
   * 
   * @returns True if muted, false otherwise
   */
  isMuted(): boolean {
    return this.muted;
  }
  
  /**
   * Preloads a specific sound to ensure it's ready for playback.
   * Useful for sounds that need to be played immediately without delay.
   * 
   * @param sound - The sound effect to preload
   */
  preload(sound: SoundEffect): void {
    const audio = this.sounds.get(sound);
    if (audio) {
      audio.load();
    }
  }
}

/**
 * Singleton instance of the AudioService.
 * Use this to play sounds and manage audio settings throughout the application.
 */
export const audioService = new AudioService();