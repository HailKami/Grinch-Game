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

  const drawSanta = useCallback((ctx: CanvasRenderingContext2D, santaObj: GameObject) => {
    ctx.save();
    
    const centerX = santaObj.x + 30;
    
    // Sleigh (more detailed and curved)
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(santaObj.x - 5, santaObj.y + 35);
    ctx.quadraticCurveTo(santaObj.x + 30, santaObj.y + 20, santaObj.x + 65, santaObj.y + 35);
    ctx.quadraticCurveTo(santaObj.x + 65, santaObj.y + 50, santaObj.x + 60, santaObj.y + 50);
    ctx.lineTo(santaObj.x, santaObj.y + 50);
    ctx.quadraticCurveTo(santaObj.x - 5, santaObj.y + 50, santaObj.x - 5, santaObj.y + 35);
    ctx.fill();
    
    // Sleigh decorations
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(santaObj.x + i * 12 + 5, santaObj.y + 45, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa's body (jolly and round)
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.ellipse(centerX, santaObj.y + 15, 18, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's belt
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 18, santaObj.y + 20, 36, 6);
    
    // Belt buckle
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(centerX - 4, santaObj.y + 21, 8, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(centerX - 2, santaObj.y + 22, 4, 2);
    
    // Santa's head (round and cheerful)
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(centerX, santaObj.y - 8, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's beard (fluffy and white)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX, santaObj.y + 5, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Beard texture
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const beardX = centerX + Math.cos(angle) * 10;
      const beardY = santaObj.y + 5 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(beardX, beardY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Santa's mustache
    ctx.beginPath();
    ctx.ellipse(centerX, santaObj.y - 3, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's hat (more detailed)
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(centerX - 12, santaObj.y - 20);
    ctx.quadraticCurveTo(centerX, santaObj.y - 35, centerX + 18, santaObj.y - 25);
    ctx.quadraticCurveTo(centerX + 20, santaObj.y - 20, centerX + 15, santaObj.y - 15);
    ctx.lineTo(centerX - 12, santaObj.y - 15);
    ctx.fill();
    
    // Hat trim
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, santaObj.y - 15, 15, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Hat pompom
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX + 15, santaObj.y - 22, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's eyes (jolly)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 5, santaObj.y - 12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 5, santaObj.y - 12, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye twinkle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - 4, santaObj.y - 13, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 6, santaObj.y - 13, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's rosy cheeks
    ctx.fillStyle = '#FF69B4';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(centerX - 10, santaObj.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 10, santaObj.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Reindeer (more detailed Rudolph)
    const reindeerX = santaObj.x + 85;
    const reindeerY = santaObj.y + 15;
    
    // Reindeer body
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(reindeerX, reindeerY, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Reindeer head
    ctx.beginPath();
    ctx.ellipse(reindeerX + 25, reindeerY - 5, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Reindeer snout
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(reindeerX + 33, reindeerY - 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Rudolph's red nose
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(reindeerX + 37, reindeerY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Reindeer eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(reindeerX + 22, reindeerY - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(reindeerX + 28, reindeerY - 8, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Antlers (more elaborate)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Left antler main branch
    ctx.moveTo(reindeerX + 20, reindeerY - 15);
    ctx.lineTo(reindeerX + 18, reindeerY - 25);
    // Left antler branches
    ctx.moveTo(reindeerX + 19, reindeerY - 20);
    ctx.lineTo(reindeerX + 16, reindeerY - 22);
    ctx.moveTo(reindeerX + 19, reindeerY - 18);
    ctx.lineTo(reindeerX + 22, reindeerY - 20);
    
    // Right antler main branch
    ctx.moveTo(reindeerX + 30, reindeerY - 15);
    ctx.lineTo(reindeerX + 32, reindeerY - 25);
    // Right antler branches
    ctx.moveTo(reindeerX + 31, reindeerY - 20);
    ctx.lineTo(reindeerX + 34, reindeerY - 22);
    ctx.moveTo(reindeerX + 31, reindeerY - 18);
    ctx.lineTo(reindeerX + 28, reindeerY - 20);
    ctx.stroke();
    
    // Reindeer legs
    ctx.fillStyle = '#8B4513';
    for (let i = 0; i < 4; i++) {
      const legX = reindeerX - 10 + i * 8;
      ctx.beginPath();
      ctx.ellipse(legX, reindeerY + 12, 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hooves
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(legX, reindeerY + 20, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8B4513';
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
      
      // Draw snow
      ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const x = (i * 17 + gameTimeRef.current * 20) % canvas.width;
        const y = (i * 23 + gameTimeRef.current * 50) % canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
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

      // Update Santa position (side to side movement)
      const santaSpeed = 2 + difficultyRef.current * 0.5;
      const newSantaX = canvas.width / 2 + Math.sin(gameTimeRef.current * santaSpeed) * 200;
      santaRef.current.x = newSantaX;

      // Spawn gifts
      const spawnRate = Math.max(0.8, 2.5 - difficultyRef.current * 0.3);
      if (gameTimeRef.current - lastGiftSpawnRef.current > spawnRate) {
        giftsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: santaRef.current.x + 30 + (Math.random() - 0.5) * 40,
          y: santaRef.current.y + 50,
          width: 25,
          height: 25,
          speed: 150 + difficultyRef.current * 50
        });
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
      drawSanta(ctx, santaRef.current);
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