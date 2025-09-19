import { useEffect, useState } from "react";
import "@fontsource/inter";
import GrinchGame2D from "./components/GrinchGame2D";
import GameUI from "./components/GameUI";
import GameOverScreen from "./components/GameOverScreen";

// Main App component
function App() {
  const [showGame, setShowGame] = useState(false);

  // Show the game once everything is loaded
  useEffect(() => {
    setShowGame(true);
  }, []);

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
        </>
      )}
    </div>
  );
}

export default App;
