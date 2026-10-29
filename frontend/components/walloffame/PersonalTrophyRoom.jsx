import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function PersonalTrophyRoom({ userXp = 0 }) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalQuests: 0,
    totalXp: '0 XP',
    currentRank: '#1',
    streakWeeks: 0,
    squadCount: 0,
  });
  const [badges, setBadges] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [badgeFilter, setBadgeFilter] = useState('ALL'); // 'ALL' | 'UNLOCKED' | 'LOCKED'
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    async function fetchTrophyData() {
      setIsLoading(true);
      try {
        const res = await api.getMyTrophyRoom(filterCategory);
        if (isMounted && res?.success) {
          if (res.stats) setStats(res.stats);
          if (Array.isArray(res.badges)) setBadges(res.badges);
          if (Array.isArray(res.completedItems)) setCompletedItems(res.completedItems);
        }
      } catch (err) {
        console.warn('[PersonalTrophyRoom] Failed to fetch live trophy data:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTrophyData();
    return () => {
      isMounted = false;
    };
  }, [filterCategory]);

  const togglePrivacy = async (item) => {
    const newIsPrivate = !item.isPrivate;
    const newVisibility = newIsPrivate ? 'personal' : 'shared';

    // Optimistic UI update
    setCompletedItems((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isPrivate: newIsPrivate } : c))
    );

    if (item.postId) {
      try {
        await api.updatePostVisibility(item.postId, newVisibility);
      } catch (err) {
        console.warn('[PersonalTrophyRoom] Failed to update privacy:', err.message);
        // Revert on failure
        setCompletedItems((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, isPrivate: item.isPrivate } : c))
        );
      }
    }
  };

  const filteredBadges = badges.filter((b) => {
    if (badgeFilter === 'UNLOCKED') return !b.locked;
    if (badgeFilter === 'LOCKED') return b.locked;
    return true;
  });

  const unlockedCount = badges.filter((b) => !b.locked).length;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-gray-200 border-4 border-black rounded-2xl" />
        <div className="h-64 bg-gray-100 border-4 border-black rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 bg-gray-200 border-3 border-black rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Top Banner / User Passport Header */}
      <div className="p-6 md:p-8 bg-brand-yellow border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 border-3 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
              <img
                alt={currentUser?.name || 'User Avatar'}
                className="w-full h-full object-cover"
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.name || 'Explorer')}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.name || 'Explorer')}`;
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bricolage font-black text-2xl md:text-3xl uppercase tracking-tight text-black">
                  {currentUser?.name || 'Adventurer'}'s Trophy Room
                </h2>
                <span className="px-2.5 py-1 bg-black text-white font-space font-black text-xs rounded uppercase">
                  Level {Math.max(1, Math.floor((currentUser?.xp || userXp || 250) / 300))}
                </span>
              </div>
              <p className="font-hanken font-medium text-black/80 text-sm mt-1">
                Your private achievement archive & lifetime conquests across all squads.
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Conquests</p>
              <p className="font-bricolage font-black text-2xl text-black">{stats.totalQuests}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Total XP</p>
              <p className="font-bricolage font-black text-xl text-[#b60055]">{stats.totalXp}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Global Rank</p>
              <p className="font-bricolage font-black text-2xl text-black">{stats.currentRank}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Streak</p>
              <p className="font-bricolage font-black text-2xl text-amber-600">
                {stats.streakWeeks}w 🔥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Badges Trophy Cabinet */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎖️</span>
            <div>
              <h3 className="font-bricolage font-black text-xl md:text-2xl uppercase tracking-tight text-black">
                Earned Achievement Badges
              </h3>
              <p className="font-hanken text-xs text-black/70">
                Badges unlocked by completing milestones and hitting activity streaks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border-2 border-black rounded-lg overflow-hidden font-space text-xs font-bold uppercase">
              <button
                type="button"
                onClick={() => setBadgeFilter('ALL')}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  badgeFilter === 'ALL' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                All ({badges.length})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('UNLOCKED')}
                className={`px-3 py-1 border-l-2 border-black cursor-pointer transition-colors ${
                  badgeFilter === 'UNLOCKED' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setBadgeFilter('LOCKED')}
                className={`px-3 py-1 border-l-2 border-black cursor-pointer transition-colors ${
                  badgeFilter === 'LOCKED' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                Locked ({badges.length - unlockedCount})
              </button>
            </div>
            <span className="hidden md:inline-block font-space font-bold text-xs bg-[#b4f8c8] px-3 py-1 border-2 border-black rounded-full">
              {unlockedCount} / {badges.length} Unlocked
            </span>
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-hanken">
            <p className="text-3xl mb-2">🛡️</p>
            <p>No badges in trophy room yet. Complete quests to earn your first badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pt-2">
            {filteredBadges.map((b) => (
              <div
                key={b.id}
                className={`p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  b.locked ? 'bg-gray-50 border-dashed opacity-85' : b.bg
                } flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl ${b.locked ? 'grayscale' : ''}`}>{b.icon}</span>
                    <span className="text-[10px] font-space font-black bg-white px-2 py-0.5 border border-black rounded uppercase">
                      {b.category}
                    </span>
                  </div>
                  <h4 className="font-bricolage font-black text-sm uppercase text-black leading-tight">
                    {b.title}
                  </h4>
                  <p className="font-hanken text-xs text-black/80 mt-1 leading-snug">{b.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-black/30 flex justify-between items-center text-[10px] font-space font-bold text-black/70">
                  <span>{b.locked ? 'Status' : 'Unlocked'}</span>
                  <span className={b.locked ? 'text-amber-800 font-black' : 'text-emerald-900 font-black'}>
                    {b.locked ? b.progress || 'Locked 🔒' : b.unlockedAt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Completed Quests Archive */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bricolage font-black text-2xl uppercase tracking-tight text-black">
              Conquered Quests Log ({completedItems.length})
            </h3>
            <p className="font-hanken text-xs text-black/70">
              Control privacy visibility per quest and inspect your photo proofs.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 font-space text-xs font-bold uppercase">
            {['ALL', 'ADVENTURE', 'TRAVEL', 'FITNESS', 'SKILLS', 'CAREER'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 border-2 border-black rounded-lg transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                    : 'bg-white hover:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Quest Cards Grid */}
        {completedItems.length === 0 ? (
          <div className="py-16 text-center bg-white border-3 border-black rounded-xl p-8">
            <span className="text-5xl">🏔️</span>
            <h4 className="font-bricolage font-black text-xl uppercase mt-3">No Conquered Quests Yet</h4>
            <p className="font-hanken text-sm text-gray-600 mt-1">
              Check off goals on your bucket list or post an achievement to fill your trophy room!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border-3 border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-4 hover:-translate-y-1 transition-transform"
              >
                <div className="space-y-3">
                  {/* Meta row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 bg-[#bdf2ff] text-black border-2 border-black rounded font-space font-bold text-[10px] uppercase">
                        {item.category}
                      </span>
                      {item.squad && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-black border border-black rounded font-space text-[10px] font-bold">
                          {item.squad}
                        </span>
                      )}
                    </div>

                    {/* Privacy Toggle */}
                    <button
                      type="button"
                      onClick={() => togglePrivacy(item)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded text-[11px] font-space font-bold cursor-pointer transition-colors ${
                        item.isPrivate ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}
                      title="Click to toggle Public / Private"
                    >
                      <span>{item.isPrivate ? '🔒 Private' : '🌐 Group Visible'}</span>
                    </button>
                  </div>

                  {/* Proof Image */}
                  {item.image && (
                    <div className="h-44 border-2 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100 group">
                      <img
                        alt={item.title}
                        src={item.image}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-space font-bold">
                        {item.completedDate}
                      </span>
                    </div>
                  )}

                  <h4 className="font-bricolage font-black text-lg text-black leading-snug">
                    {item.title}
                  </h4>

                  {item.note && (
                    <p className="font-hanken text-xs text-black/75 line-clamp-3 italic">
                      "{item.note}"
                    </p>
                  )}
                </div>

                {/* Bottom Stat & XP */}
                <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-space font-bold">
                  <span className="text-black/80 truncate max-w-[65%]">{item.stat}</span>
                  <span className="px-2.5 py-1 bg-[#b4f8c8] text-black border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    +{item.xp} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonalTrophyRoom;
