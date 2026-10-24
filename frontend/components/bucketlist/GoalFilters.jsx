const GoalFilters = ({
  filters,
  activeFilter,
  setActiveFilter,
  getCount,
}) => {
  return (
    <div className="mb-8">
      {/* Status filters */}
      <div className="flex flex-wrap gap-3 font-space font-bold text-sm uppercase">
        {filters.map(({ key, label, activeBg }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`px-4 py-2 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ${
              activeFilter === key
                ? activeBg
                : 'bg-white text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
            }`}
            aria-pressed={activeFilter === key}
          >
            {label} ({getCount(key)})
          </button>
        ))}
      </div>
    </div>
  );
};

export default GoalFilters;
