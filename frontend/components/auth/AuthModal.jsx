import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState('TRAVEL');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rememberMe: true,
  });

  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setTab(initialTab);
    setFeedback(null);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback({
      type: 'success',
      message:
        tab === 'login'
          ? 'Welcome back, Adventurer! Signing in...'
          : 'LifeQuest Passport minted! Welcome to the Squad.',
    });

    setTimeout(() => {
      if (onAuthSuccess) {
        onAuthSuccess({
          name: formData.name || (formData.email ? formData.email.split('@')[0] : 'Squad Leader'),
          email: formData.email,
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6',
          vibe: selectedVibe,
        });
      }
      onClose();
    }, 900);
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
      <div className="absolute inset-0" onClick={onClose} />

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
              LQ-AUTH-2024
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 bg-black hover:bg-brand-pink text-white font-black text-sm flex items-center justify-center rounded brutal-border-sm transition-colors"
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

          {/* Neo-brutalist Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-neutral-200 brutal-border-sm rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setFeedback(null);
              }}
              className={`py-2 font-mono text-xs font-black uppercase rounded-lg transition-all ${tab === 'login'
                  ? 'bg-black text-white shadow-brutal-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-white/50'
                }`}
            >
              LOG IN
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setFeedback(null);
              }}
              className={`py-2 font-mono text-xs font-black uppercase rounded-lg transition-all ${tab === 'signup'
                  ? 'bg-brand-pink text-white shadow-brutal-sm'
                  : 'text-neutral-700 hover:text-black hover:bg-white/50'
                }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          {/* Status Feedback Toast */}
          {feedback && (
            <div className="p-3 bg-brand-lime text-black font-mono text-xs font-black rounded-lg brutal-border-sm shadow-brutal-sm flex items-center gap-2 animate-bounce">
              <span className="material-symbols-outlined text-lg">check_circle</span>
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
                    placeholder="e.g. Alex Traveler"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-hanken text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm"
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
                  placeholder="adventurer@lifequest.app"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-hanken text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm"
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
                    onClick={() => alert('Password reset link sent to your registered email!')}
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
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white brutal-border-sm rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink shadow-brutal-sm"
                />
                <button
                  type="button"
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
                        onClick={() => setSelectedVibe(v.id)}
                        className={`py-1.5 px-2 rounded-lg brutal-border-sm font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 ${isSelected
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
              className="w-full py-3 bg-brand-yellow hover:bg-[#ffe600] active:translate-x-0.5 active:translate-y-0.5 text-black font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{tab === 'login' ? 'Unlock Your Quests 🚀' : 'Mint Your Passport ➔'}</span>
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t-2 border-dashed border-neutral-400 w-full" />
            <span className="bg-brand-canvas px-3 font-mono text-[11px] font-bold text-neutral-500 uppercase tracking-wider absolute">
              OR SQUAD CONNECT
            </span>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSubmit({ preventDefault: () => { } })}
              className="py-2.5 px-3 bg-white hover:bg-neutral-50 rounded-xl brutal-border-sm shadow-brutal-sm font-mono text-xs font-black flex items-center justify-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit({ preventDefault: () => { } })}
              className="py-2.5 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl brutal-border-sm shadow-brutal-sm font-mono text-xs font-black flex items-center justify-center gap-2 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
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
