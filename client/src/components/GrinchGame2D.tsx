import { useEffect, useRef, useCallback, useState } from "react";
import { useGrinchGame } from "../lib/stores/useGrinchGame";
import { useAudio } from "../lib/stores/useAudio";

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Gift extends GameObject {
  id: string;
  speed: number;
  type: 'normal' | 'bomb' | 'snowball'; // normal gifts give points, bomb gifts end the game, snowballs freeze the Grinch
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1, decreases over time
  maxLife: number;
  size: number;
  color: string;
  type: 'sparkle' | 'star' | 'confetti' | 'explosion' | 'ice' | 'snowflake';
  rotation?: number;
  rotationSpeed?: number;
}

export default function GrinchGame2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const lastSpinTierRef = useRef(0);
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotOutcome, setSlotOutcome] = useState<"idle" | "spinning" | "win" | "lose">("idle");
  const [slotReels, setSlotReels] = useState<string[]>(["🎁", "🎄", "⭐️"]);
  const slotOpenRef = useRef(false);
  useEffect(() => { slotOpenRef.current = slotOpen; }, [slotOpen]);
  const slotUsedRef = useRef(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef(false);
  useEffect(() => { countdownRef.current = countdown !== null; }, [countdown]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchRef = useRef<{ active: boolean; direction: -1 | 0 | 1 }>({ active: false, direction: 0 });
  
  // Game state stored in refs to avoid re-renders during game loop
  const grinchRef = useRef<GameObject>({ x: 375, y: 520, width: 50, height: 60 });
  const santaRef = useRef<GameObject>({ x: 100, y: 50, width: 80, height: 60 });
  const giftsRef = useRef<Gift[]>([]);
  const scoreRef = useRef(0);
  const difficultyRef = useRef(0);
  const gameTimeRef = useRef(0);
  const lastGiftSpawnRef = useRef(0);
  const nextGiftAtRef = useRef(0);
  
  // Santa motion controller for unpredictable movement
  const santaMotionRef = useRef({
    dir: 1, // 1 = right, -1 = left
    vx: 0, // current velocity
    targetVx: 100, // target velocity
    segmentT: 0, // current segment time
    segmentDur: 1.5, // current segment duration
    nextFlipCooldown: 0,
    facingLeft: false,
    flipT: 0
  });
  
  // Grinch walking animation controller
  const grinchAnimRef = useRef({
    prevX: 375,
    legPhase: 0
  });
  
  // Grinch freeze state controller
  const grinchFreezeRef = useRef({
    isFrozen: false,
    freezeEndTime: 0
  });
  
  // Particle system
  const particlesRef = useRef<Particle[]>([]);
  
  const {
    gameState,
    startGame,
    endGame,
    restartGame,
    setScore,
  } = useGrinchGame();
  
  const { playHit, playSuccess, playSantaLaugh, setBackgroundMusic, setHitSound, setSuccessSound, setSantaLaughSound, playBackgroundMusic, stopBackgroundMusic } = useAudio();

  // Initialize audio
  useEffect(() => {
    // Create audio elements
    const bgMusic = new Audio('/sounds/christmas-background.mp3');
    const hitSnd = new Audio('/sounds/hit.mp3');
    const successSnd = new Audio('/sounds/success.mp3');
    const santaLaugh = new Audio('/sounds/santa-laugh.mp3');
    
    // Set them in the store
    setBackgroundMusic(bgMusic);
    setHitSound(hitSnd);
    setSuccessSound(successSnd);
    setSantaLaughSound(santaLaugh);
    
    // Cleanup on unmount
    return () => {
      bgMusic.pause();
      hitSnd.pause();
      successSnd.pause();
      santaLaugh.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setSantaLaughSound]);

  // Initialize game
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Reset game state when restarting
  const resetGameState = useCallback(() => {
    grinchRef.current = { x: 375, y: 520, width: 50, height: 60 };
    santaRef.current = { x: 100, y: 50, width: 80, height: 60 };
    giftsRef.current = [];
    scoreRef.current = 0;
    difficultyRef.current = 0;
    gameTimeRef.current = 0;
    lastGiftSpawnRef.current = 0;
    nextGiftAtRef.current = 0;
    
    // Reset Santa motion controller
    santaMotionRef.current = {
      dir: 1,
      vx: 0,
      targetVx: 100,
      segmentT: 0,
      segmentDur: 1.5,
      nextFlipCooldown: 0,
      facingLeft: false,
      flipT: 0
    };
    
    // Reset Grinch animation controller
    grinchAnimRef.current = {
      prevX: 375,
      legPhase: 0
    };
    
    // Reset Grinch freeze state
    grinchFreezeRef.current = {
      isFrozen: false,
      freezeEndTime: 0
    };
    
    // Clear particles
    particlesRef.current = [];
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if ((e.code === 'Space' || e.code === 'KeyR') && gameState === 'gameOver') {
        resetGameState();
        restartGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, restartGame, resetGameState]);

  // Touch controls for mobile - hold left/right side of screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      
      // Determine direction based on which side of screen is touched
      // Use rect.width (screen size) instead of canvas.width (internal resolution)
      const screenMidpoint = rect.width / 2;
      if (touchX < screenMidpoint) {
        touchRef.current = { active: true, direction: -1 }; // Left side = move left
      } else {
        touchRef.current = { active: true, direction: 1 }; // Right side = move right
      }
      
      // Restart game on any touch if game is over
      if (gameState === 'gameOver') {
        resetGameState();
        restartGame();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchRef.current.active) return;
      
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      
      // Update direction based on current touch position
      // Use rect.width (screen size) instead of canvas.width (internal resolution)
      const screenMidpoint = rect.width / 2;
      if (touchX < screenMidpoint) {
        touchRef.current.direction = -1;
      } else {
        touchRef.current.direction = 1;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      touchRef.current = { active: false, direction: 0 };
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gameState, restartGame, resetGameState]);

  // Particle helper functions
  const createParticles = useCallback((x: number, y: number, type: 'gift' | 'bomb' | 'freeze' | 'snowball') => {
    // Soft cap to prevent performance issues - limit to 500 active particles
    if (particlesRef.current.length > 500) {
      return;
    }
    
    const newParticles: Particle[] = [];
    
    if (type === 'gift') {
      // Sparkly confetti explosion for caught gifts
      for (let i = 0; i < 20; i++) {
        const baseAngle = (Math.PI * 2 * i) / 20;
        const jitter = (Math.random() - 0.5) * 0.3; // Add random angle jitter
        const angle = baseAngle + jitter;
        const speed = 100 + Math.random() * 100;
        newParticles.push({
          id: `${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 50,
          life: 1,
          maxLife: 0.8 + Math.random() * 0.4,
          size: 3 + Math.random() * 4,
          color: ['#FFD700', '#FF69B4', '#00FF00', '#FF0000', '#FFFFFF'][Math.floor(Math.random() * 5)],
          type: i % 2 === 0 ? 'star' : 'confetti',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 10
        });
      }
    } else if (type === 'bomb') {
      // Explosive particles for bomb
      for (let i = 0; i < 30; i++) {
        const baseAngle = (Math.PI * 2 * i) / 30;
        const jitter = (Math.random() - 0.5) * 0.4; // Add random angle jitter
        const angle = baseAngle + jitter;
        const speed = 150 + Math.random() * 150;
        newParticles.push({
          id: `${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.3,
          size: 4 + Math.random() * 6,
          color: ['#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#222222'][Math.floor(Math.random() * 5)],
          type: 'explosion',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 15
        });
      }
    } else if (type === 'freeze') {
      // Ice crystal particles for freeze effect
      for (let i = 0; i < 15; i++) {
        const baseAngle = (Math.PI * 2 * i) / 15;
        const jitter = (Math.random() - 0.5) * 0.3; // Add random angle jitter
        const angle = baseAngle + jitter;
        const speed = 50 + Math.random() * 80;
        newParticles.push({
          id: `${Date.now()}-${i}`,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          life: 1,
          maxLife: 1.0 + Math.random() * 0.5,
          size: 3 + Math.random() * 3,
          color: ['#87CEEB', '#B0E0E6', '#E0FFFF', '#FFFFFF'][Math.floor(Math.random() * 4)],
          type: 'ice',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 8
        });
      }
    } else if (type === 'snowball') {
      // Snowflake trail for snowballs
      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: `${Date.now()}-${i}`,
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          life: 1,
          maxLife: 0.5 + Math.random() * 0.3,
          size: 2 + Math.random() * 2,
          color: '#FFFFFF',
          type: 'snowflake',
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 5
        });
      }
    }
    
    particlesRef.current.push(...newParticles);
  }, []);

  // Draw functions
  const drawGrinch = useCallback((ctx: CanvasRenderingContext2D, grinchObj: GameObject) => {
    ctx.save();
    
    const centerX = grinchObj.x + grinchObj.width / 2;
    const centerY = grinchObj.y + grinchObj.height / 2;
    const time = gameTimeRef.current;
    
    // Animation variables - Santa style but grumpier!
    const bounce = Math.sin(time * 2.5) * 3; // Jolly bouncing
    const bellyJiggle = Math.sin(time * 5) * 2; // Belly jiggling like Santa
    const eyeBlink = Math.sin(time * 0.4) > 0.9 ? 0.3 : 1; // Occasional blinking
    const hatBounce = Math.sin(time * 3.5) * 2; // Bouncy hat pompom
    const cheekGlow = Math.sin(time * 2) * 0.3 + 0.7; // Rosy cheeks
    
    // Santa-style jolly Grinch body - round and cheerful
    ctx.fillStyle = '#228B22'; // Keep Grinch green but make him jolly
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 5 + bounce, 20 + bellyJiggle, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Fluffy fur texture like Santa's suit
    ctx.fillStyle = '#40FF40';
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const fuzzX = centerX + Math.cos(angle) * (16 + bellyJiggle);
      const fuzzY = centerY + 5 + bounce + Math.sin(angle) * 24;
      ctx.beginPath();
      ctx.arc(fuzzX, fuzzY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa-style belt on the Grinch
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 18 - bellyJiggle, centerY + 15 + bounce, 36 + bellyJiggle * 2, 5);
    
    // Belt buckle with festive shine
    const buckleShine = Math.sin(time * 4) * 0.4 + 0.6;
    ctx.fillStyle = `hsl(45, 100%, ${40 + buckleShine * 30}%)`;
    ctx.fillRect(centerX - 3, centerY + 16 + bounce, 6, 3);
    
    // Santa-style jolly Grinch head - rounder and friendlier
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(centerX, grinchObj.y - 5 + bounce, 18, 0, Math.PI * 2);
    ctx.fill();
    
    // Fluffy head fur
    ctx.fillStyle = '#40FF40';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fuzzX = centerX + Math.cos(angle) * 15;
      const fuzzY = grinchObj.y - 5 + bounce + Math.sin(angle) * 15;
      ctx.beginPath();
      ctx.arc(fuzzX, fuzzY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa-style rosy cheeks
    ctx.fillStyle = '#FF69B4';
    ctx.globalAlpha = cheekGlow;
    ctx.beginPath();
    ctx.arc(centerX - 12, grinchObj.y - 2 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 12, grinchObj.y - 2 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Jolly Santa hat with animations
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    const hatSway = Math.sin(time * 1.2) * 2;
    ctx.moveTo(centerX - 15, grinchObj.y - 20 + bounce);
    ctx.quadraticCurveTo(centerX + hatSway, grinchObj.y - 38 + bounce, centerX + 18 + hatSway, grinchObj.y - 30 + bounce);
    ctx.quadraticCurveTo(centerX + 20 + hatSway, grinchObj.y - 25 + bounce, centerX + 15 + hatSway, grinchObj.y - 20 + bounce);
    ctx.lineTo(centerX - 15, grinchObj.y - 20 + bounce);
    ctx.fill();
    
    // Hat trim - fluffy like Santa's
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX, grinchObj.y - 20 + bounce, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bouncy hat pompom with fluff
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX + 15 + hatSway, grinchObj.y - 32 + bounce + hatBounce, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pompom fluff animation
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fluffBounce = Math.sin(time * 4 + i) * 0.8;
      const fluffX = centerX + 15 + hatSway + Math.cos(angle) * (4 + fluffBounce);
      const fluffY = grinchObj.y - 32 + bounce + hatBounce + Math.sin(angle) * (4 + fluffBounce);
      ctx.beginPath();
      ctx.arc(fluffX, fluffY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Large, jolly eyes like Santa's
    const eyeY = grinchObj.y - 10 + bounce;
    
    // Bright, cheerful eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX - 7, eyeY, 6, 7 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 7, eyeY, 6, 7 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Friendly pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 7, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 7, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye twinkle like Santa's
    const twinkle = Math.sin(time * 6) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(centerX - 6, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 8, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Grumpy eyebrows - angled down
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, grinchObj.y - 18 + bounce);
    ctx.lineTo(centerX - 4, grinchObj.y - 15 + bounce);
    ctx.moveTo(centerX + 4, grinchObj.y - 15 + bounce);
    ctx.lineTo(centerX + 12, grinchObj.y - 18 + bounce);
    ctx.stroke();
    
    // Grumpy frown instead of big smile
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, grinchObj.y + 4 + bounce, 6, 0.8, Math.PI - 0.8);
    ctx.stroke();
    
    // Small frown lines at corners
    ctx.beginPath();
    ctx.moveTo(centerX - 6, grinchObj.y + 4 + bounce);
    ctx.lineTo(centerX - 8, grinchObj.y + 2 + bounce);
    ctx.moveTo(centerX + 6, grinchObj.y + 4 + bounce);
    ctx.lineTo(centerX + 8, grinchObj.y + 2 + bounce);
    ctx.stroke();
    
    // Static arms - no annoying animations
    ctx.fillStyle = '#228B22';
    
    // Left arm - simple and still
    ctx.beginPath();
    ctx.ellipse(grinchObj.x + 5, centerY - 5 + bounce, 8, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Right arm - simple and still
    ctx.beginPath();
    ctx.ellipse(grinchObj.x + grinchObj.width - 5, centerY - 5 + bounce, 8, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bigger, friendlier hands
    ctx.fillStyle = '#40FF40';
    ctx.beginPath();
    ctx.arc(grinchObj.x + 5, centerY + 10 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grinchObj.x + grinchObj.width - 5, centerY + 10 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cheerful mittens like Santa's helpers
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.arc(grinchObj.x + 5, centerY + 10 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grinchObj.x + grinchObj.width - 5, centerY + 10 + bounce, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Mitten cuffs
    ctx.fillStyle = 'white';
    ctx.fillRect(grinchObj.x + 2, centerY + 6 + bounce, 6, 3);
    ctx.fillRect(grinchObj.x + grinchObj.width - 8, centerY + 6 + bounce, 6, 3);
    
    // Walking legs - drawn behind body
    const legPhase = grinchAnimRef.current.legPhase;
    const legY = grinchObj.y + grinchObj.height - 8 + bounce;
    
    // Left leg with walking animation
    const leftLegOffset = Math.sin(legPhase) * 3;
    ctx.fillStyle = '#228B22'; // Green leg
    ctx.beginPath();
    ctx.ellipse(centerX - 8, legY + leftLegOffset, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Left boot
    ctx.fillStyle = '#000000'; // Black boot
    ctx.beginPath();
    ctx.ellipse(centerX - 8, legY + 8 + leftLegOffset, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Left boot cuff
    ctx.fillStyle = 'white';
    ctx.fillRect(centerX - 11, legY + 4 + leftLegOffset, 6, 3);
    
    // Right leg with opposite walking animation
    const rightLegOffset = Math.sin(legPhase + Math.PI) * 3;
    ctx.fillStyle = '#228B22'; // Green leg
    ctx.beginPath();
    ctx.ellipse(centerX + 8, legY + rightLegOffset, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Right boot
    ctx.fillStyle = '#000000'; // Black boot
    ctx.beginPath();
    ctx.ellipse(centerX + 8, legY + 8 + rightLegOffset, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Right boot cuff
    ctx.fillStyle = 'white';
    ctx.fillRect(centerX + 5, legY + 4 + rightLegOffset, 6, 3);
    
    // Ice effect when frozen
    if (grinchFreezeRef.current.isFrozen) {
      ctx.fillStyle = 'rgba(173, 216, 230, 0.7)'; // Light blue ice
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.9)'; // Bright blue edge
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + bounce, 35, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Ice crystals effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const iceX = centerX + Math.cos(angle) * 28;
        const iceY = centerY + bounce + Math.sin(angle) * 35;
        ctx.beginPath();
        ctx.arc(iceX, iceY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // "FROZEN!" text
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'blue';
      ctx.font = 'bold 16px Arial';
      ctx.lineWidth = 2;
      ctx.strokeText('FROZEN!', centerX - 35, grinchObj.y - 50);
      ctx.fillText('FROZEN!', centerX - 35, grinchObj.y - 50);
    }
    
    ctx.restore();
  }, []);

  const drawSanta = useCallback((ctx: CanvasRenderingContext2D, santaObj: GameObject, facingLeft: boolean = false) => {
    ctx.save();
    
    // Apply mirroring transform if facing left
    if (facingLeft) {
      const flipCenterX = santaObj.x + santaObj.width / 2;
      ctx.translate(flipCenterX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-flipCenterX, 0);
    }
    
    const centerX = santaObj.x + 30;
    const time = gameTimeRef.current;
    
    // Animation variables
    const sleighRock = Math.sin(time * 1.2) * 3; // Slower rocking
    const bellyJiggle = Math.sin(time * 4) * 1.5;
    const beardSway = Math.sin(time * 0.8) * 2;
    const pompomBounce = Math.sin(time * 2.5) * 2;
    const rudolphBlink = Math.sin(time * 3) > 0.7 ? 1 : 0.3; // Nose brightness
    const sparkleTime = time * 6;
    
    // Sleigh (proper Christmas sleigh design) with rocking animation
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    // Main sleigh body - curved like a boat
    ctx.moveTo(santaObj.x - 10, santaObj.y + 25 + sleighRock);
    ctx.quadraticCurveTo(santaObj.x + 30, santaObj.y + 15 + sleighRock, santaObj.x + 70, santaObj.y + 25 + sleighRock);
    ctx.lineTo(santaObj.x + 70, santaObj.y + 45 + sleighRock);
    ctx.quadraticCurveTo(santaObj.x + 30, santaObj.y + 50 + sleighRock, santaObj.x - 10, santaObj.y + 45 + sleighRock);
    ctx.closePath();
    ctx.fill();
    
    // Sleigh front curl (decorative)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(santaObj.x - 8, santaObj.y + 20 + sleighRock, 8, 0, Math.PI);
    ctx.stroke();
    
    // Sleigh runners (more prominent)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(santaObj.x - 15, santaObj.y + 48 + sleighRock, 90, 4);
    // Runner curves
    ctx.beginPath();
    ctx.arc(santaObj.x - 15, santaObj.y + 50 + sleighRock, 4, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(santaObj.x + 75, santaObj.y + 50 + sleighRock, 4, Math.PI, 0);
    ctx.fill();
    
    // Sleigh decorations with sparkling effect
    for (let i = 0; i < 3; i++) {
      const sparkle = Math.sin(sparkleTime + i) * 0.5 + 0.5;
      ctx.fillStyle = `hsl(45, 100%, ${50 + sparkle * 30}%)`;
      ctx.beginPath();
      ctx.arc(santaObj.x + i * 25 + 10, santaObj.y + 40 + sleighRock, 3 + sparkle, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa's body (jolly and round) with jiggling belly
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.ellipse(centerX, santaObj.y + 15 + sleighRock, 18 + bellyJiggle, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's belt
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 18 - bellyJiggle, santaObj.y + 20 + sleighRock, 36 + bellyJiggle * 2, 6);
    
    // Belt buckle with shine effect
    const buckleShine = Math.sin(sparkleTime * 0.7) * 0.3 + 0.7;
    ctx.fillStyle = `hsl(45, 100%, ${30 + buckleShine * 40}%)`;
    ctx.fillRect(centerX - 4, santaObj.y + 21 + sleighRock, 8, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 2, santaObj.y + 22 + sleighRock, 4, 2);
    
    // Santa's head (round and cheerful)
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(centerX, santaObj.y - 8 + sleighRock, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's beard (fluffy and white) with swaying motion
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX + beardSway, santaObj.y + 5 + sleighRock, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Beard texture with individual whisker movement
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const whiskerSway = Math.sin(time * 2 + i) * 1;
      const beardX = centerX + beardSway + Math.cos(angle) * 10 + whiskerSway;
      const beardY = santaObj.y + 5 + sleighRock + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(beardX, beardY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa's mustache with slight movement
    ctx.beginPath();
    ctx.ellipse(centerX + beardSway * 0.5, santaObj.y - 3 + sleighRock, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's hat (more detailed) with gentle sway
    const hatSway = Math.sin(time * 0.6) * 1.5;
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, santaObj.y - 20 + sleighRock);
    ctx.quadraticCurveTo(centerX + hatSway, santaObj.y - 35 + sleighRock, centerX + 18 + hatSway, santaObj.y - 25 + sleighRock);
    ctx.quadraticCurveTo(centerX + 20 + hatSway, santaObj.y - 20 + sleighRock, centerX + 15 + hatSway, santaObj.y - 15 + sleighRock);
    ctx.lineTo(centerX - 12, santaObj.y - 15 + sleighRock);
    ctx.fill();
    
    // Hat trim
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX + 2 + hatSway * 0.5, santaObj.y - 15 + sleighRock, 15, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hat pompom with bouncing motion
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX + 15 + hatSway, santaObj.y - 22 + sleighRock + pompomBounce, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Pompom fluff animation
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fluffBounce = Math.sin(time * 3 + i) * 0.5;
      const fluffX = centerX + 15 + hatSway + Math.cos(angle) * (3 + fluffBounce);
      const fluffY = santaObj.y - 22 + sleighRock + pompomBounce + Math.sin(angle) * (3 + fluffBounce);
      ctx.beginPath();
      ctx.arc(fluffX, fluffY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa's eyes (jolly) with blinking
    const eyeBlink = Math.sin(time * 0.3) > 0.95 ? 0.3 : 1; // Occasional blink
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(centerX - 5, santaObj.y - 12 + sleighRock, 2, 2 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 5, santaObj.y - 12 + sleighRock, 2, 2 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye twinkle with sparkle effect
    const twinkle = Math.sin(sparkleTime * 0.3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(centerX - 4, santaObj.y - 13 + sleighRock, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, santaObj.y - 13 + sleighRock, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's rosy cheeks with gentle glow
    const cheekGlow = Math.sin(time * 1.5) * 0.2 + 0.5;
    ctx.fillStyle = '#FF69B4';
    ctx.globalAlpha = cheekGlow;
    ctx.beginPath();
    ctx.arc(centerX - 10, santaObj.y - 5 + sleighRock, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 10, santaObj.y - 5 + sleighRock, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Team of Reindeer with flying animation
    const baseReindeerY = santaObj.y + 15 + sleighRock;
    const reindeerNames = ['Dasher', 'Dancer', 'Prancer', 'Rudolph'];
    
    // Draw reindeer team
    for (let r = 0; r < 4; r++) {
      const reindeerX = santaObj.x + 80 + r * 70;
      const individualBounce = Math.sin(time * 2.8 + r * 0.5) * 2;
      const individualBob = Math.sin(time * 3.2 + r * 0.3) * 1.5;
      const reindeerY = baseReindeerY + individualBounce;
      const isRudolph = r === 3; // Last reindeer is Rudolph
      
      // Harness lines connecting to sleigh
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(santaObj.x + 60, santaObj.y + 30 + sleighRock);
      ctx.lineTo(reindeerX, reindeerY);
      ctx.stroke();
      
      // Reindeer body with flying motion
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.ellipse(reindeerX, reindeerY, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Reindeer head with head bobbing
      ctx.beginPath();
      ctx.ellipse(reindeerX + 18, reindeerY - 3 + individualBob, 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Reindeer snout
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.ellipse(reindeerX + 24, reindeerY - 1 + individualBob, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Nose (red for Rudolph, black for others)
      if (isRudolph) {
        // Rudolph's red nose with glowing/blinking effect
        ctx.fillStyle = '#FF0000';
        ctx.globalAlpha = rudolphBlink;
        ctx.beginPath();
        ctx.arc(reindeerX + 27, reindeerY - 1 + individualBob, 2 + (rudolphBlink - 0.3) * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose glow effect
        if (rudolphBlink > 0.8) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#FF6666';
          ctx.beginPath();
          ctx.arc(reindeerX + 27, reindeerY - 1 + individualBob, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(reindeerX + 27, reindeerY - 1 + individualBob, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Reindeer eyes with individual blinking
      const reindeerBlink = Math.sin(time * 0.4 + r * 0.2) > 0.92 ? 0.2 : 1;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(reindeerX + 16, reindeerY - 5 + individualBob, 1.5, 1.5 * reindeerBlink, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(reindeerX + 20, reindeerY - 5 + individualBob, 1.5, 1.5 * reindeerBlink, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Antlers with individual sway
      const antlerSway = Math.sin(time * 1.8 + r * 0.4) * 0.8;
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Left antler
      ctx.moveTo(reindeerX + 15, reindeerY - 10 + individualBob);
      ctx.lineTo(reindeerX + 14 + antlerSway, reindeerY - 16 + individualBob);
      ctx.moveTo(reindeerX + 14.5, reindeerY - 13 + individualBob);
      ctx.lineTo(reindeerX + 12 + antlerSway, reindeerY - 14 + individualBob);
      
      // Right antler
      ctx.moveTo(reindeerX + 21, reindeerY - 10 + individualBob);
      ctx.lineTo(reindeerX + 22 + antlerSway, reindeerY - 16 + individualBob);
      ctx.moveTo(reindeerX + 21.5, reindeerY - 13 + individualBob);
      ctx.lineTo(reindeerX + 24 + antlerSway, reindeerY - 14 + individualBob);
      ctx.stroke();
      
      // Reindeer legs with individual galloping
      ctx.fillStyle = '#8B4513';
      for (let i = 0; i < 4; i++) {
        const legX = reindeerX - 6 + i * 4;
        const legFlap = Math.sin(time * 4 + r * 0.5 + i * Math.PI/2) * 2;
        ctx.beginPath();
        ctx.ellipse(legX, reindeerY + 8 + legFlap, 1.5, 6, legFlap * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Hooves
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(legX, reindeerY + 14 + legFlap, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
      }
    }
    
    // Add magical sparkles around the sleigh
    for (let i = 0; i < 8; i++) {
      const sparkleX = santaObj.x + (i % 4) * 30 + Math.sin(sparkleTime + i) * 10;
      const sparkleY = santaObj.y + sleighRock + Math.cos(sparkleTime + i) * 15;
      const sparkleAlpha = Math.sin(sparkleTime * 0.7 + i) * 0.5 + 0.5;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Star sparkles
      ctx.strokeStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sparkleX - 2, sparkleY);
      ctx.lineTo(sparkleX + 2, sparkleY);
      ctx.moveTo(sparkleX, sparkleY - 2);
      ctx.lineTo(sparkleX, sparkleY + 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      ctx.save();
      
      const alpha = particle.life;
      ctx.globalAlpha = alpha;
      
      if (particle.type === 'star') {
        // Draw a star shape
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * particle.size;
          const y = Math.sin(angle) * particle.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          const innerAngle = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(innerAngle) * particle.size * 0.4, Math.sin(innerAngle) * particle.size * 0.4);
        }
        ctx.closePath();
        ctx.fill();
      } else if (particle.type === 'confetti') {
        // Draw a rectangle for confetti
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size, particle.size, particle.size * 2);
      } else if (particle.type === 'explosion') {
        // Draw an explosion particle (circle with glow)
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 2);
        gradient.addColorStop(0, `${particle.color}88`);
        gradient.addColorStop(1, `${particle.color}00`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'ice') {
        // Draw ice crystal
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Draw a snowflake pattern
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * particle.size, Math.sin(angle) * particle.size);
        }
        ctx.stroke();
      } else if (particle.type === 'snowflake') {
        // Draw small snowflake
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation || 0);
        ctx.fillStyle = particle.color;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Add arms
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * particle.size, Math.sin(angle) * particle.size);
          ctx.stroke();
        }
      } else {
        // Default: sparkle (circle)
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }, []);

  const drawGift = useCallback((ctx: CanvasRenderingContext2D, gift: Gift) => {
    ctx.save();
    
    if (gift.type === 'normal') {
      // Normal gift - classic Christmas colors
      ctx.fillStyle = '#c41e3a';
      ctx.fillRect(gift.x, gift.y, gift.width, gift.height);
      
      // Ribbon
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(gift.x, gift.y + gift.height/2 - 2, gift.width, 4);
      ctx.fillRect(gift.x + gift.width/2 - 2, gift.y, 4, gift.height);
      
      // Bow
      ctx.beginPath();
      ctx.arc(gift.x + gift.width/2, gift.y - 5, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (gift.type === 'bomb') {
      // Bomb gift - dark and dangerous looking
      ctx.fillStyle = '#2C2C2C'; // Dark gray box
      ctx.fillRect(gift.x, gift.y, gift.width, gift.height);
      
      // Red warning ribbon
      ctx.fillStyle = '#FF4444';
      ctx.fillRect(gift.x, gift.y + gift.height/2 - 2, gift.width, 4);
      ctx.fillRect(gift.x + gift.width/2 - 2, gift.y, 4, gift.height);
      
      // Skull symbol or warning sign
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💣', gift.x + gift.width/2, gift.y + gift.height/2 + 4);
      
      // Blinking red warning effect
      const blinkIntensity = Math.sin(gameTimeRef.current * 8) > 0 ? 0.3 : 0;
      ctx.fillStyle = `rgba(255, 0, 0, ${blinkIntensity})`;
      ctx.fillRect(gift.x - 2, gift.y - 2, gift.width + 4, gift.height + 4);
    } else if (gift.type === 'snowball') {
      // Snowball - white circle with sparkles and cold blue aura
      ctx.fillStyle = 'white';
      ctx.strokeStyle = '#87CEEB'; // Sky blue border
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gift.x + gift.width/2, gift.y + gift.height/2, gift.width/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Blue cold aura effect
      const auraIntensity = Math.sin(gameTimeRef.current * 4) * 0.3 + 0.4;
      ctx.fillStyle = `rgba(135, 206, 235, ${auraIntensity})`;
      ctx.beginPath();
      ctx.arc(gift.x + gift.width/2, gift.y + gift.height/2, gift.width/2 + 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Redraw the snowball on top of the aura
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(gift.x + gift.width/2, gift.y + gift.height/2, gift.width/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Snowflake emoji
      ctx.fillStyle = '#00BFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('❄️', gift.x + gift.width/2, gift.y + gift.height/2 + 3);
    }
    
    ctx.restore();
  }, []);

  // Collision detection
  const checkCollision = useCallback((obj1: GameObject, obj2: GameObject): boolean => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    const gameLoop = (currentTime: number) => {
      if (gameState !== 'playing') return;
      // Pause updates during slot or countdown
      if (slotOpenRef.current || countdownRef.current) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30); // Cap deltaTime
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw winter wonderland gradient sky
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a2a4a'); // Deep blue at top
      gradient.addColorStop(0.5, '#2d4a70'); // Medium blue
      gradient.addColorStop(1, '#4a6b99'); // Lighter blue near horizon
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw distant snowy mountains
      ctx.fillStyle = '#6b8bb5';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 200);
      ctx.quadraticCurveTo(200, canvas.height - 280, 400, canvas.height - 200);
      ctx.quadraticCurveTo(600, canvas.height - 320, 800, canvas.height - 200);
      ctx.lineTo(canvas.width, canvas.height - 200);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();
      
      // Draw snow caps on mountains
      ctx.fillStyle = '#e8f4f8';
      ctx.beginPath();
      ctx.moveTo(180, canvas.height - 265);
      ctx.quadraticCurveTo(200, canvas.height - 280, 220, canvas.height - 265);
      ctx.lineTo(180, canvas.height - 265);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(580, canvas.height - 305);
      ctx.quadraticCurveTo(600, canvas.height - 320, 620, canvas.height - 305);
      ctx.lineTo(580, canvas.height - 305);
      ctx.fill();
      
      // Draw subtle falling snow animation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 80; i++) {
        const baseX = (i * 13) % canvas.width;
        const drift = Math.sin(gameTimeRef.current * 0.5 + i) * 15; // Gentle horizontal drift
        const x = baseX + drift;
        const y = ((i * 19 + gameTimeRef.current * 40) % (canvas.height + 100)) - 50;
        const size = 1 + (i % 3) * 0.5; // Varied snowflake sizes
        
        // Draw delicate snowflake
        ctx.globalAlpha = 0.6 + (i % 3) * 0.15; // Varied opacity
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle to some snowflakes
        if (i % 5 === 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 0.5;
          const sparkleSize = size * 2;
          ctx.beginPath();
          ctx.moveTo(x - sparkleSize, y);
          ctx.lineTo(x + sparkleSize, y);
          ctx.moveTo(x, y - sparkleSize);
          ctx.lineTo(x, y + sparkleSize);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1; // Reset alpha
      
      // Draw snowy ground
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
      
      // Add snow texture to ground
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let i = 0; i < 30; i++) {
        const x = (i * 29) % canvas.width;
        const y = canvas.height - 45 + (i % 5) * 3;
        ctx.beginPath();
        ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      // Check if Grinch freeze has expired
      if (grinchFreezeRef.current.isFrozen && Date.now() >= grinchFreezeRef.current.freezeEndTime) {
        grinchFreezeRef.current.isFrozen = false;
      }

      // Update Grinch position (only if not frozen)
      let newGrinchX = grinchRef.current.x;
      
      if (!grinchFreezeRef.current.isFrozen) {
        const speed = 300; // pixels per second
        
        // Touch controls take priority
        if (touchRef.current.active && touchRef.current.direction !== 0) {
          newGrinchX += touchRef.current.direction * speed * deltaTime;
        } else {
          // Keyboard controls when not touching
          if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
            newGrinchX -= speed * deltaTime;
          }
          if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
            newGrinchX += speed * deltaTime;
          }
        }
        
        // Keep Grinch on screen
        newGrinchX = Math.max(0, Math.min(canvas.width - grinchRef.current.width, newGrinchX));
        grinchRef.current.x = newGrinchX;
      }
      
      // Update Grinch walking animation
      const grinchAnim = grinchAnimRef.current;
      const grinchVelocity = Math.abs(newGrinchX - grinchAnim.prevX);
      const isMoving = grinchVelocity > 0.5; // Only animate if moving more than 0.5px per frame
      
      if (isMoving) {
        // Update leg phase based on movement speed
        grinchAnim.legPhase += grinchVelocity * 0.1;
        if (grinchAnim.legPhase > Math.PI * 2) {
          grinchAnim.legPhase -= Math.PI * 2;
        }
      } else {
        // Reset to standing position when not moving
        grinchAnim.legPhase = 0;
      }
      
      grinchAnim.prevX = newGrinchX;

      // Update Santa motion controller for unpredictable movement
      const motion = santaMotionRef.current;
      const canvasWidth = canvas.width;
      const convoyLeftExtent = motion.facingLeft ? 290 : 15; // Account for full convoy width
      const convoyRightExtent = motion.facingLeft ? 15 : 290;
      
      // Update segment timer
      motion.segmentT += deltaTime;
      motion.nextFlipCooldown = Math.max(0, motion.nextFlipCooldown - deltaTime);
      
      // Ease velocity towards target
      const velocityEase = 5; // How fast velocity changes
      const velocityDiff = motion.targetVx - motion.vx;
      motion.vx += velocityDiff * velocityEase * deltaTime;
      
      // Check if we need to flip direction
      const nearLeftEdge = santaRef.current.x <= convoyLeftExtent + 20;
      const nearRightEdge = santaRef.current.x >= canvasWidth - convoyRightExtent - 20;
      const segmentExpired = motion.segmentT >= motion.segmentDur;
      const canFlip = motion.nextFlipCooldown <= 0;
      
      if ((nearLeftEdge || nearRightEdge || segmentExpired) && canFlip) {
        // Flip direction
        motion.dir *= -1;
        motion.facingLeft = !motion.facingLeft;
        
        // Start new segment with random parameters based on difficulty
        const minDur = Math.max(0.5, 1.5 - difficultyRef.current * 0.1);
        const maxDur = Math.max(0.8, 2.0 - difficultyRef.current * 0.15);
        motion.segmentDur = minDur + Math.random() * (maxDur - minDur);
        
        const minSpeed = 50 + difficultyRef.current * 20;
        const maxSpeed = 150 + difficultyRef.current * 30;
        motion.targetVx = minSpeed + Math.random() * (maxSpeed - minSpeed);
        
        motion.segmentT = 0;
        motion.nextFlipCooldown = 0.5; // Minimum time between flips
        
        console.log(`Santa flipped! Dir: ${motion.dir}, Speed: ${motion.targetVx.toFixed(1)}, Duration: ${motion.segmentDur.toFixed(1)}`);
      }
      
      // Apply movement with small jitter
      const jitter = Math.sin(gameTimeRef.current * 5 + motion.segmentT * 3) * 8;
      const newSantaX = santaRef.current.x + motion.dir * motion.vx * deltaTime + jitter * deltaTime;
      
      // Clamp to screen bounds considering convoy width
      santaRef.current.x = Math.max(convoyLeftExtent, Math.min(canvasWidth - convoyRightExtent, newSantaX));

      // Spawn gifts with unpredictable timing
      if (nextGiftAtRef.current === 0) {
        // Initialize first spawn time
        const baseSpawnRate = Math.max(0.8, 2.5 - difficultyRef.current * 0.3);
        nextGiftAtRef.current = gameTimeRef.current + baseSpawnRate * (0.6 + Math.random() * 0.8);
      }
      
      if (gameTimeRef.current >= nextGiftAtRef.current) {
        const baseSpawnRate = Math.max(0.8, 2.5 - difficultyRef.current * 0.3);
        const giftOffsetRange = Math.min(60 + difficultyRef.current * 10, 100); // Widen with difficulty but cap
        
        // Randomize gift types with difficulty scaling - reduced snowball spawn rate
        const bombChance = Math.min(0.12 + difficultyRef.current * 0.03, 0.25);
        const snowballChance = Math.min(0.05 + difficultyRef.current * 0.01, 0.1); // Much less frequent
        const random = Math.random();
        
        let giftType: 'normal' | 'bomb' | 'snowball';
        if (random < bombChance) {
          giftType = 'bomb';
        } else if (random < bombChance + snowballChance) {
          giftType = 'snowball';
        } else {
          giftType = 'normal';
        }
        
        giftsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: santaRef.current.x + 30 + (Math.random() - 0.5) * giftOffsetRange,
          y: santaRef.current.y + 50,
          width: 25,
          height: 25,
          speed: 150 + difficultyRef.current * 50,
          type: giftType
        });
        
        // Santa laughs when dropping bombs (70% chance)
        if (giftType === 'bomb' && Math.random() < 0.7) {
          playSantaLaugh();
        }
        
        // Schedule next gift with random timing
        nextGiftAtRef.current = gameTimeRef.current + baseSpawnRate * (0.6 + Math.random() * 0.8);
        lastGiftSpawnRef.current = gameTimeRef.current;
      }

      // Update gifts with special homing behavior for snowballs
      giftsRef.current = giftsRef.current.map(gift => {
        if (gift.type === 'snowball') {
          // Create snowflake trail particles
          createParticles(gift.x + gift.width / 2, gift.y + gift.height / 2, 'snowball');
          
          // Homing snowball - tracks toward Grinch
          const grinchCenterX = grinchRef.current.x + grinchRef.current.width / 2;
          const grinchCenterY = grinchRef.current.y + grinchRef.current.height / 2;
          const snowballCenterX = gift.x + gift.width / 2;
          const snowballCenterY = gift.y + gift.height / 2;
          
          // Calculate direction to Grinch
          const deltaX = grinchCenterX - snowballCenterX;
          const deltaY = grinchCenterY - snowballCenterY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Normalize direction and apply homing speed - much weaker homing
          const homingSpeed = gift.speed * 0.3; // Much slower homing
          const fallSpeed = gift.speed * 0.7; // Still falls down primarily
          const normalizedX = distance > 0 ? deltaX / distance : 0;
          const normalizedY = distance > 0 ? deltaY / distance : 0;
          
          return {
            ...gift,
            x: gift.x + normalizedX * homingSpeed * deltaTime,
            y: gift.y + fallSpeed * deltaTime + normalizedY * homingSpeed * deltaTime * 0.5
          };
        } else {
          // Normal gifts and bombs fall straight down
          return {
            ...gift,
            y: gift.y + gift.speed * deltaTime
          };
        }
      }).filter(gift => gift.y < canvas.height + 50 && gift.x > -50 && gift.x < canvas.width + 50);

      // Check collisions and remove caught gifts
      const newGifts: Gift[] = [];
      for (const gift of giftsRef.current) {
        if (checkCollision(grinchRef.current, gift)) {
          if (gift.type === 'normal') {
            // Normal gift - increase score
            scoreRef.current += 1;
            setScore(scoreRef.current); // Update global store immediately
            playSuccess();
            // Create sparkly particles for caught gift
            createParticles(gift.x + gift.width / 2, gift.y + gift.height / 2, 'gift');
          } else if (gift.type === 'bomb') {
            // Bomb gift - end the game!
            playHit();
            // Create explosion particles
            createParticles(gift.x + gift.width / 2, gift.y + gift.height / 2, 'bomb');
            setScore(scoreRef.current); // Save score to global store
            endGame();
            return; // Stop the game loop immediately
          } else if (gift.type === 'snowball') {
            // Snowball - freeze the Grinch for 1 second (reduced from 2)
            grinchFreezeRef.current.isFrozen = true;
            grinchFreezeRef.current.freezeEndTime = Date.now() + 1000; // 1 second from now
            playHit(); // Use hit sound for snowball impact
            // Create freeze particles
            createParticles(gift.x + gift.width / 2, gift.y + gift.height / 2, 'freeze');
          }
        } else {
          newGifts.push(gift);
        }
      }
      giftsRef.current = newGifts;

      // Check for game over (only normal gifts hitting ground ends game)
      const groundThreshold = canvas.height - 60;
      const normalGiftHitGround = giftsRef.current.some(gift => 
        gift.type === 'normal' && gift.y > groundThreshold
      );
      if (normalGiftHitGround) {
        setScore(scoreRef.current); // Save score to global store
        endGame();
        playHit();
        return;
      }

      // Increase difficulty
      const newDifficulty = Math.floor(gameTimeRef.current / 10);
      if (newDifficulty > difficultyRef.current) {
        difficultyRef.current = newDifficulty;
      }

      // Slot trigger every 20 points
      const currentTier = Math.floor(scoreRef.current / 20);
      if (!slotOpenRef.current && currentTier > 0 && currentTier > lastSpinTierRef.current) {
        lastSpinTierRef.current = currentTier;
        setSlotOutcome("idle");
        setSlotOpen(true);
        slotUsedRef.current = false;
      }

      // Update game time
      gameTimeRef.current += deltaTime;

      // Update particles
      particlesRef.current = particlesRef.current.map(particle => {
        // Update particle position
        const newX = particle.x + particle.vx * deltaTime;
        const newY = particle.y + particle.vy * deltaTime;
        
        // Apply gravity to particles (except ice which floats up)
        const gravity = particle.type === 'ice' ? -100 : 200;
        const newVy = particle.vy + gravity * deltaTime;
        
        // Update rotation
        const newRotation = (particle.rotation || 0) + (particle.rotationSpeed || 0) * deltaTime;
        
        // Decrease life
        const newLife = particle.life - (deltaTime / particle.maxLife);
        
        return {
          ...particle,
          x: newX,
          y: newY,
          vy: newVy,
          rotation: newRotation,
          life: Math.max(0, newLife)
        };
      }).filter(particle => particle.life > 0); // Remove dead particles

      // Draw game objects
      drawGrinch(ctx, grinchRef.current);
      drawSanta(ctx, santaRef.current, santaMotionRef.current.facingLeft);
      giftsRef.current.forEach(gift => drawGift(ctx, gift));
      
      // Draw particles on top of gifts
      drawParticles(ctx);
      
      // Draw freeze effect overlay on Grinch
      if (grinchFreezeRef.current.isFrozen) {
        const grinchCenterX = grinchRef.current.x + grinchRef.current.width / 2;
        const grinchCenterY = grinchRef.current.y + grinchRef.current.height / 2;
        
        // Ice overlay
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#87CEEB';
        ctx.beginPath();
        ctx.ellipse(grinchCenterX, grinchCenterY, grinchRef.current.width / 2 + 5, grinchRef.current.height / 2 + 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Ice crystal overlays
        const frozenTime = (Date.now() % 500) / 500;
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6 + frozenTime * Math.PI * 2;
          const x = grinchCenterX + Math.cos(angle) * 30;
          const y = grinchCenterY + Math.sin(angle) * 30;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.strokeStyle = '#B0E0E6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(0, 5);
          ctx.moveTo(-5, 0);
          ctx.lineTo(5, 0);
          ctx.stroke();
          ctx.restore();
        }
      }
      
      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      const scoreText = `Score: ${scoreRef.current}`;
      ctx.strokeText(scoreText, 20, 40);
      ctx.fillText(scoreText, 20, 40);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, endGame, playHit, playSuccess, drawGrinch, drawSanta, drawGift, checkCollision]);

  // Reset when game starts
  useEffect(() => {
    if (gameState === 'playing') {
      resetGameState();
    }
  }, [gameState, resetGameState]);

  // Control background music based on game state
  useEffect(() => {
    if (gameState === 'playing') {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [gameState, playBackgroundMusic, stopBackgroundMusic]);

  const slotSymbols = ["🎁", "🎄", "⭐️", "🔔", "🍬", "⛄️"];
  const startSlotSpin = useCallback(() => {
    if (slotOutcome === "spinning" || slotUsedRef.current) return;
    slotUsedRef.current = true;
    setSlotOutcome("spinning");
    const start = Date.now();
    const spinDurationMs = 1600;
    const timer = setInterval(() => {
      const newReels = [0, 1, 2].map(() => slotSymbols[Math.floor(Math.random() * slotSymbols.length)]);
      setSlotReels(newReels);
      if (Date.now() - start > spinDurationMs) {
        clearInterval(timer);
        const isWin = Math.random() < 0.02; // 2% win
        if (isWin) {
          const sym = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          setSlotReels([sym, sym, sym]);
          setSlotOutcome("win");
          scoreRef.current = scoreRef.current * 2;
        } else {
          const a = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          let b = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          let c = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
          if (b === a) b = slotSymbols[(slotSymbols.indexOf(b) + 1) % slotSymbols.length];
          if (c === a) c = slotSymbols[(slotSymbols.indexOf(c) + 2) % slotSymbols.length];
          setSlotReels([a, b, c]);
          setSlotOutcome("lose");
        }
        // Close after short delay and start countdown
        setTimeout(() => {
          setSlotOpen(false);
          setCountdown(3);
          const intId = setInterval(() => {
            setCountdown(prev => {
              if (prev === null) return null;
              if (prev <= 1) {
                clearInterval(intId);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }, 800);
      }
    }, 80);
  }, [slotOutcome]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '800px',
      margin: '0 auto',
      aspectRatio: '4/3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '2px solid #333',
          backgroundColor: '#001122',
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: 'pointer'
        }}
      />

      {slotOpen && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10
          }}
        >
          <div style={{ width: '90%', maxWidth: 520, padding: '15px', borderRadius: 12, background: '#122', border: '2px solid #c41e3a', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 700, marginBottom: 12 }}>🎰 Slot Machine — Try to Double Your Points (Hard Mode)</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '12px 0', flexWrap: 'wrap' }}>
              {slotReels.map((s, i) => (
                <div key={i} style={{ width: 'clamp(80px, 20vw, 120px)', height: 'clamp(80px, 20vw, 120px)', borderRadius: 10, background: '#234', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(40px, 10vw, 64px)' }}>{s}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={startSlotSpin}
                disabled={slotOutcome === 'spinning' || slotUsedRef.current}
                style={{ padding: '10px 18px', background: '#c9a227', color: '#112', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >{slotOutcome === 'spinning' ? 'Spinning…' : (slotUsedRef.current ? 'Used' : 'Spin')}</button>
            </div>
            {slotOutcome === 'win' && (
              <div style={{ textAlign: 'center', marginTop: 10, color: '#4ade80', fontWeight: 700 }}>You won! Your points were doubled.</div>
            )}
            {slotOutcome === 'lose' && (
              <div style={{ textAlign: 'center', marginTop: 10, color: '#f87171', fontWeight: 700 }}>No luck this time.</div>
            )}
          </div>
        </div>
      )}

      {countdown !== null && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 8 }}>
          <div style={{ color: 'white', fontSize: 'clamp(64px, 20vw, 96px)', fontWeight: 900, textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>{countdown}</div>
        </div>
      )}
    </div>
  );
}