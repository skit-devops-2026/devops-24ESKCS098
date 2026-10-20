import { Link, useLocation } from 'react-router-dom';

function Header() {
  const { pathname } = useLocation();

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
      <div className="flex items-center gap-4">
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
            className="pl-10 pr-4 py-2 border-2 border-black rounded-md font-hanken text-sm focus:outline-none focus:ring-0 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 w-48 focus:w-64 focus:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] focus:-translate-y-0.5"
          />
        </div>

        {/* Start Quest Button */}
        <button className="relative inline-flex items-center justify-center px-6 py-2 overflow-hidden font-space font-bold uppercase text-sm tracking-tighter text-white bg-primary border-2 border-black rounded-md group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-[#ffed00] rounded-full group-hover:w-56 group-hover:h-56" />
          <span className="relative group-hover:text-black transition-colors duration-300">
            + Start Quest
          </span>
        </button>

        {/* User Avatar */}
        <button className="w-10 h-10 border-2 border-black rounded-md overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          <img
            src="https://ui-avatars.com/api/?name=User&background=000&color=fff&bold=true"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
}

export default Header;
