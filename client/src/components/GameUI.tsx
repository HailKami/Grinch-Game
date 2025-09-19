import { useGrinchGame } from "../lib/stores/useGrinchGame";

export default function GameUI() {
  const { score, difficulty, gameState } = useGrinchGame();

  if (gameState !== 'playing') return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: '10px 15px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)'
    }}>
      <div>Score: {score}</div>
      <div>Level: {difficulty + 1}</div>
    </div>
  );
}
