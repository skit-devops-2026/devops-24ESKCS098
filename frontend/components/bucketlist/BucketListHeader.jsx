
const BucketListHeader = ({ totalGoals }) => {
  return (
    <div className="flex items-start justify-between mb-8 gap-6">
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

        <h1 className="font-bricolage text-6xl font-extrabold uppercase tracking-tighter pl-6">
          Group Goals
        </h1>

        <p className="text-gray-700 mt-2 font-hanken font-medium text-lg pl-6">
          Conquer the world one epic moment at a time.
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
          {totalGoals} ACTIVE
        </span>

        <div className="hidden sm:flex flex-col gap-2 ml-3">
          <span className="w-3 h-1 bg-black rounded-full -rotate-12" />
          <span className="w-4 h-1 bg-black rounded-full rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default BucketListHeader;
