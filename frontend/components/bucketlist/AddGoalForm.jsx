import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES } from './constants';

function AddGoalForm({ onAdd, onCancel, isTeamGoal = false }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ADVENTURE');
  const [deadline, setDeadline] = useState('');
  const [visibility, setVisibility] = useState('public');
  const titleRef = useRef(null);

  const canSubmit = title.trim() !== '' && description.trim() !== '';

  // Focus first field + lock background scroll while modal is open
  useEffect(() => {
    titleRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    onAdd({
      title: title.trim(),
      description: description.trim(),
      category,
      deadline: deadline || '',
      visibility,
      status: 'not-started',
      progress: 0,
    });
  };

  const fieldClass =
    'w-full bg-white border-2 border-black rounded-lg px-4 py-3 font-medium placeholder:text-black/40 transition-all duration-200 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_#ffed00] focus:-translate-y-0.5';

  return createPortal(
    <>
      <style>{`
        @keyframes modalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-backdrop { animation: modalFade 0.2s ease-out; }
        .modal-panel { animation: modalPop 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
        @media (prefers-reduced-motion: reduce) {
          .modal-backdrop, .modal-panel { animation: none; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onCancel}
        role="presentation"
      >
        {/* Modal panel */}
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-goal-title"
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="modal-panel relative w-full max-w-lg bg-[#fffdf5] border-3 border-black rounded-2xl p-6 sm:p-8 space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full border-2 border-black bg-white transition-all duration-200 hover:bg-[#ffdad6] hover:rotate-90 hover:scale-110 active:scale-95"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* Heading */}
          <div className="pr-10">
            <h2
              id="add-goal-title"
              className="font-bricolage text-3xl font-extrabold leading-tight"
            >
              {isTeamGoal ? 'Create a Team Goal' : 'Create a Goal'}
            </h2>
            <p className="text-sm text-black/60 mt-1">
              Dream it, write it, chase it.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="goal-title"
                className="font-space font-bold uppercase text-xs tracking-wide"
              >
                Title
              </label>
              <span className="text-xs text-black/50">{title.length}/100</span>
            </div>
            <input
              id="goal-title"
              ref={titleRef}
              className={fieldClass}
              placeholder="e.g. Learn to surf in Bali"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="goal-description"
                className="font-space font-bold uppercase text-xs tracking-wide"
              >
                Description
              </label>
              <span className="text-xs text-black/50">
                {description.length}/500
              </span>
            </div>
            <textarea
              id="goal-description"
              className={`${fieldClass} resize-none`}
              placeholder="Describe your goal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={500}
              rows={4}
            />
          </div>

          {/* Category chips */}
          <div className="space-y-2">
            <span className="font-space font-bold uppercase text-xs tracking-wide block">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const selected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    aria-pressed={selected}
                    className={`px-4 py-1.5 rounded-full border-2 border-black text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none ${
                      selected
                        ? `${c.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`
                        : 'bg-white'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label
              htmlFor="goal-deadline"
              className="font-space font-bold uppercase text-xs tracking-wide block"
            >
              Deadline <span className="text-black/40">(optional)</span>
            </label>
            <input
              id="goal-deadline"
              type="date"
              className={fieldClass}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {/* Visibility */}
          {!isTeamGoal && (
            <div className="space-y-2">
              <span className="font-space font-bold uppercase text-xs tracking-wide block">
                Visibility
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  aria-pressed={visibility === 'public'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black text-sm font-bold transition-all duration-200 ${
                    visibility === 'public'
                      ? 'bg-[#bdf2ff] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:-translate-y-0.5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  aria-pressed={visibility === 'private'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black text-sm font-bold transition-all duration-200 ${
                    visibility === 'private'
                      ? 'bg-gray-800 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:-translate-y-0.5'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Private
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)] active:translate-y-0 active:shadow-none"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 bg-[#ffed00] border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}

export default AddGoalForm;