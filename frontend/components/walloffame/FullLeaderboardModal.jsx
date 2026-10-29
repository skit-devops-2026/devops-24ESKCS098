import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

function FullLeaderboardModal({ isOpen, onClose, userXp = 0 }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [filterTab, setFilterTab] = useState('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    async function fetchRankings() {
      setLoading(true);
      try {
        const periodParam = filterTab === 'THIS_WEEK' ? 'weekly' : 'all-time';
        const res = await api.getLeaderboard({ period: periodParam, search: searchQuery, limit: 50 });
        if (isMounted && res?.success && Array.isArray(res.top)) {
          const seen = new Set();
          const uniqueList = [];
          for (const u of res.top) {
            const key = u.name?.trim().toLowerCase();
            if (key && !seen.has(key)) {
              seen.add(key);
              uniqueList.push(u);
            }
          }
          setRankings(uniqueList);
        }
      } catch (err) {
        console.warn('[FullLeaderboardModal] API fetch failed:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRankings();
    return () => {
      isMounted = false;
    };
  }, [isOpen, filterTab, searchQuery]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRankings = rankings
    .map((item) => {
      const isUser = Boolean(
        isAuthenticated &&
          (item.isCurrentUser ||
            (currentUser && (item.id === currentUser.id || item.name?.toLowerCase() === currentUser.name?.toLowerCase())))
      );
      return {
        ...item,
        xp: isUser ? (currentUser?.xp ?? userXp) : (item.xp || 0),
        isCurrentUser: isUser,
      };
    })
    .sort((a, b) => b.xp - a.xp)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
      medal: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null,
    }));

  const filtered = currentRankings
    .filter(
      (u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.squad && u.squad.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (filterTab === 'STREAKS') {
        const streakA = parseInt(a.streak, 10) || 0;
        const streakB = parseInt(b.streak, 10) || 0;
        return streakB - streakA;
      }
      return a.rank - b.rank;
    });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#FFFDF5] border-4 border-black rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-yellow border-b-4 border-black shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-6">
              👑
            </span>
            <div>
              <h2 className="font-bricolage font-black text-xl md:text-2xl uppercase tracking-tight text-black">
                Squad Rankings & Hall of Fame
              </h2>
              <p className="text-xs font-space font-bold text-black/80">
                Live rankings calculated by completed quests, challenges, and activity streaks.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 bg-black text-white border-2 border-black rounded-lg flex items-center justify-center font-bold text-sm hover:bg-neutral-800 transition-colors cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close rankings"
          >
            ✕
          </button>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="p-6 pb-3 border-b-3 border-black bg-white shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Filter Pills */}
            <div className="flex border-2 border-black rounded-lg overflow-hidden font-space text-xs font-bold uppercase self-start">
              <button
                type="button"
                onClick={() => setFilterTab('ALL_TIME')}
                className={`px-3 py-1.5 cursor-pointer transition-colors ${
                  filterTab === 'ALL_TIME' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                All-Time XP
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('THIS_WEEK')}
                className={`px-3 py-1.5 border-l-2 border-black cursor-pointer transition-colors ${
                  filterTab === 'THIS_WEEK' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                This Week ⚡
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('STREAKS')}
                className={`px-3 py-1.5 border-l-2 border-black cursor-pointer transition-colors ${
                  filterTab === 'STREAKS' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Streaks 🔥
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search questers or squads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-3 py-1.5 border-2 border-black rounded-lg font-space text-xs focus:outline-none focus:bg-yellow-50 bg-white"
              />
              <span className="absolute left-2.5 top-2 text-xs text-gray-500">🔍</span>
            </div>
          </div>
        </div>

        {/* Scrollable Rankings List */}
        <div className="overflow-y-auto p-6 space-y-3 flex-1 bg-neutral-50">
          {loading ? (
            <div className="space-y-3 py-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-16 bg-white border-2 border-black rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-hanken">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="font-bold">No questers found matching "{searchQuery}"</p>
            </div>
          ) : (
            filtered.map((player) => (
              <div
                key={player.id || player.name}
                className={`p-4 border-3 border-black rounded-xl flex items-center justify-between gap-4 transition-transform hover:-translate-y-0.5 ${
                  player.isCurrentUser
                    ? 'bg-brand-yellow shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {/* Left: Rank & Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 text-center font-black font-space text-lg text-black shrink-0">
                    {player.medal || `#${player.rank}`}
                  </div>

                  <div className="w-11 h-11 rounded-full border-2 border-black overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bricolage font-black text-sm md:text-base text-black truncate">
                        {player.name} {player.isCurrentUser && '(You)'}
                      </h4>
                      {player.isCurrentUser && (
                        <span className="bg-black text-white text-[9px] font-space font-black px-1.5 py-0.2 rounded uppercase">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-space text-black/70">
                      {player.squad && <span>{player.squad}</span>}
                      {player.badge && (
                        <>
                          <span>•</span>
                          <span className="hidden sm:inline font-bold text-black">{player.badge}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: XP & Streak */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  {player.streak && (
                    <span className="hidden sm:inline-block px-2 py-1 bg-amber-100 border border-black rounded text-[11px] font-space font-bold">
                      {player.streak}
                    </span>
                  )}
                  <div className="font-space font-black text-sm md:text-base text-black">
                    {Number(player.xp).toLocaleString()} XP
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t-3 border-black flex items-center justify-between text-xs font-space font-bold shrink-0">
          <span className="text-black/70">
            Total active questers on LifeQuest: {currentRankings.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-black text-white rounded font-space font-bold uppercase hover:bg-neutral-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FullLeaderboardModal;
