import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Yearly retrospective modal showcasing milestone highlights, squad achievements,
 * and personal quester stats in a slide-by-slide recap.
 */
function YearEndRecapModal({ isOpen, onClose, userStats = null }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('SNAPSHOT'); // 'SNAPSHOT' | 'VIBE_DNA' | 'SQUAD' | 'MEMORY'
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const year = '2026';
  const userName = currentUser?.name || 'Explorer';
  const totalQuests = userStats?.totalQuests ?? (currentUser?.completed_quests ?? 0);
  const totalXp = currentUser?.xp ? Number(currentUser.xp).toLocaleString() : '0';
  const streak = currentUser?.streak ? `${currentUser.streak} Days 🔥` : 'Active 🔥';
  const vibe = currentUser?.vibe || 'ADVENTURER 🧗';
  const topSquad = userStats?.topSquad || 'Squad Crew 🛡️';

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const handle = currentUser?.email ? currentUser.email.split('@')[0] : 'me';
    navigator.clipboard.writeText(`${window.location.origin}/trophy-room?user=${encodeURIComponent(handle)}`);
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
                  {year} Quest Wrapped
                </h2>
                <span className="px-2 py-0.5 bg-brand-pink text-white font-mono text-[10px] font-black rounded uppercase">
                  Viral Edition
                </span>
              </div>
              <p className="text-xs font-space font-bold text-black/80">
                {userName}'s annual adventure scoreboard & milestone highlights
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
                    {vibe}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bricolage font-black text-4xl md:text-5xl leading-none">
                    {totalQuests} Quests
                  </h3>
                  <p className="font-space font-bold text-base text-black/80">
                    Conquered in {year} by {userName}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white brutal-border-sm rounded-xl">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">XP Banked</p>
                    <p className="font-mono text-lg font-black text-brand-pink">+{totalXp} XP</p>
                  </div>
                  <div className="p-3 bg-white brutal-border-sm rounded-xl">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Active Streak</p>
                    <p className="font-mono text-lg font-black text-black">{streak}</p>
                  </div>
                  <div className="p-3 bg-white brutal-border-sm rounded-xl col-span-2 sm:col-span-1">
                    <p className="font-mono text-[10px] font-bold text-neutral-500 uppercase">Top Tribe</p>
                    <p className="font-mono text-sm font-black text-black truncate">{topSquad}</p>
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
                    {vibe}
                  </span>
                </div>
                <p className="font-hanken text-xs text-neutral-700 font-medium">
                  You lean into adventure challenges and community exploration, pushing forward with your squad whenever a new milestone opens.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'SQUAD' && (
            /* ────── TAB 3: TOP SQUAD ────── */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 bg-brand-cyan brutal-border rounded-xl shadow-brutal space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase bg-black text-white px-2.5 py-1 rounded">
                    SQUAD VANGUARD
                  </span>
                  <span className="font-mono text-xs font-bold text-neutral-800">
                    Joint Quests
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl border-3 border-black overflow-hidden bg-white shadow-brutal-sm shrink-0 flex items-center justify-center text-3xl">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bricolage font-black text-2xl uppercase text-black">
                      {topSquad}
                    </h3>
                    <p className="font-hanken text-xs font-bold text-black/80">
                      Co-adventurer Squad
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white brutal-border-sm rounded-lg text-xs font-hanken text-neutral-800 font-medium">
                  "Tackle shared milestones together, log checkpoints, and never leave an adventure unfinished."
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
                    src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800&q=80"
                    alt="Memory highlight"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 bg-brand-yellow border-2 border-black rounded font-space font-black text-[10px] uppercase shadow">
                    ⭐ MEMORY OF THE YEAR
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bricolage font-black text-lg text-black">
                      Summit Sunrise Expedition 🏔️
                    </h4>
                    <span className="font-mono text-[11px] font-bold text-neutral-500">
                      Season 2026
                    </span>
                  </div>
                  <p className="font-hanken text-xs text-neutral-700 italic">
                    "Caught the morning rays above the clouds with squad members by my side."
                  </p>
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
