import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationsDropdown from './notifications/NotificationsDropdown';
import AuthModal from './auth/AuthModal';
import YearEndRecapModal from './recap/YearEndRecapModal';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { pathname } = useLocation();
  const { currentUser, isAuthenticated, logout, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
        <Link
          to="/bucket-list"
          className="relative inline-flex items-center justify-center px-4 md:px-6 py-2 overflow-hidden font-space font-bold uppercase text-xs md:text-sm tracking-tighter text-white bg-primary border-2 border-black rounded-md group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
        >
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#ffed00] rounded-full group-hover:w-56 group-hover:h-56" />
          <span className="relative group-hover:text-black transition-colors duration-300">
            + Start Quest
          </span>
        </Link>

        {/* Notifications Dropdown Anchor (Authenticated only or generic) */}
        {isAuthenticated && (
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
              <span className="material-symbols-outlined text-xl text-black">notifications</span>
            </button>

            <NotificationsDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              onNotificationClick={(notif) => {
                console.log('Notification clicked:', notif);
              }}
            />
          </div>
        )}

        {/* User Auth Section: Guest Sign In vs Authenticated Profile */}
        {isAuthenticated && currentUser ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title={`Logged in as ${currentUser.name}`}
              className="flex items-center gap-2 pl-1 pr-2 py-1 border-2 border-black rounded-md bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer shrink-0"
            >
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border border-black object-cover"
              />
              <span className="font-space font-black text-xs hidden sm:inline-block max-w-[90px] truncate">
                {currentUser.name}
              </span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-brutal p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-2 py-1.5 border-b border-neutral-200 mb-1">
                  <div className="font-space font-black text-xs text-neutral-900 truncate">
                    {currentUser.name}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-500 truncate">
                    {currentUser.email}
                  </div>
                  <div className="mt-1 inline-block px-1.5 py-0.5 bg-brand-yellow font-mono text-[10px] font-black rounded border border-black">
                    ⭐ {currentUser.xp || 0} XP
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full text-left px-2 py-1.5 font-space font-bold text-xs hover:bg-neutral-100 rounded flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>View Passport</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-2 py-1.5 font-space font-black text-xs text-rose-600 hover:bg-rose-50 rounded flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-yellow hover:bg-[#ffe600] text-black border-2 border-black rounded-md font-space font-black uppercase text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">login</span>
            <span>Sign In / Join</span>
          </button>
        )}
      </div>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* 2026 Year End Recap Modal */}
      <YearEndRecapModal
        isOpen={isRecapOpen}
        onClose={() => setIsRecapOpen(false)}
      />
    </header>
  );
}

export default Header;

