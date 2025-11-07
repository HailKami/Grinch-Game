import { create } from "zustand";

export type GameState = "usernameInput" | "playing" | "gameOver";

interface Gift {
  id: string;
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

interface GrinchGameState {
  gameState: GameState;
  username: string;
  walletAddress?: string;
  score: number;
  gifts: Gift[];
  grinchPosition: Position;
  santaPosition: Position;
  difficulty: number;
  
  // Actions
  setUsername: (username: string) => void;
  setWalletAddress: (wallet: string) => void;
  startGame: () => void;
  endGame: () => void;
  restartGame: () => void;
  changeUsername: () => void;
  updateGrinch: (x: number, y: number) => void;
  updateSanta: (x: number, y: number) => void;
  spawnGift: (x: number, y: number) => void;
  updateGifts: (gifts: Gift[]) => void;
  catchGift: (giftId: string) => void;
  increaseDifficulty: () => void;
  setScore: (score: number) => void;
}

export const useGrinchGame = create<GrinchGameState>((set, get) => ({
  gameState: "usernameInput",
  username: "",
  walletAddress: undefined,
  score: 0,
  gifts: [],
  grinchPosition: { x: 0, y: -4 },
  santaPosition: { x: 0, y: 4 },
  difficulty: 0,
  
  setUsername: (username: string) => {
    set({ username });
  },
  setWalletAddress: (wallet: string) => {
    set({ walletAddress: wallet });
  },
  
  startGame: () => {
    set({
      gameState: "playing",
      score: 0,
      gifts: [],
      grinchPosition: { x: 0, y: -4 },
      santaPosition: { x: 0, y: 4 },
      difficulty: 0
    });
  },
  
  endGame: () => {
    set({ gameState: "gameOver" });
  },
  
  restartGame: () => {
    const { startGame } = get();
    startGame();
  },
  
  changeUsername: () => {
    set({ gameState: "usernameInput", username: "" });
  },
  
  updateGrinch: (x: number, y: number) => {
    set(state => ({
      grinchPosition: { x, y }
    }));
  },
  
  updateSanta: (x: number, y: number) => {
    set(state => ({
      santaPosition: { x, y }
    }));
  },
  
  spawnGift: (x: number, y: number) => {
    const newGift: Gift = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y
    };
    
    set(state => ({
      gifts: [...state.gifts, newGift]
    }));
  },
  
  updateGifts: (gifts: Gift[]) => {
    set({ gifts });
  },
  
  catchGift: (giftId: string) => {
    set(state => ({
      gifts: state.gifts.filter(gift => gift.id !== giftId),
      score: state.score + 1
    }));
  },
  
  increaseDifficulty: () => {
    set(state => ({
      difficulty: state.difficulty + 1
    }));
  },
  
  setScore: (score: number) => {
    set({ score });
  }
}));
