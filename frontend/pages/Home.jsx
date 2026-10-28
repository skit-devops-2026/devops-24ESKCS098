import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SquadMembersWidget from '../components/squad/SquadMembersWidget';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getUserAvatar } from '../utils/avatar';

const FEATURED_COMMUNITY_QUESTS = [
  {
    id: 'fuji',
    title: 'Summit Mount Fuji at Sunrise',
    category: 'ADVENTURE',
    progress: 80,
    statusText: 'In Progress',
    membersCount: 6,
    imageUrl: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80',
    members: ['Alex Rivero', 'Elena Vance', 'Marco Polo', 'Sarah Chen'],
    tag: 'Trending',
    tagColor: 'bg-[#ffed00]',
  },
  {
    id: 'salsa',
    title: 'Learn Authentic Salsa & Bachata',
    category: 'SKILLS',
    progress: 60,
    statusText: 'In Progress',
    membersCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&q=80',
    members: ['Priya Sharma', 'Jordan Smith', 'Riya Sharma'],
    tag: 'Weekly Pick',
    tagColor: 'bg-[#e4006c] text-white',
  },
  {
    id: 'amalfi',
    title: 'Road Trip Through the Amalfi Coast',
    category: 'TRAVEL',
    progress: 100,
    statusText: 'Conquered',
    membersCount: 5,
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
    members: ['Elena Vance', 'Alex Rivero', 'Sarah Chen'],
    tag: 'Completed',
    tagColor: 'bg-[#bdf2ff]',
  },
];

