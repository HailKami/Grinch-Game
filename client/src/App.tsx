import { useEffect, useState } from "react";
import "@fontsource/inter";
import GrinchGame2D from "./components/GrinchGame2D";
import GameUI from "./components/GameUI";
import GameOverScreen from "./components/GameOverScreen";
import UsernameInput from "./components/UsernameInput";
import AdminPanel from "./components/AdminPanel";
import { useGrinchGame } from "./lib/stores/useGrinchGame";

// Main App component
function App() {
  const [showGame, setShowGame] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const { gameState, setUsername, startGame } = useGrinchGame();

  // Admin panel keyboard shortcut (Ctrl+Shift+A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdmin(true);
      }
      if (e.key === 'Escape' && showAdmin) {
        setShowAdmin(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdmin]);

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

          {/* Admin Panel */}
          {showAdmin && (
            <AdminPanel onClose={() => setShowAdmin(false)} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
