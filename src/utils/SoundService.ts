// Liste des sons disponibles dans notre jeu
export type SoundEffect = 
  | 'tileSelect'
  | 'tilePlacement'
  | 'completeLine'
  | 'invalidMove'
  | 'roundComplete'
  | 'gameOver'
  | 'victory'
  | 'buttonClick';

// Classe pour gérer l'audio
class AudioService {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private muted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    this.initSounds();
    this.loadVolumeSettings();
  }

  // Initialiser les sons
  private initSounds() {
    // Définir les chemins vers les fichiers audio
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

    // Créer et préconfigurer les éléments audio
    Object.entries(soundPaths).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(key as SoundEffect, audio);
    });
  }

  // Charger les paramètres de volume depuis le localStorage
  private loadVolumeSettings() {
    const savedVolume = localStorage.getItem('azul_volume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }

    const savedMuted = localStorage.getItem('azul_muted');
    if (savedMuted !== null) {
      this.muted = savedMuted === 'true';
    }
  }

  // Sauvegarder les paramètres de volume
  private saveVolumeSettings() {
    localStorage.setItem('azul_volume', this.volume.toString());
    localStorage.setItem('azul_muted', this.muted.toString());
  }

  // Jouer un son
  play(sound: SoundEffect): void {
    if (this.muted) return;
    
    const audio = this.sounds.get(sound);
    if (audio) {
      // Cloner l'audio pour permettre des lectures simultanées
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch(error => console.error('Erreur lors de la lecture du son:', error));
    }
  }

  // Définir le volume (0-1)
  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.saveVolumeSettings();
  }

  // Obtenir le volume actuel
  getVolume(): number {
    return this.volume;
  }

  // Activer/désactiver le son
  toggleMute(): boolean {
    this.muted = !this.muted;
    this.saveVolumeSettings();
    return this.muted;
  }

  // Vérifier si le son est coupé
  isMuted(): boolean {
    return this.muted;
  }
}

// Exporter une instance unique du service
export const audioService = new AudioService();