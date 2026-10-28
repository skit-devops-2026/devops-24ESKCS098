import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess, prompt }) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState('TRAVEL');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rememberMe: true,
  });

  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    setTab(initialTab);
    setFeedback(null);
    setIsLoading(false);
  }, [initialTab, isOpen]);

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

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFeedback(null);

    // Client-side validations
    const cleanEmail = formData.email.trim();
    const cleanPassword = formData.password;
    const cleanName = formData.name.trim();

    if (tab === 'signup') {
      if (!cleanName || cleanName.length < 2) {
        setFeedback({
          type: 'error',
          message: 'Call-sign / Name must be at least 2 characters.',
        });
        return;
      }
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFeedback({
        type: 'error',
        message: 'Please provide a valid email address.',
      });
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setFeedback({
        type: 'error',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (tab === 'login') {
        result = await login(cleanEmail, cleanPassword);
        setFeedback({
          type: 'success',
          message: `Welcome back, ${result.user?.name || 'Adventurer'}! Unlocking quests...`,
        });
      } else {
        result = await signup({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          vibe: selectedVibe,
        });
        setFeedback({
          type: 'success',
          message: 'LifeQuest Passport minted! Welcome to the Squad.',
        });
      }

      setTimeout(() => {
        setIsLoading(false);
        if (onAuthSuccess && result.user) {
          onAuthSuccess(result.user);
        }
        onClose();
      }, 700);
    } catch (err) {
      setIsLoading(false);
      setFeedback({
        type: 'error',
        message: err.message || 'Authentication failed. Please check your credentials.',
      });
    }
  };

  const VIBES = [
    { id: 'TRAVEL', label: 'Travel', emoji: '✈️' },
    { id: 'ADVENTURE', label: 'Adventure', emoji: '🧗' },
    { id: 'SKILLS', label: 'Skills', emoji: '🎸' },
    { id: 'FITNESS', label: 'Fitness', emoji: '🏃' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={isLoading ? undefined : onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-brand-canvas brutal-border-lg rounded-2xl shadow-brutal-xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Perforated / Punch-hole Header */}
        <div className="bg-brand-yellow p-4 border-b-3 border-black relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="punch-hole bg-white" />
            <div className="punch-hole bg-white" />
            <span className="font-mono text-xs font-black uppercase tracking-wider bg-black text-brand-yellow px-2 py-0.5 rounded -rotate-2">
              PASSPORT ACCESS ⚡
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black tracking-widest text-neutral-800">
              LQ-AUTH-2026
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 bg-black hover:bg-brand-pink text-white font-black text-sm flex items-center justify-center rounded brutal-border-sm transition-colors disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Header Title */}
          <div className="space-y-1">
            <h2 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-neutral-900">
              {tab === 'login' ? 'Unlock Your Quests' : 'Join The Squad'}
            </h2>
            <p className="font-hanken text-sm text-neutral-600">
              {tab === 'login'
                ? 'Enter your credentials to access your squad bucket list & challenges.'
                : 'Mint your passport and start conquering milestones with friends.'}
            </p>
          </div>

          {prompt && (
            <div className="bg-brand-yellow/20 border-2 border-black p-3 rounded-xl flex items-center gap-2 shadow-brutal-sm">
              <span className="text-lg">⚡</span>
              <p className="font-mono text-xs font-bold text-neutral-900">{prompt}</p>
            </div>
          )}

          {/* Neo-brutalist Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-neutral-200 brutal-border-sm rounded-xl gap-1">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setTab('login');
                setFeedback(null);
              }}
              className={`py-2 font-mono text-xs font-black uppercase rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-black text-white shadow-brutal-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-white/50'
              }`}
            >
              LOG IN
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setTab('signup');
                setFeedback(null);
              }}
              className={`py-2 font-mono text-xs font-black uppercase rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-brand-pink text-white shadow-brutal-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-white/50'
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Status Feedback Toast */}
          {feedback && (
            <div
              className={`p-3 font-mono text-xs font-black rounded-lg brutal-border-sm shadow-brutal-sm flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'bg-[#ffdad6] text-[#ba1a1a] border-black'
                  : 'bg-brand-lime text-black border-black animate-pulse'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {feedback.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div className="space-y-1.5">
                <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                  Squad Call-Sign / Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="e.g. Alex Traveler"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-hanken text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm disabled:bg-neutral-100"
                  />
                  <span className="absolute right-3 top-2.5 text-neutral-400 material-symbols-outlined text-lg">
                    badge
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder="adventurer@lifequest.app"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-hanken text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm disabled:bg-neutral-100"
                />
                <span className="absolute right-3 top-2.5 text-neutral-400 material-symbols-outlined text-lg">
                  mail
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                  Secret Code / Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setFeedback({
                        type: 'error',
                        message: 'Demo hint: Use password "password123" for seed accounts (alex@lifequest.app).',
                      });
                    }}
                    className="font-mono text-[11px] text-brand-pink font-bold hover:underline"
                  >
                    Forgot Code?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm disabled:bg-neutral-100"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-black"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quest Vibe Tag Selector for Signup */}
            {tab === 'signup' && (
              <div className="space-y-2 pt-1">
                <label className="block font-mono text-xs font-black uppercase text-neutral-800">
                  Primary Quest Vibe
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VIBES.map((v) => {
                    const isSelected = selectedVibe === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isLoading}
                        onClick={() => setSelectedVibe(v.id)}
                        className={`py-1.5 px-2 rounded-lg brutal-border-sm font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-brand-yellow shadow-brutal-sm text-black ring-2 ring-black'
                            : 'bg-white hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <span>{v.emoji}</span>
                        <span>{v.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 text-black font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>
                  <span>{tab === 'login' ? 'Authenticating...' : 'Minting Passport...'}</span>
                </>
              ) : (
                <span>{tab === 'login' ? 'Unlock Your Quests 🚀' : 'Mint Your Passport ➔'}</span>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t-2 border-dashed border-neutral-400 w-full" />
            <span className="bg-brand-canvas px-3 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider absolute">
              QUICK DEMO ACCESS
            </span>
          </div>

          {/* Demo Login Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setFormData({
                  ...formData,
                  email: 'alex@lifequest.app',
                  password: 'password123',
                });
                setTab('login');
              }}
              className="py-2.5 px-3 bg-white hover:bg-neutral-50 rounded-xl brutal-border-sm shadow-brutal-sm font-mono text-xs font-black flex items-center justify-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-neutral-800"
            >
              <span>⚡ Demo: Alex (Lead)</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setFormData({
                  ...formData,
                  email: 'priya@lifequest.app',
                  password: 'password123',
                });
                setTab('login');
              }}
              className="py-2.5 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl brutal-border-sm shadow-brutal-sm font-mono text-xs font-black flex items-center justify-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <span>🏍️ Demo: Priya</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-neutral-100 border-t-2 border-black text-center font-mono text-[11px] text-neutral-600">
          <span>By continuing, you agree to the </span>
          <span className="text-black font-black underline cursor-pointer">Squad Code</span>
          <span> & </span>
          <span className="text-black font-black underline cursor-pointer">Privacy Pact</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AuthModal;