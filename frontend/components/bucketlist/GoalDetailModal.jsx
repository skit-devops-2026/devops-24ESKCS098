import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CATEGORIES,
  statusLabel,
  formatDate,
  isOverdue,
} from './constants';

/**
 * Modal to view, edit, delete, and update progress of a single goal.
 *
 * Props:
 *   goal       – the goal object
 *   onClose    – close callback
 *   onUpdate   – (updatedGoal) => void
 *   onDelete   – (goalId) => void
 *   isTeamGoal – hides visibility toggle for team goals
 */
function GoalDetailModal({ goal, onClose, onUpdate, onDelete, isTeamGoal = false }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editable fields
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description);
  const [category, setCategory] = useState(goal.category);
  const [deadline, setDeadline] = useState(goal.deadline || '');
  const [visibility, setVisibility] = useState(goal.visibility || 'public');
  const [status, setStatus] = useState(goal.status);
  const [progress, setProgress] = useState(goal.progress);

  const titleRef = useRef(null);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focus title when entering edit mode
  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  // Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // When status changes, sync progress
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'completed') setProgress(100);
    else if (newStatus === 'not-started') setProgress(0);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onUpdate({
      ...goal,
      title: title.trim(),
      description: description.trim(),
      category,
      deadline,
      visibility,
      status,
      progress: status === 'completed' ? 100 : status === 'not-started' ? 0 : progress,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    onDelete(goal.id);
    onClose();
  };

  const overdue = isOverdue(goal.deadline) && goal.status !== 'completed';

  const fieldClass =
    'w-full bg-white border-2 border-black rounded-lg px-4 py-3 font-medium placeholder:text-black/40 transition-all duration-200 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-[4px_4px_0px_0px_#ffed00] focus:-translate-y-0.5';

  return createPortal(
    <>
      <style>{`
        @keyframes modalFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: translateY(24px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .detail-backdrop { animation: modalFade 0.2s ease-out; }
        .detail-panel { animation: modalPop 0.25s cubic-bezier(0.2,0.9,0.3,1.2); }
        @media (prefers-reduced-motion: reduce) { .detail-backdrop, .detail-panel { animation: none; } }
      `}</style>

      <div
        className="detail-backdrop fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-detail-title"
          onClick={(e) => e.stopPropagation()}
          className="detail-panel relative w-full max-w-2xl bg-[#fffdf5] border-3 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Colored header bar */}
          <div
            className={`px-6 sm:px-8 py-4 border-b-3 border-black flex items-center justify-between ${
              goal.status === 'completed'
                ? 'bg-[#e4006c] text-white'
                : goal.status === 'in-progress'
                ? 'bg-[#ffed00] text-black'
                : 'bg-[#bdf2ff] text-black'
            }`}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
                {goal.category}
              </span>
              <span className="text-xs font-space font-bold uppercase">
                {statusLabel(goal.status)}
              </span>
              {overdue && (
                <span className="text-xs font-space font-bold px-2 py-1 rounded bg-[#ffdad6] text-[#93000a]">
                  Overdue
                </span>
              )}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-black bg-white text-black transition-all duration-200 hover:bg-[#ffdad6] hover:rotate-90 hover:scale-110 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
            {editing ? (
              /* ────── EDIT MODE ────── */
              <>
                {/* Title */}
                <div className="space-y-2">
                  <label htmlFor="edit-title" className="font-space font-bold uppercase text-xs tracking-wide block">
                    Title
                  </label>
                  <input
                    id="edit-title"
                    ref={titleRef}
                    className={fieldClass}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="edit-desc" className="font-space font-bold uppercase text-xs tracking-wide block">
                    Description
                  </label>
                  <textarea
                    id="edit-desc"
                    className={`${fieldClass} resize-none`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={4}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <span className="font-space font-bold uppercase text-xs tracking-wide block">Category</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        aria-pressed={category === c.value}
                        className={`px-4 py-1.5 rounded-full border-2 border-black text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                          category === c.value
                            ? `${c.color} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`
                            : 'bg-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <span className="font-space font-bold uppercase text-xs tracking-wide block">Status</span>
                  <div className="flex flex-wrap gap-2">
                    {['not-started', 'in-progress', 'completed'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(s)}
                        aria-pressed={status === s}
                        className={`px-4 py-1.5 rounded-full border-2 border-black text-sm font-bold transition-all duration-200 ${
                          status === s
                            ? s === 'completed'
                              ? 'bg-[#e4006c] text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                              : s === 'in-progress'
                              ? 'bg-[#ffed00] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-[#bdf2ff] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white hover:-translate-y-0.5'
                        }`}
                      >
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress slider (only for in-progress) */}
                {status === 'in-progress' && (
                  <div className="space-y-2">
                    <label htmlFor="edit-progress" className="font-space font-bold uppercase text-xs tracking-wide block">
                      Progress: {progress}%
                    </label>
                    <input
                      id="edit-progress"
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full accent-[#ffed00]"
                    />
                    <div className="w-full h-3 bg-gray-200 rounded-full border border-black/20 overflow-hidden">
                      <div
                        className="h-full bg-[#ffed00] rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Deadline */}
                <div className="space-y-2">
                  <label htmlFor="edit-deadline" className="font-space font-bold uppercase text-xs tracking-wide block">
                    Deadline <span className="text-black/40">(optional)</span>
                  </label>
                  <input
                    id="edit-deadline"
                    type="date"
                    className={fieldClass}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                {/* Visibility */}
                {!isTeamGoal && (
                  <div className="space-y-2">
                    <span className="font-space font-bold uppercase text-xs tracking-wide block">Visibility</span>
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

                {/* Save / Cancel edit */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // revert
                      setTitle(goal.title);
                      setDescription(goal.description);
                      setCategory(goal.category);
                      setDeadline(goal.deadline || '');
                      setVisibility(goal.visibility || 'public');
                      setStatus(goal.status);
                      setProgress(goal.progress);
                      setEditing(false);
                    }}
                    className="flex-1 bg-white border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="flex-1 bg-[#ffed00] border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              /* ────── VIEW MODE ────── */
              <>
                <h2
                  id="goal-detail-title"
                  className={`font-bricolage text-3xl font-extrabold leading-tight ${
                    goal.status === 'completed' ? 'line-through decoration-2' : ''
                  }`}
                >
                  {goal.title}
                </h2>

                <p className="text-base text-gray-700 font-hanken whitespace-pre-line">
                  {goal.description}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-3 text-xs font-space font-bold uppercase">
                  {goal.visibility === 'private' && (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-800 text-white border-2 border-black">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Private
                    </span>
                  )}
                  {goal.deadline && (
                    <span className={`px-3 py-1.5 rounded-full border-2 border-black ${overdue ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-white'}`}>
                      Deadline: {formatDate(goal.deadline)}
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-full border-2 border-black bg-white">
                    Created: {formatDate(goal.createdAt)}
                  </span>
                </div>

                {/* Progress */}
                {goal.status === 'in-progress' && (
                  <div>
                    <p className="text-xs font-space font-bold uppercase mb-2">
                      Progress: {goal.progress}%
                    </p>
                    <div className="w-full h-4 bg-gray-200 rounded-full border-2 border-black overflow-hidden">
                      <div
                        className="h-full bg-[#ffed00] rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Team members (for team goals) */}
                {goal.members && goal.members.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-space font-bold uppercase text-xs tracking-wide block">
                      Members ({goal.members.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {goal.members.map((m) => (
                        <span
                          key={m.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-[#bdf2ff] text-xs font-bold"
                        >
                          <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px]">
                            {m.name.charAt(0).toUpperCase()}
                          </span>
                          {m.name}
                          {m.role === 'admin' && (
                            <span className="text-[10px] bg-[#ffed00] px-1 py-0.5 rounded border border-black">
                              Admin
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="bg-[#ffed00] border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                  >
                    Edit
                  </button>
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="bg-[#ffdad6] text-[#93000a] border-2 border-black rounded-lg px-5 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                    >
                      Delete
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#ffdad6] border-2 border-black rounded-lg px-4 py-2">
                      <span className="text-xs font-space font-bold text-[#93000a]">
                        Are you sure?
                      </span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="bg-[#ba1a1a] text-white border-2 border-black rounded px-3 py-1 text-xs font-bold hover:bg-black transition-colors"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="bg-white border-2 border-black rounded px-3 py-1 text-xs font-bold hover:bg-gray-100 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default GoalDetailModal;
