import { useState } from 'react';

const GOALS = [
  {
    id: 1,
    status: 'in-progress',
    category: 'ADVENTURE',
    title: 'Summit Mount Fuji at Sunrise',
    description: 'An epic 2-day trek to catch the dawn from the highest peak in Japan.',
    progress: 40,
  },
  {
    id: 2,
    status: 'not-started',
    category: 'SKILLS',
    title: 'Master 5 Authentic Pasta Recipes',
    description: 'Weekly cooking workshop to learn carbonara and more from scratch.',
    progress: 0,
  },
  {
    id: 3,
    status: 'completed',
    category: 'TRAVEL',
    title: 'Road Trip Through the Amalfi Coast',
    description: '7 days, 3 friends, and an open-top vintage car. Done last summer.',
    progress: 100,
    participants: ['A', 'S', 'J'],
  },
];

const FILTERS = [
  { key: 'all', label: 'All', activeBg: 'bg-black text-white' },
  { key: 'in-progress', label: 'In Progress', activeBg: 'bg-[#ffed00] text-black' },
  { key: 'not-started', label: 'Not Started', activeBg: 'bg-[#bdf2ff] text-black' },
  { key: 'completed', label: 'Completed', activeBg: 'bg-[#ffdad6] text-black' },
];

function BucketList() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredGoals = activeFilter === 'all'
    ? GOALS
    : GOALS.filter((g) => g.status === activeFilter);

  const getCount = (key) =>
    key === 'all' ? GOALS.length : GOALS.filter((g) => g.status === key).length;

  return (
    <>
      <style>{`
        body { position: relative; overflow-x: hidden; }
        body::before {
          content: "";
          position: fixed;
          inset: -10%;
          z-index: -1;
          background:
            radial-gradient(circle at 20% 20%, rgba(228, 0, 108, 0.03), transparent 42%),
            radial-gradient(circle at 80% 15%, rgba(255, 237, 0, 0.04), transparent 42%),
            radial-gradient(circle at 30% 80%, rgba(189, 242, 255, 0.05), transparent 48%),
            radial-gradient(circle at 85% 85%, rgba(228, 0, 108, 0.03), transparent 42%);
          background-size: 180% 180%;
          animation: gradientDrift 10s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes gradientDrift {
          0% { background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%; transform: scale(1) rotate(0deg); }
          33% { background-position: 40% 30%, 55% 45%, 30% 60%, 65% 70%; transform: scale(1.08) rotate(1deg); }
          66% { background-position: 15% 55%, 80% 20%, 55% 85%, 90% 55%; transform: scale(1.04) rotate(-1deg); }
          100% { background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%; transform: scale(1) rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          body::before { animation: none; }
        }
      `}</style>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0" />

        {/* Goals section */}
        <div className="flex-1">
          {/* Heading row */}
          <div className="flex items-start justify-between mb-8 gap-6">
            {/* Sticky note style heading */}
            <div className="relative flex-1 bg-[#f9f4e8] border-3 border-black rounded-md px-10 py-7 rotate-[-1deg] hover:rotate-0 transition-transform duration-300 shadow-[5px_5px_0px_0px_rgba(228,0,108,0.5)]">
              {/* Hole punch dots */}
              <div className="absolute left-4 top-8 bottom-8 flex flex-col justify-between">
                <span className="w-2 h-2 bg-black rounded-full" />
                <span className="w-2 h-2 bg-black rounded-full" />
                <span className="w-2 h-2 bg-black rounded-full" />
              </div>

              {/* Pushpin */}
              <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#e4006c] border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/70" />
              </div>

              {/* Folded corner */}
              <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#ffed00] border-l-[28px] border-l-transparent" />

              <h1 className="font-bricolage text-6xl font-extrabold uppercase tracking-tighter pl-6">
                Group Goals
              </h1>
              <p className="text-gray-700 mt-2 font-hanken font-medium text-lg pl-6">
                Conquer the world one epic moment at a time.
              </p>

              {/* Arrow decoration */}
              <img
                src="/frontend/images/arrow.svg"
                alt=""
                className="hidden min-[1471px]:block absolute right-56 top-[47%] -translate-y-1/2 w-44 h-auto scale-x-120 opacity-70 pointer-events-none"
                style={{ filter: 'sepia(20%) saturate(60%)' }}
              />
            </div>

            {/* Active badge */}
            <div className="relative flex items-center shrink-0">
              <div className="hidden sm:flex flex-col gap-2 mr-3">
                <span className="w-4 h-1 bg-black rounded-full rotate-12" />
                <span className="w-3 h-1 bg-black rounded-full -rotate-12" />
              </div>
              <span className="bg-[#e4006c] text-white font-space font-bold text-sm px-6 py-3 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-5 hover:rotate-0 transition-transform cursor-default">
                {GOALS.length} ACTIVE
              </span>
              <div className="hidden sm:flex flex-col gap-2 ml-3">
                <span className="w-3 h-1 bg-black rounded-full -rotate-12" />
                <span className="w-4 h-1 bg-black rounded-full rotate-12" />
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-3 mb-10 font-space font-bold text-sm uppercase">
            {FILTERS.map(({ key, label, activeBg }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-2 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ${
                  activeFilter === key
                    ? activeBg
                    : 'bg-white text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {label} ({getCount(key)})
              </button>
            ))}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}

            {/* Add new goal card */}
            <div className="group border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center gap-3 p-8 min-h-[220px] hover:bg-white hover:border-solid hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="group-hover:rotate-90 transition-transform duration-300 w-12 h-12 rounded-full border-3 border-black flex items-center justify-center bg-[#ffed00]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-space font-bold uppercase text-sm">Add New Goal</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function GoalCard({ goal }) {
  if (goal.status === 'completed') {
    return (
      <div className="border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col bg-[#e4006c] text-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer">
        <div className="p-8 flex-1">
          <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
            {goal.category}
          </span>
          <h3 className="font-bricolage font-bold text-2xl mt-4 mb-3 line-through decoration-2">
            {goal.title}
          </h3>
          <p className="text-base font-hanken">{goal.description}</p>
          {goal.participants && (
            <div className="flex -space-x-3 mt-5">
              {goal.participants.map((p) => {
                const colors = { A: '#ffed00', S: '#bdf2ff', J: 'white' };
                return (
                  <div
                    key={p}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-black text-xs font-bold object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                    style={{ backgroundColor: colors[p] || '#ccc' }}
                  >
                    {p}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bg-black px-8 h-[56px] flex items-center text-xs font-space font-bold uppercase border-t-2 border-white/20">
          Completed ✔
        </div>
      </div>
    );
  }

  if (goal.status === 'not-started') {
    return (
      <div className="border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col bg-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer">
        <div className="p-8 flex-1">
          <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
            {goal.category}
          </span>
          <h3 className="font-bricolage font-bold text-2xl mt-4 mb-3">{goal.title}</h3>
          <p className="text-base text-gray-700 font-hanken">{goal.description}</p>
        </div>
        <div className="bg-gray-100 px-8 h-[56px] flex justify-between items-center text-xs font-space font-bold uppercase border-t-3 border-black">
          <span>Not Started</span>
          <button className="bg-[#e4006c] border-2 border-black px-3 py-1.5 rounded hover:bg-black text-white transition-colors">
            Join Crew
          </button>
        </div>
      </div>
    );
  }

  // in-progress
  return (
    <div className="border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col bg-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer">
      <div className="p-8 flex-1">
        <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
          {goal.category}
        </span>
        <h3 className="font-bricolage font-bold text-2xl mt-4 mb-3">{goal.title}</h3>
        <p className="text-base text-gray-700 font-hanken">{goal.description}</p>
      </div>
      <div className="bg-[#ffed00] px-8 h-[56px] flex justify-between items-center text-xs font-space font-bold uppercase border-t-3 border-black">
        <span>In Progress</span>
        <span>{goal.progress}%</span>
      </div>
    </div>
  );
}

export default BucketList;