function Home() {
  const { user, requireAuth } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 120,
    completed: 48,
    completionRate: 64,
  });
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyCompleted: 14,
    weeklyPhotos: 22,
    activeSquads: 5,
  });
  const [userQuests, setUserQuests] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const statsRes = await api.getBucketlistStats();
        if (isMounted && statsRes?.success && statsRes.stats) {
          setStats(statsRes.stats);
        }
      } catch (e) {
        // Fallback to initial display stats
      }

      try {
        const weeklyRes = await api.getWeeklyStats();
        if (isMounted && weeklyRes?.success) {
          setWeeklyStats({
            weeklyCompleted: weeklyRes.weeklyCompleted || 14,
            weeklyPhotos: weeklyRes.weeklyPhotos || 22,
            activeSquads: weeklyRes.activeSquads || 5,
          });
        }
      } catch (e) {
        // Fallback
      }

      if (user) {
        try {
          const goalsRes = await api.getPersonalGoals();
          if (isMounted && goalsRes?.success && Array.isArray(goalsRes.goals)) {
            setUserQuests(goalsRes.goals.slice(0, 3));
          }
        } catch (e) {
          // Fallback
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleQuestAction = () => {
    requireAuth(
      () => {
        navigate('/bucket-list');
      },
      { prompt: 'Log in or create a free account to join and track your quests!' }
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Authenticated User Quick Welcome Ribbon */}
      {user && (
        <div className="bg-[#FFFDF5] border-3 border-black p-6 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-3 border-black overflow-hidden bg-brand-yellow shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <img
                src={getUserAvatar(user, user.name)}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="inline-block bg-black text-white text-[11px] font-space font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                Active Quester
              </div>
              <h2 className="font-bricolage text-2xl font-black text-black">
                Welcome back, {user.name}! 🏔️
              </h2>
              <p className="font-hanken text-sm text-gray-700">
                You have {userQuests.filter((q) => q.status !== 'completed').length} active quest(s) on your radar. Keep up the momentum!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/bucket-list"
              className="px-6 py-2.5 bg-brand-yellow border-2 border-black font-space font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              My Bucket List &rarr;
            </Link>
            <Link
              to="/wall-of-fame"
              className="px-6 py-2.5 bg-black text-white border-2 border-black font-space font-bold text-xs uppercase rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              Wall of Fame
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-[#bdf2ff] border-3 border-black p-8 md:p-16 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center gap-12 overflow-hidden">
        {/* Left Content */}
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-block bg-[#686000] text-white px-4 py-1 border-2 border-black font-space font-bold uppercase text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            Level Up Your Life
          </div>
          <h1 className="text-5xl md:text-7xl font-bricolage font-extrabold tracking-tighter leading-tight text-black">
            Turn Your{' '}
            <span className="inline-block bg-[#ffed00] px-3 py-1 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 mx-1">
              Bucket List
            </span>{' '}
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
              id="hero-join-quest-btn"
              onClick={handleQuestAction}
              className="px-8 py-3 bg-[#e4006c] text-white font-space font-bold uppercase border-3 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              {user ? 'View My Quests' : 'Join a Quest'}
            </button>
            <Link
              to="/wall-of-fame"
              className="flex items-center gap-2 font-space font-bold uppercase text-black hover:text-[#e4006c] transition-colors group"
            >
              <div className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-full group-hover:border-[#e4006c] transition-colors">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4l12 6-12 6z" />
                </svg>
              </div>
              <span className="underline decoration-2 underline-offset-4">See Community Feed</span>
            </Link>
          </div>
        </div>

        {/* Right Content (Polaroids + Live Stats Badge) */}
        <div className="flex-1 relative h-[450px] w-full hidden md:block">
          {/* Polaroid 1 */}
          <div className="absolute top-4 right-12 w-64 bg-white p-3 border-3 border-black rotate-6 hover:rotate-12 hover:scale-105 transition-all duration-300 z-10 cursor-pointer shadow-brutal">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=400&q=80"
                alt="Adventure"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Mount Fuji Summit 🏔️</p>
          </div>
          {/* Polaroid 2 */}
          <div className="absolute top-28 right-40 w-64 bg-white p-3 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-6 hover:-rotate-12 hover:scale-105 transition-all duration-300 z-20 cursor-pointer">
            <div className="w-full h-48 bg-gray-200 border-2 border-black mb-3 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80"
                alt="Salsa"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="font-space font-bold text-center text-sm uppercase">Salsa Night 💃</p>
          </div>

          {/* Stats Badge */}
          <div className="absolute bottom-8 right-4 z-30 bg-[#ffed00] border-3 border-black p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rotate-3 hover:-rotate-3 transition-transform cursor-default">
            <p className="font-space font-bold uppercase text-xs text-black/70">Community Stats</p>
            <p className="font-bricolage font-extrabold text-3xl tracking-tight text-black">
              {stats.total > 0 ? stats.total : 45}+ <span className="text-xl">Quests</span>
            </p>
            <p className="font-mono text-xs font-bold text-black mt-1">
              🏆 {stats.completed || 18} Conquered ({stats.completionRate || 68}%)
            </p>
          </div>
        </div>
      </section>

      {/* Active Group Quests / Featured Quests */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-3 border-black pb-4 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bricolage font-extrabold uppercase tracking-tight text-black">
              {user && userQuests.length > 0 ? 'Your Active Quests' : 'Featured Community Quests'}
            </h2>
            <p className="font-hanken font-medium text-gray-700 mt-2">
              {user && userQuests.length > 0
                ? 'Track your progress and conquer milestones with your squads.'
                : 'Your team is waiting. Get moving on collective adventures!'}
            </p>
          </div>
          <Link
            to="/bucket-list"
            className="px-6 py-2 bg-[#ffed00] font-space font-bold uppercase text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all whitespace-nowrap"
          >
            View All Quests &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURED_COMMUNITY_QUESTS.map((quest, idx) => (
            <div
              key={quest.id}
              className={`bg-white border-3 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                idx === 0 ? '-rotate-1' : idx === 1 ? 'rotate-1' : 'rotate-0'
              } hover:rotate-0 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="relative w-full h-52 bg-gray-200 border-2 border-black mb-4 overflow-hidden group">
                  <span
                    className={`absolute top-2 left-2 ${quest.tagColor} border-2 border-black px-2 py-1 text-xs font-space font-bold uppercase z-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                  >
                    {quest.tag}
                  </span>
                  <img
                    src={quest.imageUrl}
                    alt={quest.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <h3 className="text-xl font-bricolage font-extrabold uppercase mb-2 text-black line-clamp-2">
                  {quest.title}
                </h3>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-space font-bold uppercase">
                    <span>{quest.statusText}</span>
                    <span className="text-[#e4006c]">{quest.progress}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-200 border-2 border-black rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-[#e4006c] rounded-full border-r-2 border-black transition-all duration-500"
                      style={{ width: `${quest.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-300">
                <div className="flex -space-x-2">
                  {quest.members.slice(0, 3).map((name, i) => (
                    <img
                      key={name}
                      src={getUserAvatar(i + 1, name)}
                      className="w-8 h-8 rounded-full border-2 border-black object-cover hover:z-10 hover:-translate-y-1 transition-transform"
                      alt={name}
                      title={name}
                    />
                  ))}
                  {quest.members.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-black bg-[#ffed00] flex items-center justify-center text-xs font-space font-bold hover:z-10 hover:-translate-y-1 transition-transform cursor-pointer">
                      +{quest.members.length - 3}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleQuestAction}
                  className="font-space font-bold uppercase text-sm underline decoration-2 underline-offset-2 hover:text-[#e4006c] transition-colors cursor-pointer"
                >
                  Open Quest &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Squad Community Roster */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-3 border-black pb-4 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bricolage font-extrabold uppercase tracking-tight text-black">
              Featured Squad Community
            </h2>
            <p className="font-hanken font-medium text-gray-700 mt-2">
              Meet the questers conquering summits and adventures together.
            </p>
          </div>
          <button
            type="button"
            onClick={handleQuestAction}
            className="px-6 py-2 bg-brand-pink text-white font-space font-bold uppercase text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all whitespace-nowrap cursor-pointer"
          >
            Join a Squad &rarr;
          </button>
        </div>

        <SquadMembersWidget
          squadName="Trip Squad ✈️"
          category="ADVENTURE"
          motto="6 globetrotters tackling summits, deep sea dives, and street food across 4 continents."
          joinCode="LQ-TRIP"
          onInvite={handleQuestAction}
          onLeave={() => navigate('/bucket-list')}
        />
      </section>
    </main>
  );
}

export default Home;

