import { useEffect, useState, useRef } from "react";
import { useGrinchGame } from "../lib/stores/useGrinchGame";

export default function GameOverScreen() {
  const { gameState, username, score, restartGame } = useGrinchGame();
  const [scoreSaved, setScoreSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const isActiveRef = useRef(true);

  // Save score to database when game ends
  useEffect(() => {
    // Reset states and mark as active when entering game over
    if (gameState === 'gameOver') {
      isActiveRef.current = true;
      setScoreSaved(false);
      setSaveError(false);
      
      if (username && score > 0) {
        const saveScore = async () => {
          try {
            const response = await fetch('/api/leaderboard', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username,
                score,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save score');
            }

            // Only update state if still in game over (not restarted)
            if (isActiveRef.current) {
              setScoreSaved(true);
            }
          } catch (error) {
            console.error('Error saving score:', error);
            // Only update state if still in game over (not restarted)
            if (isActiveRef.current) {
              setSaveError(true);
            }
          }
        };

        saveScore();
      }
    } else {
      // Mark as inactive when leaving game over state
      isActiveRef.current = false;
    }
  }, [gameState, username, score]);

  // Only show when game is over
  if (gameState !== 'gameOver') {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      textAlign: 'center',
      zIndex: 200,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '40px',
      borderRadius: '20px',
      backdropFilter: 'blur(10px)',
      border: '2px solid #c41e3a'
    }}>
      <h1 style={{
        fontSize: '48px',
        marginBottom: '20px',
        color: '#c41e3a',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        🎄 Game Over! 🎄
      </h1>
      
      <p style={{
        fontSize: '24px',
        marginBottom: '10px'
      }}>
        {username} caught {score} gifts!
      </p>
      
      {scoreSaved && (
        <p style={{
          fontSize: '16px',
          marginBottom: '10px',
          color: '#4ade80'
        }}>
          ✓ Score saved to leaderboard!
        </p>
      )}
      
      {saveError && (
        <p style={{
          fontSize: '16px',
          marginBottom: '10px',
          color: '#f87171'
        }}>
          ✗ Failed to save score
        </p>
      )}
      
      <p style={{
        fontSize: '18px',
        marginBottom: '30px',
        color: '#cccccc'
      }}>
        Santa's gifts reached the ground...
      </p>
      
      <button
        onClick={restartGame}
        style={{
          fontSize: '20px',
          padding: '15px 30px',
          backgroundColor: '#4a7c59',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#5a8c69';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4a7c59';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        🎮 Play Again (Press R or Space)
      </button>
      
      <div style={{
        marginTop: '20px',
        fontSize: '14px',
        color: '#888'
      }}>
        Use A/D or Arrow Keys to move the Grinch
      </div>
    </div>
  );
}
