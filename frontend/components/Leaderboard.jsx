import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Leaderboard({ onViewFullRankings, userXp = 0 }) {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [livePlayers, setLivePlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTopLeaderboard() {
      setLoading(true);
      try {
        const res = await api.getLeaderboard({ period: 'all-time', limit: 10 });
        if (isMounted && res?.success && Array.isArray(res.top)) {
          const seen = new Set();
          const uniqueList = [];
          for (const u of res.top) {
            const key = u.name?.trim().toLowerCase();
            if (key && !seen.has(key)) {
              seen.add(key);
              const isUser = Boolean(
                isAuthenticated &&
                  (u.isCurrentUser ||
                    (currentUser && (u.id === currentUser.id || u.name?.toLowerCase() === currentUser.name?.toLowerCase())))
              );
              uniqueList.push({
                id: u.userId || u.id || u.name,
                name: u.name,
                rawXp: isUser ? (currentUser?.xp ?? userXp) : (u.xp || 0),
                avatar: u.avatar || '',
                isMe: isUser,
                squad: u.squad || '',
              });
            }
          }
          setLivePlayers(uniqueList);
        }
      } catch (err) {
        console.warn('[Leaderboard] API fetch failed:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTopLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [userXp, isAuthenticated, currentUser]);

  const allParticipants = [...livePlayers];
  if (isAuthenticated && currentUser && !allParticipants.some((p) => p.isMe)) {
    allParticipants.push({
      id: currentUser.id,
      name: currentUser.name,
      rawXp: currentUser.xp || userXp,
      isMe: true,
      avatar: currentUser.avatar || '',
      squad: '',
    });
  }

  const sorted = allParticipants.sort((a, b) => b.rawXp - a.rawXp);

  const ranked = sorted.map((p, idx) => ({
    ...p,
    rank: idx + 1,
    medal: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`,
    bg: idx === 0 ? 'bg-[#ffed00]' : idx === 1 ? 'bg-gray-100' : 'bg-[#ffdad6]',
    xp: `${p.rawXp.toLocaleString()} XP`,
  }));

  const entries = ranked.slice(0, 3);
  const myPlayer = isAuthenticated ? ranked.find((p) => p.isMe) : null;
  const myRank = myPlayer ? { rank: myPlayer.rank, xp: myPlayer.xp } : null;

  return (
    <div className="bg-white border-3 border-black p-6 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
      {/* Punch hole */}
      <div className="absolute top-3 right-3 w-4 h-4 bg-gray-200 border-2 border-black rounded-full" />

      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <span className="font-space font-bold uppercase text-[10px] bg-black text-white px-2 py-0.5 rounded">
            Rankings
          </span>
          <h2 className="font-bricolage font-extrabold text-2xl uppercase mt-1">
            Top Questers
          </h2>
        </div>
        <span className="text-3xl">🏆</span>
      </div>

      {loading ? (
        <div className="space-y-4 py-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-gray-100 border-2 border-black rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-gray-500 font-hanken text-sm">
          <p>No quester rankings yet.</p>
          <p className="text-xs mt-1">Conquer a quest to get on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((player) => (
            <div
              key={player.id}
              className={`p-3 border-2 border-black rounded-lg flex items-center justify-between transition-transform hover:-translate-y-0.5 ${
                player.isMe ? 'bg-[#ffed00] font-black' : 'bg-white font-bold'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-6 text-center">{player.medal}</span>
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-9 h-9 rounded-full border border-black object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full border border-black bg-gray-200 flex items-center justify-center text-xs font-mono">
                    {player.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-space text-sm leading-tight">
                    {player.name} {player.isMe && '(You)'}
                  </p>
                  {player.squad && (
                    <p className="font-hanken text-[10px] text-gray-600 font-normal">
                      {player.squad}
                    </p>
                  )}
                </div>
              </div>
              <span className="font-mono text-xs font-black">{player.xp}</span>
            </div>
          ))}
        </div>
      )}

      {/* Current User Rank footer */}
      {isAuthenticated && myRank && (
        <div className="mt-6 pt-4 border-t-2 border-dashed border-black/40 flex items-center justify-between text-xs font-space font-bold">
          <span className="text-gray-700">Your Rank: #{myRank.rank}</span>
          <span className="text-primary font-black">{myRank.xp}</span>
        </div>
      )}

      {/* CTA Button */}
      <button
        type="button"
        onClick={onViewFullRankings}
        className="w-full mt-6 py-2.5 bg-black text-white font-space font-bold uppercase text-xs border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(255,237,0,1)] hover:bg-[#ffed00] hover:text-black transition-all cursor-pointer"
      >
        View Full Standings ➔
      </button>
    </div>
  );
}

export default Leaderboard;
