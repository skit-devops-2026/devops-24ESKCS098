import { useState } from 'react';
import Leaderboard from '../components/Leaderboard';
import FeedCard from '../components/FeedCard';
import CelebrateQuestModal from '../components/walloffame/CelebrateQuestModal';
import FullLeaderboardModal from '../components/walloffame/FullLeaderboardModal';
import PersonalTrophyRoom from '../components/walloffame/PersonalTrophyRoom';
import ShareableCardModal from '../components/walloffame/ShareableCardModal';

const INITIAL_FEED_ITEMS = [
  {
    id: 1,
    filter: 'my-groups',
    category: 'ADVENTURE',
    badge: 'Marathon Finisher',
    badgeStyle: { background: '#ffed00', color: '#000000' },
    squadName: 'Trip Squad',
    name: 'Alex Rivero',
    subtitle: 'Just finished my first solo skydive from 15,000 ft! 🪂 The freefall was absolute madness.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    image: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
    likes: 128,
    hasLiked: false,
    comments: 24,
    xpEarned: 350,
    completionDate: 'Oct 24, 2026',
    statBadge: '15,000 ft altitude',
    taggedFriends: [{ name: 'Sarah Chen' }, { name: 'Marco Polo' }],
    reactions: ['🔥', '⭐', '🙌'],
    reactionCounts: { '🔥': 14, '⭐': 8, '🙌': 12, '🎉': 6 },
    userReaction: '🔥',
    commentList: [
      { name: 'Sarah Chen', color: 'text-[#e4006c]', text: 'Amazing job, you crushed it! 🚀', time: '45m ago' },
      { name: 'Marco Polo', color: 'text-[#686000]', text: "Total inspiration. Which one's next? 🌏", time: '30m ago' },
    ],
  },
  {
    id: 2,
    filter: 'this-week',
    category: 'TRAVEL',
    badge: 'Solo Trip Done',
    badgeStyle: { background: '#bdf2ff', color: '#000000' },
    squadName: 'College Gang',
    name: 'Priya Sharma',
    subtitle: 'Solo bike trip to Ladakh (Khardung La Pass), done and dusted! 🏍️ Cold winds, warm hearts.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKroliD1w9821e4wMugprqu-0L6bjkY-8_N78i2fngH6XgKItbRSKK6saCnLJcLRLH5vflxkhKeZamVfl_lKFMC0j4KnQx0gnVIWU3PG8yLo8jwi1jQzK2ohD5D3JUghYhLVC9yFABBoJulOi_lka-0njoaF4Mc8oedX9jcwDu-0pp0gV4PIuezXkXIBZD1GDlkRbpaPVDn5NkIqmXPfRaAXSTf5CpkmYK68wZGHnDZMfckuBYyWxw',
    image: 'https://wanderon-images.gumlet.io/blogs/new/2025/01/best-time-for-leh-ladakh-solo-bike-trip.jpg',
    likes: 96,
    hasLiked: true,
    comments: 11,
    xpEarned: 500,
    completionDate: 'Oct 22, 2026',
    statBadge: '7 days • 900 km',
    taggedFriends: [{ name: 'Riya Sharma' }],
    reactions: ['🔥', '👏', '🎉'],
    reactionCounts: { '🔥': 22, '👏': 15, '🎉': 9 },
    userReaction: null,
    commentList: [
      { name: 'Elena Vance', color: 'text-[#006877]', text: 'That view is unreal Priya! Proud of you!', time: '2h ago' },
    ],
  },
];

const FILTERS = [
  { key: 'all', label: 'All Quests', activeBg: 'bg-black text-white' },
  { key: 'my-groups', label: 'My Squads', activeBg: 'bg-[#bdf2ff] text-black' },
  { key: 'this-week', label: 'This Week', activeBg: 'bg-[#ffdad6] text-black' },
];

