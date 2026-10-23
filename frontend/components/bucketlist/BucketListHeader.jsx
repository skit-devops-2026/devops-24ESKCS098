
const BucketListHeader = ({ totalGoals, activeTab, onTabChange, teamGoalCount }) => {
  return (
    <div className="mb-8 space-y-6">
      {/* Title banner */}
      <div className="flex items-start justify-between gap-6">
        <div className="relative flex-1 bg-[#f9f4e8] border-3 border-black rounded-md px-10 py-7 rotate-[-1deg] hover:rotate-0 transition-transform duration-300 shadow-[5px_5px_0px_0px_rgba(228,0,108,0.5)]">
          <div className="absolute left-4 top-8 bottom-8 flex flex-col justify-between">
            <span className="w-2 h-2 bg-black rounded-full" />
            <span className="w-2 h-2 bg-black rounded-full" />
            <span className="w-2 h-2 bg-black rounded-full" />
          </div>

          <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-[#e4006c] border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/70" />
          </div>

          <div className="absolute top-0 right-0 w-0 h-0 border-t-[28px] border-t-[#ffed00] border-l-[28px] border-l-transparent" />

          <h1 className="font-bricolage text-4xl sm:text-6xl font-extrabold uppercase tracking-tighter pl-6">
            {activeTab === 'personal' ? 'My Goals' : 'Team Goals'}
          </h1>

          <p className="text-gray-700 mt-2 font-hanken font-medium text-lg pl-6">
            {activeTab === 'personal'
              ? 'Your personal quest board — track every dream.'
              : 'Conquer the world one epic moment at a time.'}
          </p>

          <img
            src="/frontend/images/arrow.svg"
            alt=""
            className="hidden min-[1471px]:block absolute right-56 top-[47%] -translate-y-1/2 w-44 h-auto scale-x-120 opacity-70 pointer-events-none"
            style={{ filter: 'sepia(20%) saturate(60%)' }}
          />
        </div>

        <div className="relative flex items-center shrink-0">
          <div className="hidden sm:flex flex-col gap-2 mr-3">
            <span className="w-4 h-1 bg-black rounded-full rotate-12" />
            <span className="w-3 h-1 bg-black rounded-full -rotate-12" />
          </div>

          <span className="bg-[#e4006c] text-white font-space font-bold text-sm px-6 py-3 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-5 hover:rotate-0 transition-transform cursor-default">
            {totalGoals} {activeTab === 'personal' ? 'GOALS' : 'TEAM GOALS'}
          </span>

          <div className="hidden sm:flex flex-col gap-2 ml-3">
            <span className="w-3 h-1 bg-black rounded-full -rotate-12" />
            <span className="w-4 h-1 bg-black rounded-full rotate-12" />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-3 font-space font-bold text-sm uppercase">
        <button
          type="button"
          onClick={() => onTabChange('personal')}
          className={`px-6 py-3 border-3 border-black rounded-xl transition-all duration-200 ${
            activeTab === 'personal'
              ? 'bg-[#ffed00] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
          }`}
          aria-pressed={activeTab === 'personal'}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            My Goals
          </span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('team')}
          className={`px-6 py-3 border-3 border-black rounded-xl transition-all duration-200 ${
            activeTab === 'team'
              ? 'bg-[#bdf2ff] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-white text-black hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]'
          }`}
          aria-pressed={activeTab === 'team'}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Team Goals
            {teamGoalCount > 0 && (
              <span className="bg-[#e4006c] text-white text-[10px] px-2 py-0.5 rounded-full border border-black">
                {teamGoalCount}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BucketListHeader;
