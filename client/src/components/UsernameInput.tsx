import { useEffect, useState } from 'react';
import { useGrinchGame } from "../lib/stores/useGrinchGame";

interface UsernameInputProps {
  onSubmit: (username: string) => void;
}

export default function UsernameInput({ onSubmit }: UsernameInputProps) {
  const [username, setUsername] = useState('');
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');
  const setWalletAddress = useGrinchGame(s => s.setWalletAddress);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('wallet');
    if (w) {
      setWallet(w);
      setWalletAddress(w);
    }
  }, [setWalletAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (wallet) {
      setWalletAddress(wallet.trim());
    }
    onSubmit(trimmedUsername);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-red-700 to-green-700 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          🎄 Grinch's Gift Catch 🎁
        </h1>
        <p className="text-white text-center mb-6 text-sm opacity-90">
          Help the Grinch catch falling gifts!
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-white font-semibold mb-2">
              Enter Your Name:
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-lg border-2 border-white bg-white text-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Your name..."
              maxLength={20}
              autoFocus
            />
            {error && (
              <p className="text-yellow-300 text-sm mt-2 font-semibold">
                {error}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="wallet" className="block text-white font-semibold mb-2">
              Solana Wallet Address (optional)
            </label>
            <input
              id="wallet"
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-white bg-white text-gray-800 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Enter your Solana address"
              spellCheck={false}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-green-800 font-bold py-3 px-6 rounded-lg text-xl transition-colors shadow-lg"
          >
            Start Game!
          </button>
        </form>
        
        <p className="text-white text-center mt-6 text-sm opacity-75">
          Controls: Arrow Keys or A/D • Mobile: Tap Left/Right
        </p>
      </div>
    </div>
  );
}
