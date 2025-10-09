import { useEffect, useState } from "react";
import "@fontsource/inter";
import GrinchGame2D from "./components/GrinchGame2D";
import GameUI from "./components/GameUI";
import GameOverScreen from "./components/GameOverScreen";
import UsernameInput from "./components/UsernameInput";
import { useGrinchGame } from "./lib/stores/useGrinchGame";

// Main App component
function App() {
  const [showGame, setShowGame] = useState(false);
  const { gameState, setUsername, startGame } = useGrinchGame();

  // Show the game once everything is loaded
  useEffect(() => {
    setShowGame(true);
  }, []);

  const handleUsernameSubmit = (username: string) => {
    setUsername(username);
    startGame();
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#001122',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {showGame && (
        <>
          <div style={{ position: 'relative' }}>
            <GrinchGame2D />
          </div>
          
          {/* UI Components rendered as overlays */}
          <GameUI />
          <GameOverScreen />
          
          {/* Username input screen */}
          {gameState === 'usernameInput' && (
            <UsernameInput onSubmit={handleUsernameSubmit} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
