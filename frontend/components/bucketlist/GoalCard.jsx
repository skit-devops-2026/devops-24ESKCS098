
const GoalCard = ({ goal }) => {
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

          <p className="text-base font-hanken">
            {goal.description}
          </p>

          {goal.participants && (
            <div className="flex -space-x-3 mt-5">
              {goal.participants.map((p) => {
                const colors = {
                  A: '#ffed00',
                  S: '#bdf2ff',
                  J: 'white',
                };

                return (
                  <div
                    key={p}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-black text-xs font-bold object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                    style={{
                      backgroundColor: colors[p] || '#ccc',
                    }}
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

          <h3 className="font-bricolage font-bold text-2xl mt-4 mb-3">
            {goal.title}
          </h3>

          <p className="text-base text-gray-700 font-hanken">
            {goal.description}
          </p>
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

  return (
    <div className="border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col bg-white hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer">
      <div className="p-8 flex-1">
        <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
          {goal.category}
        </span>

        <h3 className="font-bricolage font-bold text-2xl mt-4 mb-3">
          {goal.title}
        </h3>

        <p className="text-base text-gray-700 font-hanken">
          {goal.description}
        </p>
      </div>

      <div className="bg-[#ffed00] px-8 h-[56px] flex justify-between items-center text-xs font-space font-bold uppercase border-t-3 border-black">
        <span>In Progress</span>
        <span>{goal.progress}%</span>
      </div>
    </div>
  );
};

export default GoalCard;
