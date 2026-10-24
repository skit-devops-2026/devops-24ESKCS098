import { useState } from 'react';

const SQUADS = [
  {
    id: 'trip-squad',
    name: 'Trip Squad ✈️',
    members: 6,
    activeQuests: 12,
    unreadCount: 3,
    avatar: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=150&q=80',
    bgColor: 'bg-brand-pink',
  },
  {
    id: 'college-gang',
    name: 'College Gang 🎓',
    members: 4,
    activeQuests: 5,
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&q=80',
    bgColor: 'bg-brand-cyan',
  },
  {
    id: 'family-adventure',
    name: 'Family Adventure 🏡',
    members: 5,
    activeQuests: 8,
    unreadCount: 0,
    avatar: null,
    icon: '🏡',
    bgColor: 'bg-brand-lime',
  },
];

const CATEGORIES = [
  { id: 'TRAVEL', label: 'Travel', emoji: '✈️', count: 8, color: 'bg-brand-pink text-white', rotate: '-rotate-1' },
  { id: 'ADVENTURE', label: 'Adventure', emoji: '🧗', count: 5, color: 'bg-brand-yellow text-black', rotate: 'rotate-1' },
  { id: 'SKILLS', label: 'Skills', emoji: '🎸', count: 4, color: 'bg-brand-cyan text-black', rotate: '-rotate-2' },
  { id: 'FITNESS', label: 'Fitness', emoji: '🏃', count: 9, color: 'bg-brand-lime text-black', rotate: 'rotate-2' },
  { id: 'CAREER', label: 'Career', emoji: '💼', count: 2, color: 'bg-brand-purple text-black', rotate: '-rotate-1' },
];

function SquadSidebar({ activeSquadId = 'trip-squad', onSelectSquad, selectedCategory = null, onSelectCategory, onAddGroupClick }) {
  const [currentSquad, setCurrentSquad] = useState(activeSquadId);
  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  const handleSquadClick = (id) => {
    setCurrentSquad(id);
    if (onSelectSquad) onSelectSquad(id);
  };

  const handleCategoryClick = (id) => {
    const next = activeCategory === id ? null : id;
    setActiveCategory(next);
    if (onSelectCategory) onSelectCategory(next);
  };

  return (
    <div className="w-full bg-white brutal-border-lg rounded-xl p-5 shadow-brutal-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl">diversity_3</span>
          <h3 className="font-display font-black text-lg tracking-tight">MY SQUADS</h3>
        </div>
        <button
          type="button"
          onClick={onAddGroupClick}
          className="px-2 py-1 bg-brand-yellow font-mono text-xs font-black uppercase rounded brutal-border-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          + ADD GROUP
        </button>
      </div>

      {/* Squad Cards */}
      <div className="space-y-2.5">
        {SQUADS.map((squad) => {
          const isActive = currentSquad === squad.id;
          return (
            <div
              key={squad.id}
              onClick={() => handleSquadClick(squad.id)}
              className={`p-3 brutal-border-sm rounded-lg shadow-brutal-sm flex items-center justify-between cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-brand-yellow shadow-brutal'
                  : 'bg-white hover:bg-neutral-50 hover:translate-x-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full brutal-border-sm ${squad.bgColor} flex items-center justify-center text-black font-black text-sm overflow-hidden shrink-0`}>
                  {squad.avatar ? (
                    <img alt={squad.name} className="w-full h-full object-cover" src={squad.avatar} />
                  ) : (
                    <span>{squad.icon}</span>
                  )}
                </div>
                <div>
                  <div className="font-display font-black text-sm leading-tight">{squad.name}</div>
                  <div className="font-mono text-[11px] text-neutral-700">
                    {squad.members} Members • {squad.activeQuests} Active
                  </div>
                </div>
              </div>

              {squad.unreadCount > 0 && (
                <span className={`w-6 h-6 rounded-full brutal-border-sm font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-brand-pink text-white' : 'bg-brand-yellow text-black'
                }`}>
                  {squad.unreadCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="pt-4 border-t-2 border-black space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase text-neutral-500">QUEST CATEGORIES</span>
          {activeCategory && (
            <button
              type="button"
              onClick={() => handleCategoryClick(activeCategory)}
              className="text-[11px] font-mono text-brand-pink font-bold hover:underline"
            >
              RESET
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3 py-1.5 rounded-full brutal-border-sm text-xs font-mono font-bold shadow-brutal-sm flex items-center gap-1.5 hover:scale-105 transition-transform ${
                  isSelected ? 'bg-black text-white ring-2 ring-brand-yellow' : `${cat.color} ${cat.rotate}`
                }`}
              >
                <span>{cat.emoji} {cat.label}</span>
                <span className={`px-1.5 rounded-full text-[10px] ${isSelected ? 'bg-white text-black font-black' : 'bg-black text-white'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-3 bg-brand-canvas brutal-border-sm rounded-lg space-y-1">
        <div className="flex justify-between font-mono text-xs font-bold">
          <span>ACTIVE STREAK</span>
          <span className="text-brand-pink font-black">🔥 12 DAYS</span>
        </div>
        <div className="flex justify-between font-mono text-xs font-bold">
          <span>UNLOCKED BADGES</span>
          <span>18 / 30</span>
        </div>
      </div>
    </div>
  );
}

export default SquadSidebar;
