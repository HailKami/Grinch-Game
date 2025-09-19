import { useEffect, useRef, useCallback } from "react";
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
}

export default function GrinchGame2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
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
  
  const {
    gameState,
    startGame,
    endGame,
    restartGame,
  } = useGrinchGame();
  
  const { playHit, playSuccess } = useAudio();

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

  // Draw functions
  const drawGrinch = useCallback((ctx: CanvasRenderingContext2D, grinchObj: GameObject) => {
    ctx.save();
    
    const centerX = grinchObj.x + grinchObj.width / 2;
    const centerY = grinchObj.y + grinchObj.height / 2;
    
    // Grinch body (pear-shaped, green and furry)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 10, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some fur texture
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const fuzzX = centerX + Math.cos(angle) * 18;
      const fuzzY = centerY + 5 + Math.sin(angle) * 25;
      ctx.beginPath();
      ctx.arc(fuzzX, fuzzY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Grinch head (larger, more oval)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(centerX, grinchObj.y - 15, 20, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head fur details
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fuzzX = centerX + Math.cos(angle) * 16;
      const fuzzY = grinchObj.y - 15 + Math.sin(angle) * 20;
      ctx.beginPath();
      ctx.arc(fuzzX, fuzzY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Grinch snout/muzzle
    ctx.fillStyle = '#90EE90';
    ctx.beginPath();
    ctx.ellipse(centerX, grinchObj.y - 8, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa hat (more detailed)
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(centerX - 15, grinchObj.y - 35);
    ctx.quadraticCurveTo(centerX - 5, grinchObj.y - 50, centerX + 10, grinchObj.y - 45);
    ctx.quadraticCurveTo(centerX + 20, grinchObj.y - 40, centerX + 15, grinchObj.y - 30);
    ctx.lineTo(centerX + 15, grinchObj.y - 35);
    ctx.lineTo(centerX - 15, grinchObj.y - 35);
    ctx.fill();
    
    // Hat fur trim
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX, grinchObj.y - 35, 18, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hat pompom (bigger and fluffier)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX + 12, grinchObj.y - 42, 6, 0, Math.PI * 2);
    ctx.fill();
    // Pompom texture
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fluffX = centerX + 12 + Math.cos(angle) * 4;
      const fluffY = grinchObj.y - 42 + Math.sin(angle) * 4;
      ctx.beginPath();
      ctx.arc(fluffX, fluffY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Eyes (more expressive)
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.ellipse(centerX - 8, grinchObj.y - 18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + 8, grinchObj.y - 18, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye pupils (red and menacing)
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX - 8, grinchObj.y - 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 8, grinchObj.y - 18, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyebrows (menacing)
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 12, grinchObj.y - 25);
    ctx.lineTo(centerX - 4, grinchObj.y - 22);
    ctx.moveTo(centerX + 4, grinchObj.y - 22);
    ctx.lineTo(centerX + 12, grinchObj.y - 25);
    ctx.stroke();
    
    // Grinch smile (mischievous)
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, grinchObj.y - 5, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Arms (more detailed)
    ctx.fillStyle = '#228B22';
    // Left arm
    ctx.beginPath();
    ctx.ellipse(grinchObj.x + 8, centerY, 6, 15, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right arm
    ctx.beginPath();
    ctx.ellipse(grinchObj.x + grinchObj.width - 8, centerY, 6, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Hands
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.arc(grinchObj.x + 8, centerY + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grinchObj.x + grinchObj.width - 8, centerY + 12, 4, 0, Math.PI * 2);
    ctx.fill();
    
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

  const drawGift = useCallback((ctx: CanvasRenderingContext2D, gift: Gift) => {
    ctx.save();
    
    // Gift box
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
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 1/30); // Cap deltaTime
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#001122';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw snow (falling straight down as snowflakes)
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      for (let i = 0; i < 50; i++) {
        const x = (i * 17) % canvas.width; // Fixed horizontal position - no horizontal movement
        const y = (i * 23 + gameTimeRef.current * 50) % canvas.height;
        
        // Draw snowflake shape
        ctx.beginPath();
        // Center dot
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Six arms of the snowflake
        const armLength = 3;
        for (let arm = 0; arm < 6; arm++) {
          const angle = (arm * Math.PI) / 3;
          const endX = x + Math.cos(angle) * armLength;
          const endY = y + Math.sin(angle) * armLength;
          
          // Main arm
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          
          // Small branches on each arm
          const branchLength = armLength * 0.4;
          const branchX1 = x + Math.cos(angle) * branchLength;
          const branchY1 = y + Math.sin(angle) * branchLength;
          
          ctx.beginPath();
          ctx.moveTo(branchX1, branchY1);
          ctx.lineTo(branchX1 + Math.cos(angle + Math.PI/4) * 1, branchY1 + Math.sin(angle + Math.PI/4) * 1);
          ctx.moveTo(branchX1, branchY1);
          ctx.lineTo(branchX1 + Math.cos(angle - Math.PI/4) * 1, branchY1 + Math.sin(angle - Math.PI/4) * 1);
          ctx.stroke();
        }
      }
      
      // Draw ground
      ctx.fillStyle = '#2d5016';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

      // Update Grinch position
      let newGrinchX = grinchRef.current.x;
      const speed = 300; // pixels per second
      
      if (keysRef.current['KeyA'] || keysRef.current['ArrowLeft']) {
        newGrinchX -= speed * deltaTime;
      }
      if (keysRef.current['KeyD'] || keysRef.current['ArrowRight']) {
        newGrinchX += speed * deltaTime;
      }
      
      // Keep Grinch on screen
      newGrinchX = Math.max(0, Math.min(canvas.width - grinchRef.current.width, newGrinchX));
      grinchRef.current.x = newGrinchX;

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
        
        giftsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: santaRef.current.x + 30 + (Math.random() - 0.5) * giftOffsetRange,
          y: santaRef.current.y + 50,
          width: 25,
          height: 25,
          speed: 150 + difficultyRef.current * 50
        });
        
        // Schedule next gift with random timing
        nextGiftAtRef.current = gameTimeRef.current + baseSpawnRate * (0.6 + Math.random() * 0.8);
        lastGiftSpawnRef.current = gameTimeRef.current;
      }

      // Update gifts
      giftsRef.current = giftsRef.current.map(gift => ({
        ...gift,
        y: gift.y + gift.speed * deltaTime
      })).filter(gift => gift.y < canvas.height + 50);

      // Check collisions and remove caught gifts
      const newGifts: Gift[] = [];
      for (const gift of giftsRef.current) {
        if (checkCollision(grinchRef.current, gift)) {
          scoreRef.current += 1;
          playSuccess();
        } else {
          newGifts.push(gift);
        }
      }
      giftsRef.current = newGifts;

      // Check for game over (gifts hit ground)
      const hitGround = giftsRef.current.some(gift => gift.y > canvas.height - 60);
      if (hitGround) {
        endGame();
        playHit();
        return;
      }

      // Increase difficulty
      const newDifficulty = Math.floor(gameTimeRef.current / 10);
      if (newDifficulty > difficultyRef.current) {
        difficultyRef.current = newDifficulty;
      }

      // Update game time
      gameTimeRef.current += deltaTime;

      // Draw game objects
      drawGrinch(ctx, grinchRef.current);
      drawSanta(ctx, santaRef.current, santaMotionRef.current.facingLeft);
      giftsRef.current.forEach(gift => drawGift(ctx, gift));
      
      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeText(`Score: ${scoreRef.current}`, 20, 40);
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);
      
      ctx.strokeText(`Level: ${difficultyRef.current + 1}`, 20, 70);
      ctx.fillText(`Level: ${difficultyRef.current + 1}`, 20, 70);

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

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border: '2px solid #333',
        backgroundColor: '#001122',
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
}