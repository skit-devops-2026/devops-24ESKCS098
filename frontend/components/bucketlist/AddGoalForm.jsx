import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const CATEGORIES = [
  { value: 'ADVENTURE', label: 'Adventure', color: 'bg-[#ffed00]' },
  { value: 'SKILLS', label: 'Skills', color: 'bg-[#bdf2ff]' },
  { value: 'TRAVEL', label: 'Travel', color: 'bg-[#ffdad6]' },
  { value: 'FITNESS', label: 'Fitness', color: 'bg-[#d9f99d]' },
  { value: 'CAREER', label: 'Career', color: 'bg-[#e9d5ff]' },
];

function AddGoalForm({ onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ADVENTURE');
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
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      category,
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

      {/* Backdrop — click outside to close */}
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
              Create a Goal
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