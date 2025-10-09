import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  
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
  isMuted: false, // Start unmuted so music plays automatically
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  
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
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Santa laugh skipped (muted)");
      return;
    }
    
    // Use browser's Speech Synthesis API to make Santa say "Ho Ho Ho"
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance("Ho Ho Ho!");
      utterance.pitch = 0.7; // Lower pitch for a deeper, jollier voice
      utterance.rate = 0.8; // Slightly slower for emphasis
      utterance.volume = 0.8; // Nice and loud
      
      window.speechSynthesis.speak(utterance);
      console.log("Santa says: Ho Ho Ho!");
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
