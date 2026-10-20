
const AddGoalCard = () => {
  return (
    <div className="group border-3 border-dashed border-black rounded-xl flex flex-col items-center justify-center gap-3 p-8 min-h-[220px] hover:bg-white hover:border-solid hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="group-hover:rotate-90 transition-transform duration-300 w-12 h-12 rounded-full border-3 border-black flex items-center justify-center bg-[#ffed00]">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>

      <p className="font-space font-bold uppercase text-sm">
        Add New Goal
      </p>
    </div>
  );
};

export default AddGoalCard;
