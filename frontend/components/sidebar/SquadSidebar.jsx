import { useState } from 'react';

const CATEGORIES = [
  { id: 'TRAVEL', label: 'Travel', emoji: '✈️', color: 'bg-brand-pink text-white', rotate: '-rotate-1' },
  { id: 'ADVENTURE', label: 'Adventure', emoji: '🧗', color: 'bg-brand-yellow text-black', rotate: 'rotate-1' },
  { id: 'SKILLS', label: 'Skills', emoji: '🎸', color: 'bg-brand-cyan text-black', rotate: '-rotate-2' },
  { id: 'FITNESS', label: 'Fitness', emoji: '🏃', color: 'bg-brand-lime text-black', rotate: 'rotate-2' },
  { id: 'CAREER', label: 'Career', emoji: '💼', color: 'bg-brand-purple text-black', rotate: '-rotate-1' },
];

const SQUAD_BG_COLORS = ['bg-brand-pink', 'bg-brand-cyan', 'bg-brand-lime', 'bg-brand-yellow', 'bg-brand-purple'];

const getSquadDisplayIcon = (squad) => {
  if (squad?.icon) return squad.icon;
  if (!squad?.name) return '👥';
  const match = squad.name.match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
  if (match) return match[0];
  return squad.name.trim().charAt(0).toUpperCase();
};

function SquadSidebar({
  squads = [],
  activeSquadId,
  onSelectSquad,
  selectedCategory = null,
  onSelectCategory,
  onAddGroupClick,
  categoryCounts = {},
  streak = 0,
  unlockedBadges = null,
}) {
  const [localSquad, setLocalSquad] = useState(activeSquadId);
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [failedAvatars, setFailedAvatars] = useState({});

  const currentSquad = activeSquadId !== undefined ? activeSquadId : localSquad;
  const activeCategory = selectedCategory !== undefined ? selectedCategory : localCategory;

  const handleSquadClick = (id) => {
    setLocalSquad(id);
    if (onSelectSquad) onSelectSquad(id);
  };

  const handleCategoryClick = (id) => {
    const next = activeCategory === id ? null : id;
    setLocalCategory(next);
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
          className="px-2 py-1 bg-brand-yellow font-mono text-xs font-black uppercase rounded brutal-border-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
        >
          + ADD GROUP
        </button>
      </div>

      {/* Squad Cards */}
      <div className="space-y-2.5">
        {squads.length === 0 ? (
          <div className="p-4 bg-neutral-50 brutal-border-sm rounded-lg text-center space-y-2">
            <p className="font-mono text-xs text-neutral-600 font-medium">No squads joined yet.</p>
            <button
              type="button"
              onClick={onAddGroupClick}
              className="text-xs font-mono font-black text-brand-pink underline hover:text-black cursor-pointer"
            >
              + Create or join your first squad
            </button>
          </div>
        ) : (
          squads.map((squad) => {
            const isActive = currentSquad === squad.id;
            const fallbackBg = SQUAD_BG_COLORS[Math.abs((squad.id || squad.name || '').length) % SQUAD_BG_COLORS.length];
            const hasImage = squad.avatar && !failedAvatars[squad.id];

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
                  <div className={`w-10 h-10 rounded-full brutal-border-sm ${squad.bgColor || fallbackBg} flex items-center justify-center text-black font-black text-sm overflow-hidden shrink-0`}>
                    {hasImage ? (
                      <img
                        alt={squad.name}
                        className="w-full h-full object-cover"
                        src={squad.avatar}
                        onError={() => setFailedAvatars((prev) => ({ ...prev, [squad.id]: true }))}
                      />
                    ) : (
                      <span className="text-base select-none leading-none">
                        {getSquadDisplayIcon(squad)}
                      </span>
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
          })
        )}
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
            const count = categoryCounts[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3 py-1.5 rounded-full brutal-border-sm text-xs font-mono font-bold shadow-brutal-sm flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer ${
                  isSelected ? 'bg-black text-white ring-2 ring-brand-yellow' : `${cat.color} ${cat.rotate}`
                }`}
              >
                <span>{cat.emoji} {cat.label}</span>
                {count != null && (
                  <span className={`px-1.5 rounded-full text-[10px] ${isSelected ? 'bg-white text-black font-black' : 'bg-black text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-3 bg-brand-canvas brutal-border-sm rounded-lg space-y-1">
        <div className="flex justify-between font-mono text-xs font-bold">
          <span>ACTIVE STREAK</span>
          <span className="text-brand-pink font-black">🔥 {streak > 0 ? `${streak} DAYS` : '0 DAYS'}</span>
        </div>
        {unlockedBadges && (
          <div className="flex justify-between font-mono text-xs font-bold">
            <span>UNLOCKED BADGES</span>
            <span>{unlockedBadges.unlocked} / {unlockedBadges.total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SquadSidebar;
