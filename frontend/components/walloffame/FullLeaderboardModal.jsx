import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const FULL_RANKINGS = [
  {
    rank: 1,
    medal: '🥇',
    name: 'Elena Vance',
    squad: 'Trip Squad',
    completedQuests: 19,
    xp: 4250,
    badge: '🚀 Most Adventurous',
    streak: '8w 🔥',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9',
  },
  {
    rank: 2,
    medal: '🥈',
    name: 'Alex Rivero (You)',
    squad: 'Trip Squad',
    completedQuests: 14,
    xp: 3910,
    badge: '⚡ First to Finish',
    streak: '4w 🔥',
    isCurrentUser: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
  },
  {
    rank: 3,
    medal: '🥉',
    name: 'Priya Sharma',
    squad: 'College Gang',
    completedQuests: 15,
    xp: 3640,
    badge: '🏍️ Nomad Rider',
    streak: '6w 🔥',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
  },
  {
    rank: 4,
    name: 'Sarah Chen',
    squad: 'Trip Squad',
    completedQuests: 12,
    xp: 3100,
    badge: '🎨 Craft Specialist',
    streak: '3w 🔥',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  },
  {
    rank: 5,
    name: 'Marco Polo',
    squad: 'Trip Squad',
    completedQuests: 11,
    xp: 2950,
    badge: '🍝 Master Chef',
    streak: '5w 🔥',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
  },
  {
    rank: 6,
    name: 'Jordan Smith',
    squad: 'Fitness Freaks',
    completedQuests: 10,
    xp: 2600,
    badge: '🏃 100k Club',
    streak: '2w 🔥',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
  },
  {
    rank: 7,
    name: 'Riya Sharma',
    squad: 'College Gang',
    completedQuests: 9,
    xp: 2420,
    badge: '📸 Best Storyteller',
    streak: '4w 🔥',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&q=80',
  },
];

function FullLeaderboardModal({ isOpen, onClose }) {
  const [filterTab, setFilterTab] = useState('ALL_TIME');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = FULL_RANKINGS.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.squad.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <img alt={item.name} src={item.avatar} className="w-full h-full object-cover" />
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
