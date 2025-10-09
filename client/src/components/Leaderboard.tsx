import { useEffect, useState } from 'react';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  createdAt: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard?limit=10');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data = await response.json();
        setEntries(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[300]">
      <div className="bg-gradient-to-b from-green-700 to-red-700 p-8 rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            🏆 Top Catchers 🏆
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="text-center text-white py-8">
            <p className="text-xl">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-red-300 py-8">
            <p className="text-xl">Failed to load leaderboard</p>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="text-center text-white py-8">
            <p className="text-xl">No scores yet. Be the first!</p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-400 text-gray-900'
                    : index === 1
                    ? 'bg-gray-300 text-gray-900'
                    : index === 2
                    ? 'bg-orange-400 text-gray-900'
                    : 'bg-white bg-opacity-20 text-white'
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-2xl font-bold w-8">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span className="font-semibold text-lg truncate flex-1">
                    {entry.username}
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-yellow-400 hover:bg-yellow-300 text-green-800 font-bold py-3 px-6 rounded-lg text-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
