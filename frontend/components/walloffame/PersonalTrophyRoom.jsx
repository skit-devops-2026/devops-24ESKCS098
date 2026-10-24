import { useState } from 'react';

const PERSONAL_STATS = {
  totalQuests: 14,
  totalXp: '3,850 XP',
  currentRank: '#42',
  streakWeeks: 4,
  squadCount: 3,
};

const UNLOCKED_BADGES = [
  {
    id: 'badge-1',
    title: 'Summit Conqueror',
    category: 'ADVENTURE',
    icon: '🏔️',
    bg: 'bg-[#ffed00]',
    desc: 'Climbed 3,000m+ peak with Squad',
    unlockedAt: 'Oct 2026',
  },
  {
    id: 'badge-2',
    title: 'Deep Sea Explorer',
    category: 'TRAVEL',
    icon: '🤿',
    bg: 'bg-[#bdf2ff]',
    desc: 'Completed open water ocean dive',
    unlockedAt: 'Aug 2026',
  },
  {
    id: 'badge-3',
    title: 'First To Finish',
    category: 'SQUAD',
    icon: '⚡',
    bg: 'bg-[#b4f8c8]',
    desc: 'Completed group challenge ahead of squad',
    unlockedAt: 'Sep 2026',
  },
  {
    id: 'badge-4',
    title: 'Streak Titan',
    category: 'CONSISTENCY',
    icon: '🔥',
    bg: 'bg-[#ffdad6]',
    desc: 'Logged adventure progress 4 weeks in a row',
    unlockedAt: 'Active Now',
  },
  {
    id: 'badge-5',
    title: 'Master Chef',
    category: 'SKILLS',
    icon: '🍝',
    bg: 'bg-[#e0bbff]',
    desc: 'Cooked 5 international authentic recipes',
    unlockedAt: 'Jul 2026',
  },
];

const COMPLETED_ITEMS = [
  {
    id: 'comp-1',
    title: 'First Solo Skydive from 15,000 ft',
    category: 'ADVENTURE',
    squad: 'Trip Squad',
    completedDate: 'Oct 24, 2026',
    image: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    stat: '15,000 ft • 60s Freefall',
    note: 'Heart was pounding like crazy at the exit door, but the freefall adrenaline was unmatched.',
    isPrivate: false,
    xp: 350,
  },
  {
    id: 'comp-2',
    title: 'Solo Bike Odyssey to Ladakh (Khardung La)',
    category: 'TRAVEL',
    squad: 'Personal Quest',
    completedDate: 'Sep 18, 2026',
    image: 'https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg',
    stat: '900 km • 7 days',
    note: 'Overcame cold weather and thin air. The mountain passes changed my perspective on resilience.',
    isPrivate: false,
    xp: 500,
  },
  {
    id: 'comp-3',
    title: 'Run a Half Marathon under 2 hours',
    category: 'FITNESS',
    squad: 'Fitness Freaks',
    completedDate: 'Aug 12, 2026',
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80',
    stat: '21.1 km • 1h 54m',
    note: 'Trained for 16 weeks through monsoon rain. Crossed the finish line with energy to spare.',
    isPrivate: true,
    xp: 400,
  },
];

function PersonalTrophyRoom() {
  const [items, setItems] = useState(COMPLETED_ITEMS);
  const [filterCategory, setFilterCategory] = useState('ALL');

  const togglePrivacy = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPrivate: !item.isPrivate } : item))
    );
  };

  const filteredItems =
    filterCategory === 'ALL'
      ? items
      : items.filter((item) => item.category === filterCategory);

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      {/* Top Banner / User Passport Header */}
      <div className="p-6 md:p-8 bg-brand-yellow border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 border-3 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
              <img
                alt="Alex Avatar"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bricolage font-black text-2xl md:text-3xl uppercase tracking-tight text-black">
                  Alex Rivero's Trophy Room
                </h2>
                <span className="px-2.5 py-1 bg-black text-white font-space font-black text-xs rounded uppercase">
                  Level 8
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
              <p className="font-bricolage font-black text-2xl text-black">{PERSONAL_STATS.totalQuests}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Total XP</p>
              <p className="font-bricolage font-black text-xl text-[#b60055]">{PERSONAL_STATS.totalXp}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Global Rank</p>
              <p className="font-bricolage font-black text-2xl text-black">{PERSONAL_STATS.currentRank}</p>
            </div>
            <div className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
              <p className="font-space font-bold text-[11px] uppercase text-black/60">Streak</p>
              <p className="font-bricolage font-black text-2xl text-amber-600">
                {PERSONAL_STATS.streakWeeks}w 🔥
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Badges Trophy Cabinet (Sec 8 Gamification) */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-5">
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
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
          <span className="font-space font-bold text-xs bg-[#b4f8c8] px-3 py-1 border-2 border-black rounded-full">
            5 / 12 Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
          {UNLOCKED_BADGES.map((b) => (
            <div
              key={b.id}
              className={`p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${b.bg} flex flex-col justify-between hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">{b.icon}</span>
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
                <span>Unlocked</span>
                <span>{b.unlockedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Completed Quests Archive */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bricolage font-black text-2xl uppercase tracking-tight text-black">
              Conquered Quests Log ({filteredItems.length})
            </h3>
            <p className="font-hanken text-xs text-black/70">
              Control privacy visibility per quest and inspect your photo proofs.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 font-space text-xs font-bold uppercase">
            {['ALL', 'ADVENTURE', 'TRAVEL', 'FITNESS'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 border-2 border-black rounded-lg transition-all ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border-3 border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between gap-4 hover:-translate-y-1 transition-transform"
            >
              <div className="space-y-3">
                {/* Meta row */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#bdf2ff] text-black border-2 border-black rounded font-space font-bold text-[11px] uppercase">
                    {item.category}
                  </span>

                  {/* Privacy Toggle (Sec 11 Privacy Controls) */}
                  <button
                    type="button"
                    onClick={() => togglePrivacy(item.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded text-[11px] font-space font-bold cursor-pointer transition-colors ${
                      item.isPrivate ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                    }`}
                    title="Click to toggle Public / Private"
                  >
                    <span>{item.isPrivate ? '🔒 Private' : '🌐 Group Visible'}</span>
                  </button>
                </div>

                {/* Proof Image */}
                <div className="h-44 border-2 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100">
                  <img
                    alt={item.title}
                    src={item.image}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces';
                    }}
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 text-white rounded text-[10px] font-space font-bold">
                    {item.completedDate}
                  </span>
                </div>

                <h4 className="font-bricolage font-black text-lg text-black leading-snug">
                  {item.title}
                </h4>

                <p className="font-hanken text-xs text-black/75 line-clamp-3 italic">
                  "{item.note}"
                </p>
              </div>

              {/* Bottom Stat & XP */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs font-space font-bold">
                <span className="text-black/80">{item.stat}</span>
                <span className="px-2 py-0.5 bg-[#b4f8c8] text-black border border-black rounded">
                  +{item.xp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PersonalTrophyRoom;
