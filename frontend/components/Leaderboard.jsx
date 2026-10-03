import React from 'react';

const LEADERBOARD = [
  {
    rank: 1,
    medal: '🥇',
    name: 'Elena Vance',
    xp: '4,250 XP',
    bg: 'bg-[#ffed00]',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HSnRMBfUiKLTTVz-r9NlkIjnrrTThFp0IbPVXpLlNPgMWEAE_AzPF_3q1gKLdZtX-L2sM4DUopi_V0Ad3Pp8ksOmvEFDvrrAc2i_1iWfI_k6mumBPHLcfeYS02rfVIKx20CG7tpGJns9Vvf-XqJZpJqOwTAZypQz_Kep1VB4T3TxHsRD6mThSxw9ril9D1rQH_471vxMCpyXu39zev5Rr7-s3esElO6fB82dRXi7s6TWbsLAAaY9',
  },
  {
    rank: 2,
    medal: '🥈',
    name: 'Alex Rivero',
    xp: '3,910 XP',
    bg: 'bg-gray-100',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6',
  },
  {
    rank: 3,
    medal: '🥉',
    name: 'Priya Sharma',
    xp: '3,640 XP',
    bg: 'bg-[#ffdad6]',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
  },
];

function Leaderboard() {
  return (
    <div className="bg-white border-4 border-black rounded-xl p-6 flex flex-col gap-6 sticky top-24 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-4 border-black pb-4">
        <div className="w-10 h-10 shrink-0 bg-[#ffed00] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-12 hover:rotate-12 transition-transform cursor-default">
          <span className="text-lg">👑</span>
        </div>
        <h2 className="font-bricolage font-extrabold text-2xl xl:text-3xl uppercase tracking-tighter text-black">
          Top Questers
        </h2>
      </div>

      {/* Rankings */}
      <div className="flex flex-col gap-4">
        {LEADERBOARD.map((entry) => (
          <div
            key={entry.rank}
            className={`group relative flex items-center gap-4 p-3 ${entry.bg} border-3 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer`}
            style={{ zIndex: 40 - entry.rank * 10 }}
          >
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-12 transition-transform">
              {entry.medal}
            </div>
            <div className="w-12 h-12 shrink-0 border-2 border-black rounded-full overflow-hidden ml-2 bg-white">
              <img alt={entry.name} className="w-full h-full object-cover" src={entry.avatar} />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="font-bricolage font-bold uppercase text-base leading-tight text-black truncate">
                {entry.name}
              </h4>
              <p className="text-xs font-space font-bold text-black/70 uppercase">{entry.xp}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Your Status */}
      <div className="mt-4 p-5 bg-[#e4006c] text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1 -rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden z-40">
        <div className="absolute -right-4 -top-4 opacity-20 group-hover:rotate-45 transition-transform duration-700">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="10" cy="10" r="4" fill="white" />
            <circle cx="30" cy="10" r="4" fill="white" />
            <circle cx="50" cy="10" r="4" fill="white" />
            <circle cx="10" cy="30" r="4" fill="white" />
            <circle cx="30" cy="30" r="4" fill="white" />
            <circle cx="50" cy="30" r="4" fill="white" />
            <circle cx="10" cy="50" r="4" fill="white" />
            <circle cx="30" cy="50" r="4" fill="white" />
            <circle cx="50" cy="50" r="4" fill="white" />
          </svg>
        </div>
        <span className="font-space text-xs uppercase font-bold text-white/80 tracking-wider">
          Your Status
        </span>
        <div className="flex items-end justify-between relative z-10">
          <div className="flex items-center gap-4">
            <span className="font-bricolage text-4xl italic font-black text-[#ffed00]">#42</span>
            <div>
              <p className="font-bricolage font-bold uppercase text-xl leading-none">You</p>
              <p className="text-sm font-space font-bold mt-1">1,120 XP</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-1 transition-transform">
            <span className="font-black text-black">→</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full py-4 mt-2 bg-black text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(255,237,0,1)] font-space font-bold uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,237,0,1)] transition-all">
        View Full Rankings
      </button>
    </div>
  );
}

export default Leaderboard;
