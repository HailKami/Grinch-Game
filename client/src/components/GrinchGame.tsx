import { useFrame } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import Grinch from "./Grinch";
import Santa from "./Santa";
import Gift from "./Gift";
import { useGrinchGame } from "../lib/stores/useGrinchGame";
import { useAudio } from "../lib/stores/useAudio";

export default function GrinchGame() {
  const {
    gameState,
    score,
    gifts,
    grinchPosition,
    santaPosition,
    difficulty,
    startGame,
    endGame,
    restartGame,
    updateGrinch,
    updateSanta,
    spawnGift,
    updateGifts,
    catchGift,
    increaseDifficulty
  } = useGrinchGame();

  const { playHit, playSuccess } = useAudio();
  const [subscribe, getControls] = useKeyboardControls();
  const lastGiftSpawn = useRef(0);
  const gameTime = useRef(0);

  // Start game on mount
  useEffect(() => {
    if (gameState === 'menu') {
      startGame();
    }
  }, [gameState, startGame]);

  // Handle restart controls
  useEffect(() => {
    const unsubscribe = subscribe(
      (state) => state.restart,
      (pressed) => {
        if (pressed && gameState === 'gameOver') {
          restartGame();
        }
      }
    );
    return unsubscribe;
  }, [subscribe, gameState, restartGame]);

  useFrame((state, delta) => {
    if (gameState !== 'playing') return;

    gameTime.current += delta;
    const controls = getControls();

    // Update Grinch movement
    let newGrinchX = grinchPosition.x;
    if (controls.left && grinchPosition.x > -7) {
      newGrinchX -= 8 * delta;
    }
    if (controls.right && grinchPosition.x < 7) {
      newGrinchX += 8 * delta;
    }
    updateGrinch(newGrinchX, grinchPosition.y);

    // Update Santa movement (side to side)
    const santaSpeed = 2 + difficulty * 0.5;
    const santaX = Math.sin(gameTime.current * santaSpeed) * 6;
    updateSanta(santaX, 4);

    // Spawn gifts based on difficulty
    const spawnRate = Math.max(0.5, 2 - difficulty * 0.3);
    if (gameTime.current - lastGiftSpawn.current > spawnRate) {
      const giftX = santaPosition.x + (Math.random() - 0.5) * 2;
      spawnGift(giftX, santaPosition.y - 1);
      lastGiftSpawn.current = gameTime.current;
    }

    // Update gifts (make them fall)
    const fallSpeed = 3 + difficulty;
    const updatedGifts = gifts.map(gift => ({
      ...gift,
      y: gift.y - fallSpeed * delta
    })).filter(gift => gift.y > -6); // Remove gifts that fell off screen

    updateGifts(updatedGifts);

    // Check for collisions
    gifts.forEach(gift => {
      const distance = Math.sqrt(
        Math.pow(gift.x - grinchPosition.x, 2) + 
        Math.pow(gift.y - grinchPosition.y, 2)
      );
      
      if (distance < 1) {
        catchGift(gift.id);
        playSuccess();
      }
    });

    // Check if any gifts hit the ground (game over)
    const hitGround = gifts.some(gift => gift.y < -5.5);
    if (hitGround) {
      endGame();
      playHit();
    }

    // Increase difficulty over time
    if (Math.floor(gameTime.current / 10) > difficulty) {
      increaseDifficulty();
    }
  });

  return (
    <>
      {gameState === 'playing' && (
        <>
          <Grinch position={[grinchPosition.x, grinchPosition.y, 0]} />
          <Santa position={[santaPosition.x, santaPosition.y, 0]} />
          {gifts.map(gift => (
            <Gift key={gift.id} position={[gift.x, gift.y, 0]} />
          ))}
          
          {/* Ground */}
          <mesh position={[0, -6, 0]}>
            <boxGeometry args={[20, 1, 1]} />
            <meshLambertMaterial color="#2d5016" />
          </mesh>

          {/* Snow effect */}
          <group>
            {Array.from({ length: 50 }, (_, i) => (
              <mesh key={i} position={[
                (Math.random() - 0.5) * 20,
                Math.random() * 12 - 6,
                (Math.random() - 0.5) * 10
              ]}>
                <sphereGeometry args={[0.05, 4, 4]} />
                <meshLambertMaterial color="white" />
              </mesh>
            ))}
          </group>
        </>
      )}
    </>
  );
}
