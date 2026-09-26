import { Link } from 'react-router-dom';

function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* Hero Section */}
      <section className="relative bg-[#bdf2ff] border-3 border-black p-8 md:p-16 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        {/* Left Content */}
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-block bg-[#686000] text-white px-4 py-1 border-2 border-black font-space font-bold uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Level Up Your Life
          </div>
          <h1 className="text-5xl md:text-7xl font-bricolage font-extrabold tracking-tighter leading-tight text-black">
            Turn Your
            <span className="inline-block bg-[#ffed00] px-3 py-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 mx-1">
              Bucket List
            </span>
            Into Shared Adventures.
          </h1>
          <p className="text-lg md:text-xl font-hanken text-gray-800 max-w-lg leading-relaxed font-medium">
            Don't just dream it. Quest it. Join a community of achievers, tackle
            goals together, and collect memories that feel like physical stickers
            on your soul.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button className="px-8 py-3 bg-[#e4006c] text-white font-space font-bold uppercase border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              Join a Quest
            </button>
            <a
              href="#"
              className="flex items-center gap-2 font-space font-bold uppercase text-black hover:text-[#e4006c] transition-colors group"
            >
              <div className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full group-hover:border-[#e4006c] transition-colors">
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4l12 6-12 6z" />
                </svg>
              </div>
              <span className="underline decoration-2 underline-offset-4">How it works</span>
            </a>
          </div>
        </div>

        {/* Right Content (Polaroids) */}
        <div className="flex-1 relative h-[450px] w-full hidden md:block">
          {/* Polaroid 1 */}
          <div className="absolute top-4 right-12 w-64 bg-white p-3 border-3 border-black rotate-6 hover:rotate-12 hover:scale-105 transition-all duration-300 z-10 cursor-pointer">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&q=80"
                alt="Adventure"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Mount Fuji '23</p>
          </div>
          {/* Polaroid 2 */}
          <div className="absolute top-28 right-40 w-64 bg-white p-3 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-6 hover:-rotate-12 hover:scale-105 transition-all duration-300 z-20 cursor-pointer">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80"
                alt="Salsa"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Salsa Night</p>
          </div>

          {/* Stats Badge */}
          <div className="absolute bottom-10 right-4 z-30 bg-[#ffed00] border-3 border-black p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rotate-3 hover:-rotate-3 transition-transform cursor-default">
            <p className="font-space font-bold uppercase text-xs">Community Stats</p>
            <p className="font-bricolage font-extrabold text-3xl tracking-tight">
              1.2M <span className="text-xl">Quests</span>
            </p>
          </div>
        </div>
      </section>

      {/* Active Group Quests */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-3 border-black pb-4 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bricolage font-extrabold uppercase tracking-tight">
              Active Group Quests
            </h2>
            <p className="font-hanken font-medium text-gray-700 mt-2">
              Your team is waiting. Get moving!
            </p>
          </div>
          <Link
            to="/bucket-list"
            className="px-6 py-2 bg-[#ffed00] font-space font-bold uppercase text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all whitespace-nowrap"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 hover:rotate-0 hover:-translate-y-2 transition-all duration-300">
            <div className="relative w-full h-52 bg-gray-200 border-2 border-black mb-4 overflow-hidden group">
              <span className="absolute top-2 left-2 bg-[#ffed00] border-2 border-black px-2 py-1 text-xs font-space font-bold uppercase z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                4 Members
              </span>
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80"
                alt="Vietnam"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <h3 className="text-xl font-bricolage font-extrabold uppercase mb-4">
              Backpacking Vietnam
            </h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-space font-bold uppercase">
                <span>Progress</span>
                <span className="text-[#e4006c]">75%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="w-3/4 h-full bg-[#e4006c] rounded-full border-r-2 border-black" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-300">
              <div className="flex -space-x-2">
                <img
                  src="https://ui-avatars.com/api/?name=A&background=random"
                  className="w-8 h-8 rounded-full border-2 border-black object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                  alt="A"
                />
                <img
                  src="https://ui-avatars.com/api/?name=B&background=random"
                  className="w-8 h-8 rounded-full border-2 border-black object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                  alt="B"
                />
                <div className="w-8 h-8 rounded-full border-2 border-black bg-[#ffed00] flex items-center justify-center text-xs font-space font-bold hover:z-10 hover:-translate-y-1 transition-transform cursor-pointer">
                  +2
                </div>
              </div>
              <a
                href="#"
                className="font-space font-bold uppercase text-sm underline decoration-2 underline-offset-2 hover:text-[#e4006c] transition-colors"
              >
                Open Quest
              </a>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 hover:rotate-0 hover:-translate-y-2 transition-all duration-300">
            <div className="relative w-full h-52 bg-gray-200 border-2 border-black mb-4 overflow-hidden group">
              <span className="absolute top-2 left-2 bg-[#e4006c] text-white border-2 border-black px-2 py-1 text-xs font-space font-bold uppercase z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Trending
              </span>
              <img
                src="https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80"
                alt="Salsa"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <h3 className="text-xl font-bricolage font-extrabold uppercase mb-4">
              Learn to Salsa
            </h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-space font-bold uppercase">
                <span>Status</span>
                <span className="text-[#686000]">In Progress</span>
              </div>
              <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden p-0.5">
                <div className="w-1/3 h-full bg-[#ffed00] rounded-full border-r-2 border-black" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-300">
              <div className="flex -space-x-2">
                <img
                  src="https://ui-avatars.com/api/?name=C&background=random"
                  className="w-8 h-8 rounded-full border-2 border-black object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                  alt="C"
                />
                <img
                  src="https://ui-avatars.com/api/?name=D&background=random"
                  className="w-8 h-8 rounded-full border-2 border-black object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                  alt="D"
                />
              </div>
              <a
                href="#"
                className="font-space font-bold uppercase text-sm underline decoration-2 underline-offset-2 hover:text-[#e4006c] transition-colors"
              >
                Open Quest
              </a>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-all duration-300">
            <div className="relative w-full h-52 bg-gray-200 border-2 border-black mb-4 overflow-hidden group">
              <span className="absolute top-2 left-2 bg-white border-2 border-black px-2 py-1 text-xs font-space font-bold uppercase z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                <svg
                  className="w-3 h-3 text-[#e4006c]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Upcoming
              </span>
              <img
                src="https://images.unsplash.com/photo-1521673461164-de300ebcfb17?w=400&q=80"
                alt="Skydive"
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
              />
            </div>
            <h3 className="text-xl font-bricolage font-extrabold uppercase mb-4">Skydive 2024</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-space font-bold uppercase text-gray-500">
                <span>Starting Soon</span>
                <span>Not Started</span>
              </div>
              <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden p-0.5" />
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-300">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-black bg-gray-100 border-dashed flex items-center justify-center text-gray-400 font-bold hover:z-10 hover:-translate-y-1 transition-transform cursor-pointer">
                  +
                </div>
              </div>
              <button className="bg-[#b60055] w-10 h-10 border-2 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all flex items-center justify-center text-white text-xl font-bold group">
                <span className="group-hover:rotate-90 transition-transform duration-300">+</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
