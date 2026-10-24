import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const RECAP_DATA = {
  year: '2026',
  totalQuests: 24,
  totalXp: '14,850',
  percentile: 'Top 3%',
  longestStreak: '8 Weeks 🔥',
  squadCount: 3,
  topSquad: 'Trip Squad ✈️',
  partnerInCrime: 'Elena Vance (@elena)',
  vibeDna: [
    { category: 'ADVENTURE', percent: 60, color: 'bg-brand-pink text-white', icon: '🏔️' },
    { category: 'TRAVEL', percent: 20, color: 'bg-brand-cyan text-black', icon: '✈️' },
    { category: 'SKILLS', percent: 15, color: 'bg-brand-yellow text-black', icon: '🍳' },
    { category: 'FITNESS', percent: 5, color: 'bg-brand-lime text-black', icon: '🏃' },
  ],
  goldenMoment: {
    title: 'Summit Mount Fuji at Sunrise 🏔️',
    date: 'October 24, 2026',
    stat: '3,776m Altitude • Dawn Summit',
    quote: 'Caught the golden morning rays above the clouds with 5 squad members by my side.',
    image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&q=80',
  },
};

/**
 * Step 12: YearEndRecapModal (Item 12 from Stitch Design System)
 *
 * Spotify-Wrapped style viral annual recap modal.
 * Features:
 *   - Tabbed narrative slides: 'Snapshot', 'Vibe DNA', 'Top Squad', 'Golden Memory'
 *   - Offset pop-art polaroid frames & Neo-Brutalist sticker badges
 *   - Category distribution progress breakdown
 *   - Social sharing actions: Copy Link, Download Snapshot, Share to Story
 *   - Rendered via createPortal(..., document.body)
 */
function YearEndRecapModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('SNAPSHOT'); // 'SNAPSHOT' | 'VIBE_DNA' | 'SQUAD' | 'MEMORY'
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/recap-2026?user=alex');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FFFDF5] border-4 border-black rounded-3xl shadow-[12px_12px_0px_0px_rgba(255,237,0,1)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Decorative Punch Holes */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <div className="w-3.5 h-3.5 rounded-full bg-black border-2 border-white shadow" />
          <div className="w-3.5 h-3.5 rounded-full bg-black border-2 border-white shadow" />
        </div>

        {/* Header Bar */}
        <div className="bg-brand-yellow px-6 py-5 border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 pl-6">
            <span className="w-10 h-10 bg-black text-brand-yellow border-2 border-black rounded-xl flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-6">
              🎁
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bricolage font-black text-xl md:text-2xl uppercase tracking-tight text-black">
                  {RECAP_DATA.year} Quest Wrapped
                </h2>
                <span className="px-2 py-0.5 bg-brand-pink text-white font-mono text-[10px] font-black rounded uppercase">
                  Viral Edition
                </span>
              </div>
              <p className="text-xs font-space font-bold text-black/80">
                Your annual adventure scoreboard & milestone highlights
              </p>
            </div>
          </div>

          <button
            id="recap-close-btn"
            type="button"
            onClick={onClose}
            className="w-9 h-9 bg-white border-2 border-black rounded-lg font-mono font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-brand-pink hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Chips */}
        <div className="bg-white border-b-3 border-black p-3 flex gap-2 overflow-x-auto shrink-0 justify-center">
          {[
            { id: 'SNAPSHOT', label: '📸 Snapshot' },
            { id: 'VIBE_DNA', label: '⚡ Vibe DNA' },
            { id: 'SQUAD', label: '🛡️ Top Squad' },
            { id: 'MEMORY', label: '🏔️ Best Memory' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`recap-tab-${tab.id.toLowerCase()}-btn`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg border-2 border-black font-space font-bold text-xs uppercase transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {activeTab === 'SNAPSHOT' && (
            /* ────── TAB 1: SNAPSHOT POSTER ────── */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Highlight Hero Card */}
              <div className="p-6 bg-brand-yellow brutal-border rounded-2xl shadow-brutal space-y-4 text-black relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase tracking-wider bg-black text-white px-2.5 py-1 rounded">
                    ANNUAL SCOREBOARD
                  </span>
                  <span className="font-mono text-xs font-bold bg-white text-black px-2 py-1 rounded brutal-border-sm">
                    {RECAP_DATA.percentile} Quester
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bricolage font-black text-4xl md:text-5xl leading-none">
                    {RECAP_DATA.totalQuests} Quests
                  </h3>
                  <p className="font-space font-bold text-base text-black/80">
                    Conquered in {RECAP_DATA.year} across {RECAP_DATA.squadCount} Squads
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white brutal-border-sm rounded-xl">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">XP Banked</p>
                    <p className="font-mono text-lg font-black text-brand-pink">+{RECAP_DATA.totalXp} XP</p>
                  </div>
                  <div className="p-3 bg-white brutal-border-sm rounded-xl">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Longest Streak</p>
                    <p className="font-mono text-lg font-black text-black">{RECAP_DATA.longestStreak}</p>
                  </div>
                  <div className="p-3 bg-white brutal-border-sm rounded-xl col-span-2 sm:col-span-1">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Top Tribe</p>
                    <p className="font-mono text-sm font-black text-black truncate">{RECAP_DATA.topSquad}</p>
                  </div>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="space-y-2">
                <p className="font-mono text-xs font-black uppercase text-neutral-700">
                  BADGES MINTED THIS YEAR
                </p>
                <div className="flex flex-wrap gap-2">
                  {['🏔️ Summit Conqueror', '⚡ First To Finish', '🔥 Streak Titan', '🍝 Master Chef', '🤿 Ocean Pioneer'].map(
                    (b, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-white border-2 border-black rounded-lg font-space font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform"
                      >
                        {b}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'VIBE_DNA' && (
            /* ────── TAB 2: VIBE DNA ────── */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 bg-white brutal-border-sm rounded-xl space-y-4 shadow-brutal-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bricolage font-black text-2xl uppercase">
                    Your Quest Personality
                  </h3>
                  <span className="px-2 py-1 bg-brand-pink text-white font-mono text-xs font-black rounded brutal-border-sm">
                    THRILL SEEKER 🧗
                  </span>
                </div>
                <p className="font-hanken text-xs text-neutral-700 font-medium">
                  You lean heavily into physical challenges and world exploration, pushing your squad forward when terrain gets steep.
                </p>

                {/* Progress Visual Bars */}
                <div className="space-y-3 pt-2">
                  {RECAP_DATA.vibeDna.map((v) => (
                    <div key={v.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                        <span>
                          {v.icon} {v.category}
                        </span>
                        <span>{v.percent}%</span>
                      </div>
                      <div className="w-full h-4 bg-neutral-200 brutal-border-sm rounded-full overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full ${v.color.split(' ')[0]}`}
                          style={{ width: `${v.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SQUAD' && (
            /* ────── TAB 3: TOP SQUAD ────── */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 bg-brand-cyan brutal-border rounded-xl shadow-brutal space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase bg-black text-white px-2.5 py-1 rounded">
                    MVP SQUAD OF 2026
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-800">
                    12 Joint Quests
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-3 border-black overflow-hidden bg-white shadow-brutal-sm shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1528127269322-539801943592?w=150&q=80"
                      alt="Trip Squad"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bricolage font-black text-2xl uppercase text-black">
                      {RECAP_DATA.topSquad}
                    </h3>
                    <p className="font-hanken text-xs font-bold text-black/80">
                      Co-adventurer MVP: {RECAP_DATA.partnerInCrime}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white brutal-border-sm rounded-lg text-xs font-hanken text-neutral-800 font-medium">
                  "Together we crossed mountain summits, logged night cardio runs, and never let a weekend go to waste."
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MEMORY' && (
            /* ────── TAB 4: GOLDEN POLAROID ────── */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Polaroid Card */}
              <div className="p-5 bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3 -rotate-1 hover:rotate-0 transition-transform">
                <div className="relative h-60 w-full border-3 border-black rounded-xl overflow-hidden bg-black">
                  <img
                    src={RECAP_DATA.goldenMoment.image}
                    alt={RECAP_DATA.goldenMoment.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-brand-yellow border-2 border-black rounded font-space font-black text-[10px] uppercase shadow">
                    ⭐ MEMORY OF THE YEAR
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bricolage font-black text-lg text-black">
                      {RECAP_DATA.goldenMoment.title}
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-neutral-500">
                      {RECAP_DATA.goldenMoment.date}
                    </span>
                  </div>
                  <p className="font-hanken text-xs text-neutral-700 italic">
                    "{RECAP_DATA.goldenMoment.quote}"
                  </p>
                  <div className="pt-2">
                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] font-mono font-bold text-neutral-600 border border-neutral-300">
                      {RECAP_DATA.goldenMoment.stat}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Share Actions Strip ───────────────────────────── */}
          <div className="pt-4 border-t-3 border-black space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="recap-copy-link-btn"
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-4 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 font-space font-black uppercase text-xs brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-black"
              >
                <span>{copiedLink ? '✅ Link Copied!' : '🔗 Copy Recap Story Link'}</span>
              </button>

              <button
                id="recap-download-btn"
                type="button"
                onClick={handleDownload}
                className="py-3 px-4 bg-black hover:bg-neutral-800 text-white active:translate-x-0.5 active:translate-y-0.5 font-space font-black uppercase text-xs brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{downloadSuccess ? '📸 Saved to Camera Roll!' : '📸 Download Snapshot'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default YearEndRecapModal;
