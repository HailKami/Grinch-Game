import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  santaLaughSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setSantaLaughSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playSantaLaugh: () => void;
  playBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  santaLaughSound: null,
  isMuted: false, // Start unmuted so music plays automatically
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setSantaLaughSound: (sound) => set({ santaLaughSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Handle background music
    if (backgroundMusic) {
      if (newMutedState) {
        // Muting - pause the music
        backgroundMusic.pause();
      } else {
        // Unmuting - resume the music if it was playing
        if (backgroundMusic.loop) {
          backgroundMusic.play().catch(error => {
            console.log("Background music resume prevented:", error);
          });
        }
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback for rapid catches
      const soundClone = successSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.6; // Louder and more noticeable
      soundClone.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playSantaLaugh: () => {
    const { santaLaughSound, isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Santa laugh skipped (muted)");
      return;
    }
    
    if (santaLaughSound) {
      // Clone the sound to allow overlapping playback
      const soundClone = santaLaughSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.7; // Nice volume for Santa's laugh
      soundClone.play().catch(error => {
        console.log("Santa laugh play prevented:", error);
      });
    }
  },
  
  playBackgroundMusic: () => {
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic) {
      // Set up for perfect looping
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.4; // Set comfortable volume
      
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Background music skipped (muted)");
        return;
      }
      
      backgroundMusic.play().catch(error => {
        console.log("Background music play prevented:", error);
      });
    }
  },
  
  stopBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  }
}));
