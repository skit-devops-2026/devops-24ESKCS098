import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SquadMembersWidget from '../components/squad/SquadMembersWidget';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function Home() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [communityStats, setCommunityStats] = useState({
    count: 0,
    weeklyCompleted: 0,
    activeSquads: 0,
  });
  const [activeQuests, setActiveQuests] = useState([]);
  const [featuredSquad, setFeaturedSquad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        const [statsRes, feedRes, squadsRes] = await Promise.allSettled([
          api.getWeeklyStats(),
          api.getFeed('all', 1),
          api.getSquads(),
        ]);

        if (isMounted) {
          if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
            setCommunityStats({
              count: statsRes.value.count || 0,
              weeklyCompleted: statsRes.value.weeklyCompleted || statsRes.value.count || 0,
              activeSquads: statsRes.value.activeSquads || 0,
            });
          }

          if (feedRes.status === 'fulfilled' && feedRes.value?.success && Array.isArray(feedRes.value.posts)) {
            setActiveQuests(feedRes.value.posts.slice(0, 3));
          }

          if (squadsRes.status === 'fulfilled' && squadsRes.value?.success && Array.isArray(squadsRes.value.squads)) {
            if (squadsRes.value.squads.length > 0) {
              setFeaturedSquad(squadsRes.value.squads[0]);
            }
          }
        }
      } catch (err) {
        console.warn('[Home] Failed to load live community data:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleJoinQuestClick = () => {
    if (isAuthenticated) {
      navigate('/bucket-list');
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* Hero Section */}
      <section className="relative bg-[#bdf2ff] border-3 border-black p-8 md:p-16 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        {/* Left Content */}
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-block bg-[#686000] text-white px-4 py-1 border-2 border-black font-space font-bold uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Level Up Your Life
          </div>
          <h1 className="text-5xl md:text-7xl font-bricolage font-extrabold tracking-tighter leading-tight text-black">
            Turn Your
            <span className="inline-block bg-[#ffed00] px-3 py-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 mx-1">
              Bucket List
            </span>
            Into Shared Adventures.
          </h1>
          <p className="text-lg md:text-xl font-hanken text-gray-800 max-w-lg leading-relaxed font-medium">
            Don't just dream it. Quest it. Join a community of achievers, tackle
            goals together, and collect memories that feel like physical stickers
            on your soul.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={handleJoinQuestClick}
              className="px-8 py-3 bg-[#e4006c] text-white font-space font-bold uppercase border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              Join a Quest
            </button>
            <Link
              to="/wall-of-fame"
              className="flex items-center gap-2 font-space font-bold uppercase text-black hover:text-[#e4006c] transition-colors group"
            >
              <div className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full group-hover:border-[#e4006c] transition-colors">
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4l12 6-12 6z" />
                </svg>
              </div>
              <span className="underline decoration-2 underline-offset-4">Explore Wall of Fame</span>
            </Link>
          </div>
        </div>

        {/* Right Content (Polaroids & Real Community Stats) */}
        <div className="flex-1 relative h-[450px] w-full hidden md:block">
          <div className="absolute top-4 right-12 w-64 bg-white p-3 border-3 border-black rotate-6 hover:rotate-12 hover:scale-105 transition-all duration-300 z-10 cursor-pointer">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&q=80"
                alt="Adventure"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Mount Fuji Summit</p>
          </div>

          <div className="absolute top-28 right-40 w-64 bg-white p-3 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-6 hover:-rotate-12 hover:scale-105 transition-all duration-300 z-20 cursor-pointer">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80"
                alt="Salsa"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Ocean Deep Dive</p>
          </div>

          {/* Dynamic Stats Badge */}
          <div className="absolute bottom-10 right-4 z-30 bg-[#ffed00] border-3 border-black p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rotate-3 hover:-rotate-3 transition-transform cursor-default">
            <p className="font-space font-bold uppercase text-xs">Community Active</p>
            <p className="font-bricolage font-extrabold text-3xl tracking-tight">
              {communityStats.weeklyCompleted > 0 ? communityStats.weeklyCompleted : '10+'}{' '}
              <span className="text-xl">Quests</span>
            </p>
          </div>
        </div>
      </section>

      {/* Active Group Quests (Live from API) */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-3 border-black pb-4 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bricolage font-extrabold uppercase tracking-tight">
              Active Community Quests
            </h2>
            <p className="font-hanken font-medium text-gray-700 mt-2">
              Recent celebrations and achievements logged by questers.
            </p>
          </div>
          <Link
            to="/wall-of-fame"
            className="px-6 py-2 bg-[#ffed00] font-space font-bold uppercase text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all whitespace-nowrap"
          >
            View Wall of Fame &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 bg-gray-100 border-3 border-black rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activeQuests.length === 0 ? (
          <div className="p-12 text-center bg-white border-3 border-black rounded-xl">
            <p className="font-bricolage text-2xl font-black uppercase">Start the First Quest!</p>
            <p className="font-hanken text-gray-600 mt-2">Be the first adventurer to complete and share a conquest.</p>
            <button
              type="button"
              onClick={handleJoinQuestClick}
              className="mt-6 px-6 py-2.5 bg-brand-pink text-white font-space font-bold uppercase border-2 border-black rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              Create a Quest
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeQuests.map((quest, idx) => (
              <div
                key={quest.id}
                className={`bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  idx % 2 === 0 ? '-rotate-1' : 'rotate-1'
                } hover:rotate-0 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="relative w-full h-52 bg-gray-200 border-2 border-black mb-4 overflow-hidden group">
                    <span className="absolute top-2 left-2 bg-[#ffed00] border-2 border-black px-2 py-1 text-xs font-space font-bold uppercase z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {quest.badge || quest.badgeLabel || 'Conquest'}
                    </span>
                    {quest.image ? (
                      <img
                        src={quest.image}
                        alt={quest.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-yellow-100 text-4xl">
                        🏆
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bricolage font-extrabold uppercase mb-2 line-clamp-1">
                    {quest.title || quest.name}
                  </h3>
                  {quest.subtitle && (
                    <p className="font-hanken text-xs text-gray-700 line-clamp-2 italic mb-4">
                      "{quest.subtitle}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-dashed border-gray-300 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {quest.avatar && (
                      <img
                        src={quest.avatar}
                        alt={quest.name}
                        className="w-7 h-7 rounded-full border border-black object-cover"
                      />
                    )}
                    <span className="font-space font-bold text-xs">{quest.name}</span>
                  </div>
                  <span className="font-space font-black text-xs text-[#e4006c]">
                    +{quest.xpEarned || 250} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Squad Community Roster */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-3 border-black pb-4 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bricolage font-extrabold uppercase tracking-tight">
              Featured Squad Community
            </h2>
            <p className="font-hanken font-medium text-gray-700 mt-2">
              Meet the questers conquering summits and adventures together.
            </p>
          </div>
          <Link
            to="/bucket-list"
            className="px-6 py-2 bg-brand-pink text-white font-space font-bold uppercase text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all whitespace-nowrap"
          >
            Explore Squads &rarr;
          </Link>
        </div>

        <SquadMembersWidget
          squadId={featuredSquad?.id}
          squadName={featuredSquad?.name || 'Community Squad'}
          category={featuredSquad?.category || 'ADVENTURE'}
          motto={featuredSquad?.description || 'Collaborative team tackling epic milestones together.'}
          joinCode={featuredSquad?.joinCode || featuredSquad?.join_code || 'JOIN'}
        />
      </section>
    </main>
  );
}

export default Home;
