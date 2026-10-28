import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationsDropdown from './notifications/NotificationsDropdown';
import YearEndRecapModal from './recap/YearEndRecapModal';
import { useAuth } from '../context/AuthContext';
import { getUserAvatar } from '../utils/avatar';

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthModal, requireAuth } = useAuth();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarUrl = getUserAvatar(user?.id, user?.avatar_url || user?.avatar, user?.name);
  const displayName = user?.name || (isAuthenticated ? 'Adventurer' : 'Guest Quester');
  const displayEmail = user?.email || (isAuthenticated ? '' : 'Browse public quests freely');
  const displayVibe = user?.vibe || 'TRAVEL';

  const navItems = [
    { to: '/', label: 'Dashboard', activeBg: 'bg-primary-container text-on-primary-container' },
    { to: '/bucket-list', label: 'Bucket List', activeBg: 'bg-[#bdf2ff] text-on-tertiary-container' },
    { to: '/wall-of-fame', label: 'Wall of Fame', activeBg: 'bg-[#ffdad6] text-on-background' },
  ];

  const hoverColors = {
    '/': 'hover:bg-primary-container',
    '/bucket-list': 'hover:bg-[#bdf2ff]',
    '/wall-of-fame': 'hover:bg-[#ffdad6]',
  };

  return (
    <header className="sticky top-4 z-50 mx-4 md:mx-8 flex items-center justify-between px-6 py-3 border-3 border-black bg-surface-container-lowest rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
      {/* Logo */}
      <Link
        to="/"
        className="group relative text-3xl font-bricolage font-extrabold tracking-tighter text-on-background uppercase overflow-hidden flex items-center"
      >
        <span className="relative z-10">Life</span>
        <span className="relative z-10 text-primary">Quest</span>
      </Link>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-2 font-space font-bold uppercase text-sm">
        {navItems.map(({ to, label, activeBg }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={
                isActive
                  ? `relative px-5 py-2 ${activeBg} border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all`
                  : `px-5 py-2 text-on-background border-2 border-transparent hover:border-black ${hoverColors[to]} rounded-md transition-all`
              }
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Animated Search Bar */}
        <div className="relative hidden lg:flex items-center group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <svg
              className="w-4 h-4 text-black group-focus-within:text-primary transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search adventures..."
            className="pl-10 pr-4 py-2 border-2 border-black rounded-md font-hanken text-sm focus:outline-none focus:ring-0 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 w-44 focus:w-60 focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5"
          />
        </div>

        {/* 2026 Recap Button */}
        <button
          id="header-open-recap-btn"
          type="button"
          onClick={() => setIsRecapOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-brand-yellow hover:bg-[#ffe600] text-black border-2 border-black rounded-md font-space font-bold uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer -rotate-1 hover:rotate-0"
          title="Open 2026 Quest Wrapped"
        >
          <span>🎁</span>
          <span className="font-black">Recap '26</span>
        </button>

        {/* Start Quest Button */}
        <button
          type="button"
          onClick={() => {
            requireAuth(() => navigate('/bucket-list'), {
              prompt: 'Log in or sign up to embark on your quests!',
            });
          }}
          className="relative inline-flex items-center justify-center px-4 md:px-6 py-2 overflow-hidden font-space font-bold uppercase text-xs md:text-sm tracking-tighter text-white bg-primary border-2 border-black rounded-md group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all cursor-pointer"
        >
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#ffed00] rounded-full group-hover:w-56 group-hover:h-56" />
          <span className="relative group-hover:text-black transition-colors duration-300">
            + Start Quest
          </span>
        </button>

        {/* Notifications Dropdown Anchor */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Notifications"
            className={`w-10 h-10 border-2 border-black rounded-md flex items-center justify-center transition-all ${
              isNotifOpen
                ? 'bg-brand-yellow shadow-none translate-x-[2px] translate-y-[2px]'
                : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            <span className="material-symbols-outlined text-xl text-black">
              notifications
            </span>
          </button>

          {/* Notifications Dropdown Panel */}
          <NotificationsDropdown
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onNotificationClick={(notif) => {
              console.log('Notification clicked:', notif);
            }}
          />
        </div>

        {/* User Profile / Auth Button */}
        <div className="relative" ref={userMenuRef}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title={`Signed in as ${displayName} (Click for Passport/Profile)`}
              className={`w-10 h-10 border-2 border-black rounded-md overflow-hidden transition-all relative group shrink-0 ${
                isUserMenuOpen
                  ? 'ring-2 ring-black shadow-none translate-x-[2px] translate-y-[2px]'
                  : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
              }`}
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-brand-yellow/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-black font-black">expand_more</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuthModal({ tab: 'login' })}
                className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-black uppercase rounded-md brutal-border-sm shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal({ tab: 'signup' })}
                className="hidden sm:inline-flex px-3 py-1.5 bg-brand-pink hover:bg-[#ff2d75] text-white font-mono text-xs font-black uppercase rounded-md brutal-border-sm shadow-brutal-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
              >
                Join
              </button>
            </div>
          )}

          {/* User Profile Dropdown Menu */}
          {isAuthenticated && isUserMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-brand-canvas brutal-border rounded-xl shadow-brutal-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* User Bio Header */}
              <div className="p-4 bg-brand-yellow border-b-2 border-black">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-12 h-12 rounded-lg brutal-border-sm object-cover bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-black text-sm text-neutral-900 truncate">
                      {displayName}
                    </p>
                    <p className="font-mono text-[11px] text-neutral-700 truncate">
                      {displayEmail}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-black text-white font-mono text-[10px] font-black rounded uppercase">
                      {displayVibe}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-2 space-y-1 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    openAuthModal({ tab: 'signup', prompt: 'Mint an additional passport or switch quester profile' });
                  }}
                  className="w-full text-left px-3 py-2 font-mono text-xs font-bold text-neutral-800 hover:bg-neutral-100 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">switch_account</span>
                  <span>Switch Account / Passport</span>
                </button>

                <div className="border-t border-dashed border-neutral-300 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 font-mono text-xs font-black text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Log Out of Quest</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2026 Year End Recap Modal (Step 12 / Item 12) */}
      <YearEndRecapModal
        isOpen={isRecapOpen}
        onClose={() => setIsRecapOpen(false)}
      />
    </header>
  );
}

export default Header;
