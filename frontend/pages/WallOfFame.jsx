import { useState } from 'react';
import Leaderboard from '../components/Leaderboard';

const FEED_ITEMS = [
  {
    id: 1,
    filter: 'my-groups',
    badge: 'Marathon Finisher',
    badgeStyle: {},
    name: 'Alex Rivero',
    subtitle: 'Just finished my first solo skydive! • 1h ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGwAv94FtvOf1mF5L-lfyB9aCwx1UNQ9UZvMDaYLnF0Ur0kCnw2oaWvuL5NeYq7hKkBPahmlfZnsWDVUnb_znDz9i_h8AxB6MDwR0hueA2Huo7nCXAHNXPIwWABDmVo2czCGXfRAmsDWC4Gh60CGfArz2XGO6sgQ9mFBueM0TAcGb2xe77qz8PRvnZpGvKYAtnuvzTjW7I8qpgIXia-7OJ4_rmqjsTjHsM6xrQUyRJBtB4McTE6AR6',
    image: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    likes: 128,
    comments: 24,
    reactions: ['🔥', '⭐', '🙌'],
    commentList: [
      { name: 'Sarah Chen', color: 'text-secondary', text: 'Amazing job, you crushed it! 🚀' },
      { name: 'Marco Polo', color: 'text-primary', text: "Total inspiration. Which one's next? 🌏" },
    ],
  },
  {
    id: 2,
    filter: 'this-week',
    badge: 'Solo Trip Done',
    badgeStyle: { background: '#ffed00', color: '#736a00' },
    name: 'Priya Sharma',
    subtitle: 'Solo bike trip to Ladakh, done and dusted • 5h ago',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
    image: 'https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg',
    likes: 96,
    comments: 11,
    statBadge: '7 days • 900 km',
  },
];


const FILTERS = [
  { key: 'all', label: 'All', activeBg: 'bg-black text-white' },
  { key: 'my-groups', label: 'My Groups', activeBg: 'bg-[#bdf2ff] text-black' },
  { key: 'this-week', label: 'This Week', activeBg: 'bg-[#ffdad6] text-black' },
];

function WallOfFame() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredItems = activeFilter === 'all'
    ? FEED_ITEMS
    : FEED_ITEMS.filter((item) => item.filter === activeFilter);

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      {/* Page header */}
      <section className="pt-14 pb-8 flex flex-col items-start gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 flex items-center justify-center text-3xl bg-secondary-fixed border-3 border-on-surface rounded shadow-offset-mobile -rotate-2 hover:-translate-y-1 hover:rotate-2 transition-all duration-300 cursor-default">
            🏆
          </div>
          <div>
            <h1 className="font-bricolage text-display-xl-mobile tracking-tight leading-none">
              WALL OF FAME
            </h1>
            <p className="text-on-surface-variant font-bricolage font-medium mt-2">
              Every completed quest, celebrated out loud.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 font-space font-bold text-sm uppercase">
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
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Feed + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Achievement feed */}
        <section className="lg:col-span-2 flex flex-col gap-10">
          {filteredItems.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </section>

        {/* Leaderboard */}
        <section className="lg:col-span-1">
          <Leaderboard />
        </section>
      </div>
    </div>
  );
}

function FeedCard({ item }) {
  const rotateClass = item.id === 1 ? 'rotate-2' : '-rotate-2';

  return (
    <div
      className={`card flex flex-col gap-6 ${rotateClass} font-bricolage hover:rotate-0 hover:-translate-y-2 transition-all duration-300`}
    >
      <span
        className="sticker-label px-3 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        style={item.badgeStyle}
      >
        {item.badge}
      </span>

      <div className="flex items-center gap-4 mt-2">
        <div className="w-16 h-16 border-3 border-on-surface rounded shadow-offset-mobile overflow-hidden cursor-pointer hover:z-10 hover:-translate-y-1 transition-transform">
          <img alt={item.name} className="w-full h-full object-cover" src={item.avatar} />
        </div>
        <div>
          <h4 className="font-bricolage font-extrabold text-xl uppercase">{item.name}</h4>
          <p className="text-sm font-medium text-on-surface-variant">{item.subtitle}</p>
        </div>
      </div>

      <div className="h-64 border-3 border-on-surface rounded overflow-hidden shadow-offset-mobile group">
        <img
          alt="Achievement"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          src={item.image}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button className={`inline-flex items-center gap-1.5 px-5 py-2 border-2 border-on-surface ${item.id === 1 ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-lowest text-on-surface'} font-space font-bold text-label-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]`}>
            ❤️ {item.likes}
          </button>
          <button className="inline-flex items-center gap-1.5 px-5 py-2 border-2 border-on-surface bg-surface-container-lowest text-on-surface font-space font-bold text-label-bold rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
            💬 {item.comments}
          </button>
        </div>

        {item.reactions && (
          <div className="flex -space-x-2">
            {item.reactions.map((emoji, i) => {
              const bgs = ['bg-tertiary', 'bg-secondary', 'bg-primary'];
              return (
                <span
                  key={i}
                  className={`w-9 h-9 flex items-center justify-center text-lg ${bgs[i]} border-2 border-on-surface rounded-full hover:z-10 hover:-translate-y-1 transition-transform cursor-pointer`}
                >
                  {emoji}
                </span>
              );
            })}
          </div>
        )}

        {item.statBadge && (
          <span className="inline-block px-4 py-1.5 bg-[#bdf2ff] text-[#006874] border-2 border-black rounded-full font-space font-bold text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {item.statBadge}
          </span>
        )}
      </div>

      {item.commentList && (
        <div className="flex flex-col gap-2 pt-4 border-t-2 border-on-surface text-sm font-medium">
          {item.commentList.map((c, i) => (
            <p key={i}>
              <span className={`font-bricolage font-extrabold uppercase ${c.color}`}>{c.name}:</span>{' '}
              {c.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default WallOfFame;
