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
    
    // Grinch body (green)
    ctx.fillStyle = '#4a7c59';
    ctx.fillRect(grinchObj.x, grinchObj.y, grinchObj.width, grinchObj.height);
    
    // Grinch head
    ctx.fillRect(grinchObj.x + 10, grinchObj.y - 30, 30, 30);
    
    // Santa hat
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(grinchObj.x + 12, grinchObj.y - 45, 26, 20);
    
    // Hat pompom
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(grinchObj.x + 25, grinchObj.y - 45, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(grinchObj.x + 18, grinchObj.y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(grinchObj.x + 32, grinchObj.y - 20, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  const drawSanta = useCallback((ctx: CanvasRenderingContext2D, santaObj: GameObject) => {
    ctx.save();
    
    // Sleigh
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(santaObj.x, santaObj.y + 20, 60, 25);
    
    // Santa
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(santaObj.x + 15, santaObj.y, 30, 40);
    
    // Santa's head
    ctx.fillStyle = '#FDBCB4';
    ctx.beginPath();
    ctx.arc(santaObj.x + 30, santaObj.y - 5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Santa's hat
    ctx.fillStyle = '#c41e3a';
    ctx.fillRect(santaObj.x + 20, santaObj.y - 20, 20, 15);
    
    // Reindeer
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(santaObj.x + 65, santaObj.y + 10, 40, 20);
    
    // Reindeer head
    ctx.fillRect(santaObj.x + 100, santaObj.y + 5, 20, 15);
    
    // Antlers
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(santaObj.x + 105, santaObj.y);
    ctx.lineTo(santaObj.x + 105, santaObj.y - 15);
    ctx.moveTo(santaObj.x + 115, santaObj.y);
    ctx.lineTo(santaObj.x + 115, santaObj.y - 15);
    ctx.stroke();
    
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