function WallOfFame() {
  const [viewMode, setViewMode] = useState('squad-feed'); // 'squad-feed' | 'trophy-room'
  const [feedItems, setFeedItems] = useState(INITIAL_FEED_ITEMS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCelebrateOpen, setIsCelebrateOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handlePostAchievement = (newItem) => {
    setFeedItems((prev) => [newItem, ...prev]);
    setToastMessage(`🎉 Achievement "${newItem.badge}" minted and posted to Wall of Fame! (+${newItem.xpEarned} XP)`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredItems =
    activeFilter === 'all'
      ? feedItems
      : feedItems.filter((item) => item.filter === activeFilter);

  return (
    <div className="p-4 sm:p-8 max-w-[1280px] mx-auto min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 p-4 bg-brand-yellow border-3 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between font-mono text-xs font-black animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-black">
            <span className="text-xl">🏆</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="w-6 h-6 bg-black text-white rounded flex items-center justify-center text-xs hover:bg-gray-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <section className="pt-8 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-3 border-black">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center text-3xl bg-brand-yellow border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 hover:rotate-3 transition-transform cursor-default">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-bricolage text-3xl md:text-5xl font-black tracking-tight leading-none text-black">
                WALL OF FAME
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-[#b4f8c8] text-black border-2 border-black rounded font-space font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Live Feed
              </span>
            </div>
            <p className="text-black/75 font-bricolage font-medium mt-1 text-sm md:text-base">
              Every completed quest, celebrated out loud with your squad.
            </p>
          </div>
        </div>

        {/* View Switcher & Action CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Section 4 View Switcher: Squad Feed vs Personal Trophy Room */}
          <div className="bg-white border-3 border-black p-1 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('squad-feed')}
              className={`px-3 py-1.5 font-space font-bold text-xs uppercase rounded-lg transition-all cursor-pointer ${
                viewMode === 'squad-feed'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              🌐 Squad Feed
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trophy-room')}
              className={`px-3 py-1.5 font-space font-bold text-xs uppercase rounded-lg transition-all cursor-pointer ${
                viewMode === 'trophy-room'
                  ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              🏆 My Trophy Room
            </button>
          </div>

          {/* "+ Post Achievement" Button */}
          <button
            type="button"
            onClick={() => setIsCelebrateOpen(true)}
            className="px-5 py-2.5 bg-[#e4006c] text-white border-3 border-black rounded-xl font-space font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center gap-2"
          >
            <span>+</span>
            <span>Post Achievement</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      {viewMode === 'squad-feed' ? (
        <div className="pt-8 space-y-8">
          {/* Feed Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5 font-space font-bold text-xs uppercase">
              {FILTERS.map(({ key, label, activeBg }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={`px-4 py-2 border-2 border-black rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer ${
                    activeFilter === key
                      ? activeBg
                      : 'bg-white text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-xs font-space font-bold text-black/60">
              Showing {filteredItems.length} epic accomplishments
            </div>
          </div>

          {/* Feed + Sticky Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Achievement Feed Column */}
            <section className="lg:col-span-2 flex flex-col gap-8">
              {filteredItems.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  onShare={(it) => setShareItem(it)}
                  onFriendClick={(name) => {
                    setToastMessage(`Viewing quests shared with @${name}`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                />
              ))}
            </section>

            {/* Leaderboard Column */}
            <aside className="lg:col-span-1">
              <Leaderboard onViewFullRankings={() => setIsLeaderboardOpen(true)} />
            </aside>
          </div>
        </div>
      ) : (
        /* Personal Achievement Log (Section 4) */
        <div className="pt-8">
          <PersonalTrophyRoom />
        </div>
      )}

      {/* Modals */}
      <CelebrateQuestModal
        isOpen={isCelebrateOpen}
        onClose={() => setIsCelebrateOpen(false)}
        onPostAchievement={handlePostAchievement}
      />

      <FullLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <ShareableCardModal
        isOpen={Boolean(shareItem)}
        item={shareItem}
        onClose={() => setShareItem(null)}
      />
    </div>
  );
}

export default WallOfFame;
