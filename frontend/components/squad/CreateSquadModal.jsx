import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const COVER_PRESETS = [
  {
    id: 'fuji',
    label: 'Mt. Fuji',
    url: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=500&q=80',
  },
  {
    id: 'bali',
    label: 'Tropical Wave',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80',
  },
  {
    id: 'alps',
    label: 'Alpine Hike',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80',
  },
  {
    id: 'city',
    label: 'Neon Tokyo',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&q=80',
  },
];

const CATEGORIES = [
  { id: 'TRAVEL', label: 'Travel', emoji: '✈️' },
  { id: 'ADVENTURE', label: 'Adventure', emoji: '🧗' },
  { id: 'SKILLS', label: 'Skills', emoji: '🎸' },
  { id: 'FITNESS', label: 'Fitness', emoji: '🏃' },
  { id: 'FOODIE', label: 'Foodie', emoji: '🍕' },
];

function CreateSquadModal({ isOpen, onClose, onCreateSquad, onJoinSquad }) {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [step, setStep] = useState(1);
  const [squadName, setSquadName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('TRAVEL');
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0].url);
  const [isPrivate, setIsPrivate] = useState(true);

  // Join squad state
  const [enterJoinCode, setEnterJoinCode] = useState('');
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // Step 2 generated code
  const [joinCode, setJoinCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createdSquad, setCreatedSquad] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode('create');
      setStep(1);
      setEnterJoinCode('');
      setJoinError(null);
      setCreateError(null);
      setCreateLoading(false);
      setCreatedSquad(null);
      setCopiedCode(false);
      setCopiedLink(false);
      // Generate a cool join code like LQ-8492
      const randomCode = `LQ-${Math.floor(1000 + Math.random() * 9000)}`;
      setJoinCode(randomCode);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!squadName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      if (onCreateSquad) {
        const res = await onCreateSquad({
          name: squadName.trim(),
          description: description.trim(),
          joinCode,
          category,
          coverUrl: selectedCover,
          isPrivate,
        });
        if (res && (res.joinCode || res.join_code)) {
          setJoinCode(res.joinCode || res.join_code);
          setCreatedSquad(res);
        }
      }
      setStep(2);
    } catch (err) {
      setCreateError(err.message || 'Failed to create squad. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://lifequest.app/join/${joinCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFinish = () => {
    onClose();
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!enterJoinCode.trim()) return;
    setJoinSubmitting(true);
    setJoinError(null);
    try {
      if (onJoinSquad) {
        await onJoinSquad(enterJoinCode.trim());
      }
      onClose();
    } catch (err) {
      setJoinError(err.message || 'Failed to join squad. Check code and try again.');
    } finally {
      setJoinSubmitting(false);
    }
  };

  const shareUrl = `https://lifequest.app/join/${joinCode}`;
  const shareText = `Join my squad "${squadName || 'New Squad'}" on LifeQuest! Join Code: ${joinCode}`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-brand-canvas brutal-border-lg rounded-2xl shadow-brutal-xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-brand-cyan p-4 border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="sticker-badge bg-black text-brand-yellow px-2.5 py-1 text-xs rounded brutal-border-sm -rotate-2">
              SQUAD PROTOCOL ⚡
            </span>
            <span className="font-mono text-xs font-black text-neutral-800">
              {mode === 'join' ? 'JOIN BY CODE' : step === 1 ? 'STEP 1 OF 2' : 'STEP 2 OF 2'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-brand-pink text-white font-black text-sm flex items-center justify-center rounded brutal-border-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs (Create vs Join) */}
        {onJoinSquad && (
          <div className="grid grid-cols-2 bg-neutral-100 border-b-2 border-black font-mono text-xs font-black">
            <button
              type="button"
              onClick={() => { setMode('create'); setJoinError(null); }}
              className={`py-2.5 text-center transition-colors cursor-pointer border-r-2 border-black ${
                mode === 'create'
                  ? 'bg-brand-yellow text-black font-extrabold shadow-inner'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              ✨ CREATE SQUAD
            </button>
            <button
              type="button"
              onClick={() => { setMode('join'); setJoinError(null); }}
              className={`py-2.5 text-center transition-colors cursor-pointer ${
                mode === 'join'
                  ? 'bg-brand-cyan text-black font-extrabold shadow-inner'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              🔑 JOIN WITH CODE
            </button>
          </div>
        )}

        {/* ── Mode: JOIN SQUAD ── */}
        {mode === 'join' && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-neutral-900">
                Join An Existing Squad
              </h2>
              <p className="font-hanken text-xs text-neutral-600">
                Enter the secret squad join code provided by your squad admin (e.g. LQ-TRIP).
              </p>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                  Secret Join Code <span className="text-brand-pink">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LQ-TRIP or LQ-8492"
                  value={enterJoinCode}
                  onChange={(e) => {
                    setEnterJoinCode(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  className="w-full px-4 py-3 bg-white brutal-border-sm rounded-lg font-mono font-bold text-base tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brand-cyan shadow-brutal-sm placeholder:tracking-normal placeholder:font-sans"
                />
                {joinError && (
                  <p className="text-xs font-mono text-red-600 font-bold bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ {joinError}
                  </p>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl font-space font-bold text-sm bg-neutral-200 hover:bg-neutral-300 text-black border-2 border-black transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinSubmitting || !enterJoinCode.trim()}
                  className="flex-1 py-3 px-6 rounded-xl font-space font-black text-sm uppercase bg-brand-cyan hover:bg-[#a6ecfc] active:translate-x-0.5 active:translate-y-0.5 text-black brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {joinSubmitting ? 'Joining Squad...' : '⚡ Enter Squad & Start Questing'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step Indicator (Create Mode) */}
        {mode === 'create' && (
          <div className="grid grid-cols-2 bg-neutral-100 border-b-2 border-black font-mono text-xs font-black text-center">
            <div
              className={`py-2 flex items-center justify-center gap-1.5 border-r-2 border-black ${
                step === 1 ? 'bg-brand-yellow text-black' : 'text-neutral-500 bg-white'
              }`}
            >
              <span>1. Squad Details</span>
              {step === 2 && <span className="text-black">✓</span>}
            </div>
            <div
              className={`py-2 flex items-center justify-center gap-1.5 ${
                step === 2 ? 'bg-brand-yellow text-black' : 'text-neutral-500'
              }`}
            >
              <span>2. Invite Pass & Code</span>
            </div>
          </div>
        )}

        {/* Step 1: Squad Details Form */}
        {mode === 'create' && step === 1 && (
          <form onSubmit={handleNextStep} className="p-6 md:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight text-neutral-900">
                Create A New Squad
              </h2>
              <p className="font-hanken text-xs text-neutral-600">
                Form your circle, set shared goals, and tackle wild adventures together.
              </p>
            </div>

            {/* Squad Name */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Squad Name <span className="text-brand-pink">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tokyo Drift 2025 🏎️"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-display font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow shadow-brutal-sm"
              />
            </div>

            {/* Category / Vibe Pills */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Squad Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full brutal-border-sm font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-black text-white shadow-brutal-sm ring-2 ring-brand-yellow'
                          : 'bg-white hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Motto / Mission
              </label>
              <textarea
                rows="2"
                placeholder="What is this squad's pact? e.g. Summit 3 peaks, eat ramen at 2am, never back down."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-white brutal-border-sm rounded-lg font-hanken text-xs focus:outline-none focus:ring-2 focus:ring-brand-yellow shadow-brutal-sm resize-none"
              />
            </div>

            {/* Cover Image Preset Picker */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Cover Photo Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COVER_PRESETS.map((preset) => {
                  const isSelected = selectedCover === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedCover(preset.url)}
                      className={`relative h-16 rounded-lg brutal-border-sm overflow-hidden cursor-pointer group transition-all ${
                        isSelected ? 'ring-3 ring-brand-pink shadow-brutal-sm scale-105' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/75 text-white font-mono text-[9px] font-bold px-1 rounded truncate text-center">
                        {preset.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 bg-white brutal-border-sm rounded-xl">
              <div>
                <div className="font-display font-extrabold text-xs text-neutral-900">
                  {isPrivate ? '🔒 Private Squad (Invite Only)' : '🌐 Public Squad (Discoverable)'}
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {isPrivate
                    ? 'Only people with the join code or link can join.'
                    : 'Anyone on LifeQuest can search and request to join.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`px-3 py-1 font-mono text-[11px] font-black uppercase rounded brutal-border-sm transition-all ${
                  isPrivate ? 'bg-brand-pink text-white' : 'bg-brand-lime text-black'
                }`}
              >
                {isPrivate ? 'PRIVATE' : 'PUBLIC'}
              </button>
            </div>

            {/* Action */}
            {createError && (
              <p className="text-xs font-mono text-red-600 font-bold bg-red-50 p-2.5 rounded border border-red-200">
                ⚠️ {createError}
              </p>
            )}
            <button
              type="submit"
              disabled={createLoading || !squadName.trim()}
              className="w-full py-3 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 text-black font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{createLoading ? 'Creating Squad & Generating Pass...' : 'Next: Generate Boarding Pass ➔'}</span>
            </button>
          </form>
        )}

        {/* Step 2: Boarding Pass & Shareable Invite */}
        {mode === 'create' && step === 2 && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Retro Boarding Pass / Ticket */}
            <div className="relative bg-white brutal-border-lg rounded-2xl shadow-brutal-lg overflow-hidden">
              {/* Top Perforation / Punch notches */}
              <div className="bg-brand-pink text-white p-3.5 flex items-center justify-between border-b-3 border-black">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">confirmation_number</span>
                  <span className="font-mono text-xs font-black uppercase tracking-wider">
                    SQUAD BOARDING PASS
                  </span>
                </div>
                <span className="font-mono text-xs font-black bg-black text-brand-yellow px-2 py-0.5 rounded">
                  OFFICIAL PACT
                </span>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl brutal-border-sm overflow-hidden shrink-0 shadow-brutal-sm">
                    <img src={selectedCover} alt={squadName} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <span className="px-2 py-0.5 bg-brand-yellow text-black font-mono text-[10px] font-black uppercase rounded brutal-border-sm inline-block">
                      {category} SQUAD
                    </span>
                    <h3 className="font-display font-black text-xl uppercase tracking-tight truncate text-neutral-900">
                      {squadName}
                    </h3>
                    <p className="font-hanken text-[11px] text-neutral-600 line-clamp-1">
                      {description || 'The adventure begins now.'}
                    </p>
                  </div>
                </div>

                {/* Perforated dashed divider */}
                <div className="relative py-1">
                  <div className="border-t-2 border-dashed border-black w-full" />
                  <div className="absolute -left-7 -top-2 w-4 h-4 bg-brand-canvas rounded-full border-2 border-black" />
                  <div className="absolute -right-7 -top-2 w-4 h-4 bg-brand-canvas rounded-full border-2 border-black" />
                </div>

                {/* 6-Digit Join Code Box */}
                <div className="bg-brand-canvas p-4 brutal-border-sm rounded-xl text-center space-y-2">
                  <div className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    UNIQUE SQUAD JOIN CODE
                  </div>
                  <div className="font-mono text-3xl font-black tracking-widest text-black">
                    {joinCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-1.5 bg-brand-yellow hover:bg-[#ffe600] font-mono text-xs font-black uppercase rounded brutal-border-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
                  </button>
                </div>

                {/* Shareable Link Box */}
                <div className="space-y-1">
                  <label className="block font-mono text-[11px] font-black uppercase text-neutral-700">
                    Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-1.5 bg-neutral-100 brutal-border-sm rounded-lg font-mono text-xs text-neutral-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 font-mono text-xs font-black uppercase rounded brutal-border-sm transition-all shrink-0"
                    >
                      {copiedLink ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Quick Share Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 bg-brand-lime hover:bg-[#9cf0b3] brutal-border-sm rounded-lg text-center font-mono text-xs font-black flex items-center justify-center gap-1 shadow-brutal-sm"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 bg-brand-cyan hover:bg-[#a6ecfc] brutal-border-sm rounded-lg text-center font-mono text-xs font-black flex items-center justify-center gap-1 shadow-brutal-sm"
                  >
                    <span>✈️ Telegram</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="py-2 bg-brand-purple hover:bg-[#c2aafd] brutal-border-sm rounded-lg text-center font-mono text-xs font-black flex items-center justify-center gap-1 shadow-brutal-sm"
                  >
                    <span>🔗 Share Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 bg-white hover:bg-neutral-100 font-mono text-xs font-black uppercase rounded-xl brutal-border-sm"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 text-black font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Squad & Start Questing! 🚀</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default CreateSquadModal;
