import { useState, useEffect } from 'react';
import api from '../../services/api';

const PERSONAL_STATS = {
  totalQuests: 6,
  totalXp: '1,950 XP',
  currentRank: '#2',
  streakWeeks: 4,
  squadCount: 3,
};

const ALL_BADGES = [
  {
    id: 'badge-1',
    title: 'Summit Conqueror',
    category: 'ADVENTURE',
    icon: '🏔️',
    bg: 'bg-[#ffed00]',
    desc: 'Climbed 3,000m+ peak with Squad',
    unlockedAt: 'Oct 2026',
    locked: false,
  },
  {
    id: 'badge-2',
    title: 'Deep Sea Explorer',
    category: 'TRAVEL',
    icon: '🤿',
    bg: 'bg-[#bdf2ff]',
    desc: 'Completed open water ocean dive',
    unlockedAt: 'Aug 2026',
    locked: false,
  },
  {
    id: 'badge-3',
    title: 'First To Finish',
    category: 'SQUAD',
    icon: '⚡',
    bg: 'bg-[#b4f8c8]',
    desc: 'Completed group challenge ahead of squad',
    unlockedAt: 'Sep 2026',
    locked: false,
  },
  {
    id: 'badge-4',
    title: 'Streak Titan',
    category: 'CONSISTENCY',
    icon: '🔥',
    bg: 'bg-[#ffdad6]',
    desc: 'Logged adventure progress 4 weeks in a row',
    unlockedAt: 'Active Now',
    locked: false,
  },
  {
    id: 'badge-5',
    title: 'Master Chef',
    category: 'SKILLS',
    icon: '🍝',
    bg: 'bg-[#e0bbff]',
    desc: 'Cooked 5 international authentic recipes',
    unlockedAt: 'Jul 2026',
    locked: false,
  },
  {
    id: 'badge-6',
    title: 'Globe Trotter',
    category: 'TRAVEL',
    icon: '🌍',
    bg: 'bg-gray-100',
    desc: 'Visit 10 different provinces or territories',
    progress: '6 / 10',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-7',
    title: 'Marathon Legend',
    category: 'FITNESS',
    icon: '🏃',
    bg: 'bg-gray-100',
    desc: 'Complete an official 42.2km marathon race',
    progress: '21.1 / 42.2 km',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-8',
    title: 'Astro Nomad',
    category: 'ADVENTURE',
    icon: '🌌',
    bg: 'bg-gray-100',
    desc: 'Camp under 3 certified Dark Sky reserves',
    progress: '1 / 3',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-9',
    title: 'El Capitan',
    category: 'ADVENTURE',
    icon: '🧗',
    bg: 'bg-gray-100',
    desc: 'Conquer 15 multi-pitch rock climbing routes',
    progress: '8 / 15',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-10',
    title: 'Squad Vanguard',
    category: 'SQUAD',
    icon: '👑',
    bg: 'bg-gray-100',
    desc: 'Lead 5 squad expeditions from start to finish',
    progress: '3 / 5',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-11',
    title: 'Iron Will',
    category: 'CONSISTENCY',
    icon: '🛡️',
    bg: 'bg-gray-100',
    desc: 'Maintain a 12-week consecutive quest streak',
    progress: '4 / 12 w',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
  {
    id: 'badge-12',
    title: 'NatGeo Lens',
    category: 'CREATIVE',
    icon: '📸',
    bg: 'bg-gray-100',
    desc: 'Upload 50 high-resolution proof photos',
    progress: '28 / 50',
    unlockedAt: 'Locked 🔒',
    locked: true,
  },
];

// All 14 authentic conquests for Alex Rivero (Sum = 3,910 XP)
const COMPLETED_ITEMS = [
  {
    id: 'comp-1',
    postId: 1,
    title: 'First Solo Skydive from 15,000 ft',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Oct 24, 2026',
    image: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    stat: '15,000 ft • 60s Freefall',
    note: 'Heart was pounding like crazy at the exit door, but the freefall adrenaline was unmatched.',
    isPrivate: false,
    xp: 350,
  },
  {
    id: 'comp-2',
    postId: 101,
    title: 'Scuba Diving Ocean Reef Certification',
    category: 'TRAVEL',
    squad: 'Trip Squad ✈️',
    completedDate: 'Oct 10, 2026',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',
    stat: '18m Depth • 45m Dive',
    note: 'Swam alongside sea turtles and navigated vibrant coral pinnacles in crystal turquoise waters.',
    isPrivate: false,
    xp: 350,
  },
  {
    id: 'comp-3',
    postId: 102,
    title: 'High Altitude Summit: Mount Rainier (Camp Muir)',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Sep 28, 2026',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    stat: '10,080 ft • 9 hrs Trek',
    note: 'Navigated glacier snowfields with crampons and ice axes. The sunrise above cloud level was breathtaking.',
    isPrivate: false,
    xp: 400,
  },
  {
    id: 'comp-4',
    postId: 103,
    title: '100km Century Cycling Challenge',
    category: 'FITNESS',
    squad: 'Fitness Freaks 🏋️',
    completedDate: 'Sep 14, 2026',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80',
    stat: '102.4 km • 3h 48m',
    note: 'Pushed through strong coastal headwinds. Legs burned on the climbs, but crossed the line with adrenaline to spare.',
    isPrivate: false,
    xp: 300,
  },
  {
    id: 'comp-5',
    postId: 104,
    title: 'White Water Rafting Grade IV Rapids',
    category: 'ADVENTURE',
    squad: 'Trip Squad ✈️',
    completedDate: 'Aug 30, 2026',
    image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=80',
    stat: '24 km • Grade IV Rapids',
    note: 'Flipped once through the whirlpool canyon, but the squad pulled me right back into the raft!',
    isPrivate: false,
    xp: 300,
  },
  {
    id: 'comp-6',
    postId: 105,
    title: 'Desert Dunes Trek & Stargazing Camp',
    category: 'TRAVEL',
    squad: 'Personal Quest',
    completedDate: 'Aug 15, 2026',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&q=80',
    stat: '3 Days • 40km Dunes',
    note: 'Zero light pollution under the Milky Way. Cooked flatbreads over campfire embers with local guides.',
    isPrivate: false,
    xp: 250,
  },
];

function PersonalTrophyRoom({ refreshTrigger = 0 }) {
  const [stats, setStats] = useState(PERSONAL_STATS);
  const [badges, setBadges] = useState(ALL_BADGES);
  const [badgeFilter, setBadgeFilter] = useState('ALL'); // 'ALL' | 'UNLOCKED' | 'LOCKED'
  const [items, setItems] = useState(COMPLETED_ITEMS);
  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    api.getMyTrophyRoom(filterCategory)
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.badges) && data.badges.length > 0) setBadges(data.badges);
        if (Array.isArray(data.completedItems)) setItems(data.completedItems);
      })
      .catch((err) => {
        console.info('Using local trophy room cache:', err.message);
      });
    return () => { isMounted = false; };
  }, [filterCategory, refreshTrigger]);

  const togglePrivacy = async (id) => {
    const targetItem = items.find((it) => it.id === id);
    const newIsPrivate = !targetItem?.isPrivate;

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPrivate: newIsPrivate } : item))
    );

    if (targetItem?.postId) {
      try {
        await api.updatePostVisibility(targetItem.postId, newIsPrivate ? 'personal' : 'shared');
      } catch (e) {
        console.warn('Could not sync privacy to backend:', e.message);
      }
    }
  };

  const filteredItems =
    filterCategory === 'ALL'
      ? items
      : items.filter((item) => item.category?.toUpperCase().includes(filterCategory.toUpperCase()));

  const filteredBadges = badges.filter((b) => {
    if (badgeFilter === 'UNLOCKED') return !b.locked;
    if (badgeFilter === 'LOCKED') return b.locked;
    return true;
  });

  const unlockedCount = badges.filter((b) => !b.locked).length;

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
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6';
                }}
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

      {/* Unlocked Badges Trophy Cabinet (Sec 8 Gamification) */}
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
                <span>{b.locked ? 'Goal' : 'Unlocked'}</span>
                <span className={b.locked ? 'text-amber-800 font-black' : 'text-emerald-900 font-black'}>
                  {b.locked ? b.progress || 'Locked 🔒' : b.unlockedAt}
                </span>
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
            {['ALL', 'ADVENTURE', 'TRAVEL', 'FITNESS', 'SKILLS'].map((cat) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
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
                <div className="h-44 border-2 border-black rounded-lg overflow-hidden relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-100 group">
                  <img
                    alt={item.title}
                    src={item.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <span className="text-black/80 truncate max-w-[65%]">{item.stat}</span>
                <span className="px-2.5 py-1 bg-[#b4f8c8] text-black border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
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

