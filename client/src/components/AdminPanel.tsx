import { useState } from 'react';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  wallet?: string | null;
  createdAt: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const trimmedPassword = password.trim();
      if (!trimmedPassword) {
        setError('Please enter a password');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/admin/leaderboard?password=${encodeURIComponent(trimmedPassword)}&limit=1000`);
      
      // Check if response is HTML (means route not found)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        setError('Server route not found. Make sure server is running and restarted.');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Incorrect password. Make sure you entered: Hailkami628');
          setLoading(false);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Server error: ${response.status}`);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      setEntries(data);
      setAuthenticated(true);
    } catch (err: any) {
      setError(`Connection error: ${err.message || 'Check if server is running'}`);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const trimmedPassword = password.trim();
      const response = await fetch(`/api/admin/search?password=${encodeURIComponent(trimmedPassword)}&username=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          setAuthenticated(false);
          return;
        }
        throw new Error('Failed to search');
      }
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[400]">
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-6">🔐 Admin Access</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredEntries = searchTerm
    ? entries.filter(e => e.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    : entries;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[400]">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🔐 Admin Panel - Wallet Addresses</h2>
          <button
            onClick={() => {
              setAuthenticated(false);
              setPassword('');
              setEntries([]);
              onClose();
            }}
            className="text-white hover:text-gray-300 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by username..."
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchTerm('');
              handleLogin();
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-200 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-white py-8">
            <p>Loading...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center text-white py-8">
            <p>No results found</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 p-2 bg-gray-700 text-white font-semibold text-sm rounded">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Username</div>
              <div className="col-span-2">Score</div>
              <div className="col-span-6">Wallet Address</div>
            </div>
            {filteredEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 gap-2 p-3 bg-gray-700 bg-opacity-50 rounded hover:bg-opacity-70 transition"
              >
                <div className="col-span-1 text-white font-bold">
                  {index + 1}
                </div>
                <div className="col-span-3 text-white truncate">
                  {entry.username}
                </div>
                <div className="col-span-2 text-white font-semibold">
                  {entry.score}
                </div>
                <div className="col-span-6 text-gray-300 text-xs break-all">
                  {entry.wallet || <span className="text-gray-500 italic">No wallet</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-400">
          Total: {filteredEntries.length} {searchTerm ? 'results' : 'players'}
        </div>
      </div>
    </div>
  );
}

