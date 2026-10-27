import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const DEFAULT_PERSONAL_LOG_TRAIL = [
  {
    id: 1,
    author: 'You (Alex)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    action: 'Logged personal milestone and training checkpoint',
    progress: 60,
    timestamp: 'Yesterday',
  },
  {
    id: 2,
    author: 'You (Alex)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    action: 'Status changed to In Progress',
    progress: 25,
    timestamp: '3 days ago',
  },
];

const DEFAULT_TEAM_LOG_TRAIL = [
  {
    id: 1,
    author: 'Alex Rivero',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    action: 'Logged squad checkpoint progress',
    progress: 75,
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    author: 'Squad Member',
    avatar: 'https://ui-avatars.com/api/?name=Squad+Member&background=ffed00&color=000&bold=true',
    action: 'Completed gear prep & team checklist',
    progress: 50,
    timestamp: 'Yesterday',
  },
  {
    id: 3,
    author: 'Alex Rivero',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    action: 'Status changed from Not Started to In Progress',
    progress: 25,
    timestamp: '4 days ago',
  },
];

function ProgressUpdateDrawer({
  isOpen,
  onClose,
  goal,
  onSaveProgress,
  onOpenCelebration,
}) {
  const isTeamGoal = Boolean(goal?.groupId) || Boolean(goal?.isTeamGoal) || Boolean(goal?.members?.length);

  const [progress, setProgress] = useState(goal?.progress || 0);
  const [status, setStatus] = useState(goal?.status || 'in-progress');
  const [note, setNote] = useState('');
  const [logTrail, setLogTrail] = useState(isTeamGoal ? DEFAULT_TEAM_LOG_TRAIL : DEFAULT_PERSONAL_LOG_TRAIL);

  useEffect(() => {
    if (goal) {
      setProgress(goal.progress ?? 40);
      setStatus(goal.status || 'in-progress');
      setNote('');
      setLogTrail(isTeamGoal ? DEFAULT_TEAM_LOG_TRAIL : DEFAULT_PERSONAL_LOG_TRAIL);
    }
  }, [goal, isOpen, isTeamGoal]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const handleSliderChange = (val) => {
    const num = Number(val);
    setProgress(num);
    if (num === 100) setStatus('completed');
    else if (num === 0) setStatus('not-started');
    else setStatus('in-progress');
  };

  const handleQuickPercent = (pct) => {
    handleSliderChange(pct);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedGoal = {
      ...goal,
      progress,
      status,
    };

    if (note.trim()) {
      const newEntry = {
        id: Date.now(),
        author: 'You (Alex)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        action: note.trim(),
        progress,
        timestamp: 'Just now',
      };
      setLogTrail((prev) => [newEntry, ...prev]);
    }

    if (onSaveProgress) {
      onSaveProgress(updatedGoal, note);
    }

    onClose();

    // If 100% or marked completed, prompt celebration modal
    if (status === 'completed' || progress === 100) {
      if (onOpenCelebration) {
        onOpenCelebration(updatedGoal);
      }
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-brand-canvas brutal-border-l-4 border-black h-full shadow-brutal-xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="bg-brand-yellow p-4 sm:p-5 border-b-3 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="sticker-badge bg-black text-brand-yellow px-2 py-0.5 rounded text-xs -rotate-1">
              {isTeamGoal ? 'SQUAD LOG ⚡' : 'LOG CHECKPOINT ⚡'}
            </span>
            <span className="font-mono text-xs font-black uppercase text-neutral-800">
              {isTeamGoal ? 'TEAM GAUGE' : 'PERSONAL GAUGE'}
            </span>
          </div>

          <button
            id="drawer-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-brand-pink text-white font-black text-sm flex items-center justify-center rounded brutal-border-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Target Quest Info */}
          <div className="p-4 bg-white brutal-border-sm rounded-xl shadow-brutal-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-brand-pink text-white font-mono text-[10px] font-black uppercase rounded brutal-border-sm">
                {goal.category || 'QUEST'}
              </span>
              <span className="font-mono text-[11px] font-bold text-neutral-600">
                CURRENT: {progress}%
              </span>
            </div>
            <h3 className="font-display font-black text-lg leading-tight text-neutral-900">
              {goal.title}
            </h3>
            {goal.description && (
              <p className="font-hanken text-xs text-neutral-600 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Progress Gauge & Slider */}
            <div className="space-y-3 p-4 bg-white brutal-border-sm rounded-xl">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-black uppercase text-neutral-800">
                  Completion Gauge
                </label>
                <span className="font-mono text-2xl font-black text-brand-pink">
                  {progress}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-5 bg-neutral-200 brutal-border-sm rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-brand-pink rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Range Input Slider */}
              <input
                id="drawer-gauge-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => handleSliderChange(e.target.value)}
                className="w-full accent-brand-pink cursor-pointer"
              />

              {/* Quick Milestone Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[
                  { label: '0%', val: 0 },
                  { label: '25%', val: 25 },
                  { label: '50%', val: 50 },
                  { label: '75%', val: 75 },
                  { label: '100% 🏆', val: 100 },
                ].map((m) => (
                  <button
                    id={`drawer-milestone-${m.val}-btn`}
                    key={m.val}
                    type="button"
                    onClick={() => handleQuickPercent(m.val)}
                    className={`py-1 rounded font-mono text-xs font-bold brutal-border-sm transition-all cursor-pointer ${
                      progress === m.val
                        ? 'bg-black text-white shadow-brutal-sm'
                        : 'bg-neutral-100 hover:bg-brand-yellow text-black'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Switcher */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Quest Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'not-started', label: 'Not Started', color: 'bg-brand-cyan' },
                  { key: 'in-progress', label: 'In Progress', color: 'bg-brand-yellow' },
                  { key: 'completed', label: 'Completed 🎉', color: 'bg-brand-lime' },
                ].map((s) => {
                  const isSelected = status === s.key;
                  return (
                    <button
                      id={`drawer-status-${s.key}-btn`}
                      key={s.key}
                      type="button"
                      onClick={() => {
                        setStatus(s.key);
                        if (s.key === 'completed') setProgress(100);
                        if (s.key === 'not-started') setProgress(0);
                      }}
                      className={`py-2 px-1 text-center font-mono text-xs font-black rounded-lg brutal-border-sm transition-all cursor-pointer ${
                        isSelected
                          ? `${s.color} text-black ring-2 ring-black shadow-brutal-sm`
                          : 'bg-white hover:bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checkpoint Log Note */}
            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Log Checkpoint Note / Update
              </label>
              <textarea
                id="drawer-note-input"
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isTeamGoal
                    ? "What milestone did you or your squad hit today? e.g. Booked flight tickets, hiked 1500m checkpoint..."
                    : "What personal milestone did you reach today? e.g. Finished chapter 3, completed 5k run..."
                }
                className="w-full p-3 bg-white brutal-border-sm rounded-lg font-hanken text-xs focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm resize-none"
              />
            </div>

            {/* Submit Action */}
            <button
              id="drawer-submit-btn"
              type="submit"
              className="w-full py-3 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isTeamGoal ? 'Update Squad Log ➔' : 'Update Personal Progress ➔'}</span>
            </button>
          </form>

          {/* Activity / Status Trail */}
          <div className="space-y-3 pt-4 border-t-2 border-black">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-700">
                {isTeamGoal ? 'SQUAD STATUS & CHECKPOINT TRAIL' : 'PERSONAL CHECKPOINT TRAIL'}
              </h4>
              <span className="font-mono text-[10px] text-neutral-500 font-bold">
                {logTrail.length} UPDATES
              </span>
            </div>

            <div className="space-y-2.5">
              {logTrail.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-white brutal-border-sm rounded-xl space-y-1 shadow-sm"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.avatar}
                        alt={entry.author}
                        className="w-5 h-5 rounded-full brutal-border-sm object-cover"
                      />
                      <span className="font-mono font-bold text-neutral-900">
                        {entry.author}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-500">
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className="font-hanken text-xs text-neutral-800 pl-7">
                    {entry.action}
                  </p>
                  <div className="pl-7 pt-0.5">
                    <span className="px-1.5 py-0.2 bg-neutral-100 rounded text-[10px] font-mono font-bold text-neutral-600">
                      Checkpoint at {entry.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ProgressUpdateDrawer;
