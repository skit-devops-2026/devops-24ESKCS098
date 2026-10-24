const CHALLENGE = {
  title: '2024 Squad Trek: All 5 Members Summit Mt. Fuji! 🏔️',
  description: 'Shared milestone challenge! Complete collective altitude checkpoints, gear prep checks, and log team cardio endurance runs.',
  squad: 'TRIP SQUAD',
  daysLeft: 14,
  overallPercent: 80,
  completedCount: 4,
  totalCount: 5,
  reward: { xp: 1000, badge: 'Summit Conqueror', badgeDesc: 'Legendary badge added to squad trophy cabinet upon 5/5 check-in.' },
  members: [
    { name: 'Elena', avatar: 'https://ui-avatars.com/api/?name=EV&background=FFED00&color=000&bold=true', done: true },
    { name: 'Jordan', avatar: 'https://ui-avatars.com/api/?name=JS&background=BDF2FF&color=000&bold=true', done: true },
    { name: 'Alex', avatar: 'https://ui-avatars.com/api/?name=AR&background=E4006C&color=fff&bold=true', done: true },
    { name: 'Sarah', avatar: 'https://ui-avatars.com/api/?name=SC&background=B4F8C8&color=000&bold=true', done: true },
    { name: 'Marco', initials: 'MO', done: false, step: 3 },
  ],
};

function GroupChallengeBanner({ challenge = CHALLENGE, onLogCheckpoint, onOpenDiscussion }) {
  return (
    <div className="relative bg-brand-yellow brutal-border-lg rounded-xl p-6 md:p-8 shadow-brutal-xl overflow-hidden">
      {/* Decorative Punch Holes */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="punch-hole" />
        <div className="punch-hole" />
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="punch-hole" />
        <div className="punch-hole" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        {/* Left Content */}
        <div className="lg:col-span-7 space-y-4">
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="sticker-badge bg-black text-white px-3 py-1 rounded text-xs brutal-border-sm -rotate-2">
              ACTIVE SQUAD QUEST 🔥
            </span>
            <span className="sticker-badge bg-brand-pink text-white px-3 py-1 rounded text-xs brutal-border-sm rotate-1 shadow-brutal-sm">
              ⏳ {challenge.daysLeft} DAYS LEFT
            </span>
            <span className="sticker-badge bg-white text-black px-2.5 py-1 rounded text-xs brutal-border-sm">
              {challenge.squad}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-black text-2xl md:text-4xl leading-tight">
            {challenge.title}
          </h3>
          <p className="font-body text-sm md:text-base font-medium text-brand-ink/90">
            {challenge.description}
          </p>

          {/* Progress Section */}
          <div className="space-y-3 pt-2">
            {/* Overall Progress Bar */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono font-bold mb-1">
                <span>TEAM OVERALL SUMMIT COMPLETION</span>
                <span className="text-sm bg-black text-white px-2 py-0.5 rounded">
                  {challenge.overallPercent}% REACHED
                </span>
              </div>
              <div className="w-full h-6 bg-white brutal-border-sm rounded-lg overflow-hidden p-0.5 shadow-brutal-sm">
                <div
                  className="h-full bg-brand-pink brutal-border-sm rounded flex items-center justify-end px-2 transition-all duration-500"
                  style={{ width: `${challenge.overallPercent}%` }}
                >
                  <span className="font-mono text-[10px] font-black text-white">
                    {challenge.completedCount} / {challenge.totalCount} FINISHED
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Member Progress Avatars */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="font-mono text-xs font-bold">SQUAD PROGRESS:</span>
              <div className="flex -space-x-2">
                {challenge.members.map((m) => (
                  <div key={m.name} className="relative group">
                    {m.avatar ? (
                      <img
                        alt={m.name}
                        className="w-10 h-10 rounded-full brutal-border-sm object-cover"
                        src={m.avatar}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full brutal-border-sm bg-white flex items-center justify-center font-black text-xs font-mono">
                        {m.initials}
                      </div>
                    )}
                    {m.done ? (
                      <span className="absolute -bottom-1 -right-1 bg-brand-lime text-black rounded-full w-5 h-5 flex items-center justify-center font-black text-xs brutal-border-sm">
                        ✓
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 bg-brand-pink text-white rounded-full w-5 h-5 flex items-center justify-center font-black text-xs brutal-border-sm animate-pulse">
                        !
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {challenge.members.find((m) => !m.done) && (
                <span className="text-xs font-mono font-bold text-black/70 ml-2">
                  {challenge.members.find((m) => !m.done).name} is on Step {challenge.members.find((m) => !m.done).step}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Reward Card */}
        <div className="lg:col-span-5 bg-white brutal-border-lg rounded-xl p-5 shadow-brutal space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <span className="font-mono text-xs font-bold text-neutral-500 uppercase">QUEST REWARD POOL</span>
            <span className="sticker-badge bg-brand-lime text-black px-2 py-0.5 rounded text-xs brutal-border-sm font-mono">
              +{challenge.reward.xp} XP EACH
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-cyan brutal-border-sm rounded-lg flex items-center justify-center text-3xl shadow-brutal-sm -rotate-3">
              🏆
            </div>
            <div>
              <h4 className="font-display font-black text-lg">"{challenge.reward.badge}"</h4>
              <p className="font-body text-xs text-neutral-600">{challenge.reward.badgeDesc}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onLogCheckpoint}
              className="flex-1 py-3 px-4 bg-brand-pink text-white font-display font-black text-sm uppercase rounded brutal-border-sm shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center"
            >
              Log Checkpoint 🚀
            </button>
            <button
              type="button"
              onClick={onOpenDiscussion}
              className="py-3 px-3 bg-brand-canvas text-black font-display font-black text-sm uppercase rounded brutal-border-sm shadow-brutal hover:bg-neutral-100 transition-all"
              title="Quest Discussion"
            >
              <span className="material-symbols-outlined text-base">forum</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupChallengeBanner;
