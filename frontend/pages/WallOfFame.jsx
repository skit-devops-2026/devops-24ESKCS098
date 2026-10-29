import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';
import FeedCard from '../components/FeedCard';
import CelebrateQuestModal from '../components/walloffame/CelebrateQuestModal';
import FullLeaderboardModal from '../components/walloffame/FullLeaderboardModal';
import PersonalTrophyRoom from '../components/walloffame/PersonalTrophyRoom';
import ShareableCardModal from '../components/walloffame/ShareableCardModal';

const FILTERS = [
  { key: 'all', label: 'All Quests', activeBg: 'bg-black text-white' },
  { key: 'my-groups', label: 'My Squads', activeBg: 'bg-[#bdf2ff] text-black' },
  { key: 'this-week', label: 'This Week', activeBg: 'bg-[#ffdad6] text-black' },
];

function WallOfFame() {
  const { isAuthenticated, currentUser, openAuthModal } = useAuth();
  const [viewMode, setViewMode] = useState('squad-feed'); // 'squad-feed' | 'trophy-room'
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeklyQuestsCount, setWeeklyQuestsCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isCelebrateOpen, setIsCelebrateOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [userXp, setUserXp] = useState(currentUser?.xp || 0);

  useEffect(() => {
    if (currentUser?.xp) {
      setUserXp(currentUser.xp);
    }
  }, [currentUser]);

  // Live MongoDB feed sync
  useEffect(() => {
    let isMounted = true;
    async function loadWallOfFameData() {
      setLoading(true);
      try {
        const [feedRes, statsRes] = await Promise.allSettled([
          api.getFeed(activeFilter),
          api.getWeeklyStats(),
        ]);

        if (isMounted) {
          if (feedRes.status === 'fulfilled' && feedRes.value?.success && Array.isArray(feedRes.value.posts)) {
            setFeedItems(feedRes.value.posts);
          }
          if (statsRes.status === 'fulfilled' && statsRes.value?.success && typeof statsRes.value.count === 'number') {
            setWeeklyQuestsCount(statsRes.value.count);
          }
        }
      } catch (err) {
        console.warn('[WallOfFame] Live backend fetch error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWallOfFameData();
    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const handlePostAchievement = async (newItem) => {
    const isSolo = newItem.squadName?.toLowerCase().includes('solo') || newItem.isSolo;
    const addedXp = Number(newItem.xpEarned) || 250;

    const createdItem = {
      ...newItem,
      id: Date.now(),
      name: currentUser?.name || 'You',
      avatar: currentUser?.avatar || '',
      isOwner: true,
      squadName: isSolo ? 'Solo Quest 👤' : (newItem.squadName || 'Squad Quest'),
      xpEarned: addedXp,
      completionDate: 'Just now',
    };

    setFeedItems((prev) => [createdItem, ...prev]);
    setUserXp((prev) => prev + addedXp);
    setWeeklyQuestsCount((prev) => prev + 1);

    setToastMessage(`🎉 Achievement "${newItem.badge}" minted and posted to Wall of Fame! (+${addedXp} XP)`);
    setTimeout(() => setToastMessage(null), 5000);

    // Persist to MongoDB
    try {
      const res = await api.createPost({
        title: newItem.title || newItem.badge || 'Conquered Quest',
        caption: newItem.subtitle || newItem.caption || '',
        badgeLabel: newItem.badge || 'Quest Conquered',
        statBadge: newItem.statBadge || 'Verified ⚡',
        imageUrls: newItem.image ? [newItem.image] : [],
        groupId: isSolo ? null : (newItem.groupId || 1),
        xp: addedXp,
        taggedUserIds: (newItem.taggedFriends || []).map((_, i) => i + 2),
      });

      if (res?.success && res.post) {
        const fresh = await api.getFeed(activeFilter);
        if (fresh?.success && Array.isArray(fresh.posts)) {
          setFeedItems(fresh.posts);
        }
      }
    } catch (err) {
      console.warn('[WallOfFame] Failed to persist post to MongoDB:', err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    const target = feedItems.find((p) => p.id === postId);
    const subXp = Number(target?.xpEarned || target?.xp) || 250;

    setFeedItems((prev) => prev.filter((p) => p.id !== postId));
    setUserXp((prev) => Math.max(0, prev - subXp));
    setWeeklyQuestsCount((prev) => Math.max(0, prev - 1));

    setToastMessage(`🗑️ Post deleted successfully! (-${subXp} XP)`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await api.deletePost(postId);
      const fresh = await api.getFeed(activeFilter);
      if (fresh?.success && Array.isArray(fresh.posts)) {
        setFeedItems(fresh.posts);
      }
    } catch (err) {
      console.warn('[WallOfFame] Failed to delete post on backend:', err.message);
    }
  };

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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-bricolage text-3xl md:text-5xl font-black tracking-tight leading-none text-black">
                WALL OF FAME
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 bg-[#b4f8c8] text-black border-2 border-black rounded font-space font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Live Feed
              </span>
              <span className="px-2.5 py-0.5 bg-[#ffed00] text-black border-2 border-black rounded font-space font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🔥 This Week: {weeklyQuestsCount} Quests
              </span>
            </div>
            <p className="text-black/75 font-bricolage font-medium mt-1 text-sm md:text-base">
              Every completed quest, celebrated out loud with your squad.
            </p>
          </div>
        </div>

        {/* View Switcher & Action CTA */}
        <div className="flex items-center gap-3 flex-wrap">
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

          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                setIsCelebrateOpen(true);
              } else {
                openAuthModal('login');
              }
            }}
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
              Showing {feedItems.length} epic accomplishments
            </div>
          </div>

          {/* Feed + Sticky Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Achievement Feed Column */}
            <section className="lg:col-span-2 flex flex-col gap-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2].map((n) => (
                    <div key={n} className="h-96 bg-white border-3 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-pulse" />
                  ))}
                </div>
              ) : feedItems.length === 0 ? (
                <div className="p-14 text-center bg-white border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                  <span className="text-5xl">⚡</span>
                  <h3 className="font-bricolage text-2xl font-black uppercase">No Posts Found</h3>
                  <p className="font-hanken text-gray-600 max-w-sm mx-auto">
                    {activeFilter === 'my-groups'
                      ? 'No posts from your squads yet. Complete a team goal or invite squad mates!'
                      : 'Be the first adventurer to share an accomplishment on the Wall of Fame!'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (isAuthenticated) setIsCelebrateOpen(true);
                      else openAuthModal('login');
                    }}
                    className="px-6 py-2.5 bg-brand-pink text-white font-space font-bold uppercase border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Post an Achievement
                  </button>
                </div>
              ) : (
                feedItems.map((item) => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    onShare={(it) => setShareItem(it)}
                    onDelete={handleDeletePost}
                    onFriendClick={(name) => {
                      setToastMessage(`Viewing quests shared with @${name}`);
                      setTimeout(() => setToastMessage(null), 3000);
                    }}
                  />
                ))
              )}
            </section>

            {/* Leaderboard Column */}
            <aside className="lg:col-span-1">
              <Leaderboard
                userXp={userXp}
                onViewFullRankings={() => setIsLeaderboardOpen(true)}
              />
            </aside>
          </div>
        </div>
      ) : (
        /* Personal Achievement Log */
        <div className="pt-8">
          {!isAuthenticated ? (
            <div className="bg-brand-canvas brutal-border-lg rounded-2xl shadow-brutal-xl p-8 md:p-14 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-brand-yellow brutal-border rounded-2xl shadow-brutal flex items-center justify-center mx-auto text-4xl -rotate-3">
                🏆
              </div>
              <div className="space-y-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider bg-black text-brand-yellow px-3 py-1 rounded inline-block">
                  TROPHY VAULT LOCKED ⚡
                </span>
                <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-neutral-900">
                  Your Personal Trophy Room
                </h2>
                <p className="font-hanken text-base text-neutral-700 max-w-md mx-auto">
                  Sign in or create a passport to showcase your minted badges, calculate your lifetime adventure XP, and inspect your completed achievements.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand-yellow hover:bg-[#ffe600] text-black font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all"
                >
                  Mint Free Passport ➔
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-black hover:bg-neutral-800 text-white font-space font-black uppercase text-sm brutal-border rounded-xl shadow-brutal hover:shadow-brutal-lg transition-all"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <PersonalTrophyRoom userXp={userXp} />
          )}
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
        userXp={userXp}
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
