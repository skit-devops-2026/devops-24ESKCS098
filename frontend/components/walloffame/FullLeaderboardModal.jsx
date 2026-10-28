import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { getUserAvatar } from '../../utils/avatar';

const FULL_RANKINGS = [
  {
    rank: 1,
    medal: '🥇',
    name: 'Elena Vance',
    squad: 'Trip Squad',
    completedQuests: 7,
    xp: 2250,
    badge: '🚀 Most Adventurous',
    streak: '6w 🔥',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9',
  },
  {
    rank: 2,
    medal: '🥈',
    name: 'Alex Rivero',
    squad: 'Trip Squad',
    completedQuests: 6,
    xp: 1950,
    badge: '⚡ First to Finish',
    streak: '4w 🔥',
    isCurrentUser: true,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6',
  },
  {
    rank: 3,
    medal: '🥉',
    name: 'Priya Sharma',
    squad: 'College Gang',
    completedQuests: 5,
    xp: 1800,
    badge: '🏍️ Nomad Rider',
    streak: '5w 🔥',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
  },
  {
    rank: 4,
    name: 'Sarah Chen',
    squad: 'Trip Squad',
    completedQuests: 5,
    xp: 1550,
    badge: '🎨 Craft Specialist',
    streak: '3w 🔥',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  },
  {
    rank: 5,
    name: 'Marco Polo',
    squad: 'Trip Squad',
    completedQuests: 4,
    xp: 1400,
    badge: '🍝 Master Chef',
    streak: '4w 🔥',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  },
  {
    rank: 6,
    name: 'Jordan Smith',
    squad: 'Fitness Freaks',
    completedQuests: 4,
    xp: 1200,
    badge: '🏃 100k Club',
    streak: '2w 🔥',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  },
  {
    rank: 7,
    name: 'Riya Sharma',
    squad: 'College Gang',
    completedQuests: 3,
    xp: 1050,
    badge: '📸 Best Storyteller',
    streak: '3w 🔥',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
  },
];

function FullLeaderboardModal({ isOpen, onClose, userXp = 1950 }) {
  const [filterTab, setFilterTab] = useState('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiRankings, setApiRankings] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function fetchRankings() {
      try {
        const periodMap = {
          THIS_MONTH: 'monthly',
          THIS_WEEK: 'weekly',
          ALL_TIME: 'all-time',
          STREAKS: 'all-time',
        };
        const period = periodMap[filterTab] || 'all-time';
        const data = await api.getLeaderboard({ period, search: searchQuery, limit: 50 });
        if (isMounted && data.success && Array.isArray(data.top) && data.top.length > 0) {
          setApiRankings(data.top);
        }
      } catch (err) {
        // Fallback to local rankings on error
      }
    }

    fetchRankings();

    return () => {
      isMounted = false;
    };
  }, [isOpen, filterTab, searchQuery]);

  const sourceRankings = apiRankings.length > 0 ? apiRankings : FULL_RANKINGS;

  const currentRankings = sourceRankings.map((item) => {
    if (item.isCurrentUser || item.name?.includes('Alex Rivero')) {
      return {
        ...item,
        xp: userXp,
      };
    }
    return item;
  })
    .sort((a, b) => b.xp - a.xp)
    .map((item, idx) => ({
      ...item,
      rank: item.rank || idx + 1,
      medal: (item.rank || idx + 1) === 1 ? '🥇' : (item.rank || idx + 1) === 2 ? '🥈' : (item.rank || idx + 1) === 3 ? '🥉' : null,
      avatar: getUserAvatar(item, item.name),
    }));

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = currentRankings
    .filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.squad.toLowerCase().includes(searchQuery.toLowerCase())
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
            className="w-9 h-9 bg-white border-2 border-black rounded-lg font-mono font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e4006c] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filters & Search Row */}
        <div className="p-4 bg-white border-b-3 border-black flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex gap-2">
            {[
              { id: 'ALL_TIME', label: 'All Time' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'STREAKS', label: 'Top Streaks 🔥' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-space font-bold uppercase border-2 border-black rounded-lg transition-all ${
                  filterTab === tab.id
                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                    : 'bg-white hover:bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member or squad..."
              className="w-full px-3 py-1.5 bg-gray-50 border-2 border-black rounded-lg font-hanken text-xs focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-3">
          {filtered.map((item) => (
            <div
              key={item.rank}
              className={`p-3 md:p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4 transition-transform hover:-translate-y-0.5 ${
                item.isCurrentUser
                  ? 'bg-[#ffed00] border-black shadow-[6px_6px_0px_0px_rgba(228,0,108,1)]'
                  : 'bg-white'
              }`}
            >
              {/* Rank & User */}
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 text-center font-bricolage font-black text-lg text-black">
                  {item.medal || `#${item.rank}`}
                </span>
                <div className="w-12 h-12 shrink-0 border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                  <img
                    alt={item.name}
                    src={item.avatar}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Quester')}&background=FFED00&color=000&bold=true`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bricolage font-black text-base text-black truncate">
                      {item.name}
                    </h4>
                    {item.isCurrentUser && (
                      <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-space font-black rounded uppercase">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-space text-black/70">
                    <span>{item.squad}</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{item.streak}</span>
                  </div>
                </div>
              </div>

              {/* Badges & Stats */}
              <div className="flex items-center gap-3 shrink-0">
                {item.badge && (
                  <span className="hidden md:inline-block px-2.5 py-1 bg-[#bdf2ff] text-black border-2 border-black rounded-md font-space font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {item.badge}
                  </span>
                )}
                <div className="text-right font-space">
                  <p className="font-black text-sm text-black">{item.xp.toLocaleString()} XP</p>
                  <p className="text-[11px] font-bold text-black/60">{item.completedQuests} quests</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FullLeaderboardModal;
