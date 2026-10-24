import { useState, useEffect, useCallback } from 'react';

import BucketListHeader from '../components/bucketlist/BucketListHeader';
import GoalFilters from '../components/bucketlist/GoalFilters';
import GoalCard from '../components/bucketlist/GoalCard';
import AddGoalCard from '../components/bucketlist/AddGoalCard';
import AddGoalForm from '../components/bucketlist/AddGoalForm';
import GoalDetailModal from '../components/bucketlist/GoalDetailModal';
import TeamGoalsView from '../components/bucketlist/TeamGoalsView';
import SquadSidebar from '../components/sidebar/SquadSidebar';
import GroupChallengeBanner from '../components/challenge/GroupChallengeBanner';
import CreateSquadModal from '../components/squad/CreateSquadModal';
import ProgressUpdateDrawer from '../components/bucketlist/ProgressUpdateDrawer';
import QuestCompletionModal from '../components/celebration/QuestCompletionModal';

import { STATUS_FILTERS } from '../components/bucketlist/constants';
import {
  loadPersonalGoals,
  savePersonalGoals,
  loadTeamGoals,
  saveTeamGoals,
  loadTeamRequests,
  saveTeamRequests,
  generateId,
} from '../components/bucketlist/storage';

const INITIAL_SQUADS = [
  {
    id: 'trip-squad',
    name: 'Trip Squad ✈️',
    members: 6,
    activeQuests: 12,
    unreadCount: 3,
    avatar: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=150&q=80',
    bgColor: 'bg-brand-pink',
  },
  {
    id: 'college-gang',
    name: 'College Gang 🎓',
    members: 4,
    activeQuests: 5,
    unreadCount: 1,
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&q=80',
    bgColor: 'bg-brand-cyan',
  },
  {
    id: 'family-adventure',
    name: 'Family Adventure 🏡',
    members: 5,
    activeQuests: 8,
    unreadCount: 0,
    avatar: null,
    icon: '🏡',
    bgColor: 'bg-brand-lime',
  },
];

function BucketList() {
  // ── Tab State: 'personal' | 'team' ──────────────────────────
  const [activeTab, setActiveTab] = useState('personal');

  // ── Squad State ─────────────────────────────────────────────
  const [squads, setSquads] = useState(INITIAL_SQUADS);
  const [activeSquadId, setActiveSquadId] = useState('trip-squad');
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // ── Personal Goals State (Persisted in localStorage) ────────
  const [goals, setGoals] = useState(() => loadPersonalGoals());
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [drawerGoal, setDrawerGoal] = useState(null);
  const [celebrateGoal, setCelebrateGoal] = useState(null);

  // ── Team Goals State (Persisted in localStorage) ────────────
  const [teamGoals, setTeamGoals] = useState(() => loadTeamGoals());
  const [teamRequests, setTeamRequests] = useState(() => loadTeamRequests());
  const [teamActiveFilter, setTeamActiveFilter] = useState('all');
  const [teamActiveCategory, setTeamActiveCategory] = useState('all');

  // ── Persist on change ────────────────────────────────────────
  useEffect(() => {
    savePersonalGoals(goals);
  }, [goals]);

  useEffect(() => {
    saveTeamGoals(teamGoals);
  }, [teamGoals]);

  useEffect(() => {
    saveTeamRequests(teamRequests);
  }, [teamRequests]);

  // ── Filtering (personal goals) ───────────────────────────────
  const filteredGoals = goals.filter((goal) => {
    const statusMatch =
      activeFilter === 'all' || goal.status === activeFilter;
    const categoryMatch =
      activeCategory === 'all' || goal.category === activeCategory;
    return statusMatch && categoryMatch;
  });

  const getCount = useCallback(
    (key) =>
      key === 'all'
        ? goals.length
        : goals.filter((g) => g.status === key).length,
    [goals]
  );

  // ── Handlers ────────────────────────────────────────────────
  const handleAddGoal = (goalData) => {
    const newGoal = {
      ...goalData,
      id: generateId('p'),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [...prev, newGoal]);
    setShowForm(false);
    setActiveFilter('all');
    setActiveCategory('all');
  };

  const handleUpdateGoal = (updated) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g))
    );
    setSelectedGoal(updated);
  };

  const handleDeleteGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setSelectedGoal(null);
  };

  const handleQuickStatus = (id, newStatus) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const updated = {
            ...g,
            status: newStatus,
            progress:
              newStatus === 'completed'
                ? 100
                : newStatus === 'not-started'
                ? 0
                : g.progress,
          };
          if (newStatus === 'completed') {
            setCelebrateGoal(updated);
          }
          return updated;
        }
        return g;
      })
    );
  };

  const handleCreateSquad = (newSquad) => {
    setSquads((prev) => [
      ...prev,
      {
        ...newSquad,
        bgColor: 'bg-brand-yellow',
      },
    ]);
    setActiveSquadId(newSquad.id);
    setToastMessage(`🎉 Squad "${newSquad.name}" created! Join code: ${newSquad.joinCode}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <>
      <style>{`
        body {
          position: relative;
          overflow-x: hidden;
        }

        body::before {
          content: "";
          position: fixed;
          inset: -10%;
          z-index: -1;
          background:
            radial-gradient(circle at 20% 20%, rgba(228, 0, 108, 0.03), transparent 42%),
            radial-gradient(circle at 80% 15%, rgba(255, 237, 0, 0.04), transparent 42%),
            radial-gradient(circle at 30% 80%, rgba(189, 242, 255, 0.05), transparent 48%),
            radial-gradient(circle at 85% 85%, rgba(228, 0, 108, 0.03), transparent 42%);
          background-size: 180% 180%;
          animation: gradientDrift 10s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes gradientDrift {
          0% {
            background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%;
            transform: scale(1) rotate(0deg);
          }
          33% {
            background-position: 40% 30%, 55% 45%, 30% 60%, 65% 70%;
            transform: scale(1.08) rotate(1deg);
          }
          66% {
            background-position: 15% 55%, 80% 20%, 55% 85%, 90% 55%;
            transform: scale(1.04) rotate(-1deg);
          }
          100% {
            background-position: 0% 0%, 100% 0%, 0% 100%, 100% 100%;
            transform: scale(1) rotate(0deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          body::before {
            animation: none;
          }
        }
      `}</style>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 flex gap-8">
        {/* Sidebar: Squad Switcher + Category Filters */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24">
            <SquadSidebar
              squads={squads}
              activeSquadId={activeSquadId}
              onSelectSquad={setActiveSquadId}
              selectedCategory={activeCategory === 'all' ? null : activeCategory}
              onSelectCategory={(cat) => setActiveCategory(cat || 'all')}
              onAddGroupClick={() => setIsCreateSquadOpen(true)}
            />
          </div>
        </aside>

        <div className="flex-1 space-y-8">
          {/* Squad Creation Toast */}
          {toastMessage && (
            <div className="p-4 bg-brand-yellow brutal-border-lg rounded-xl shadow-brutal flex items-center justify-between font-mono text-xs font-black animate-in slide-in-from-top-4">
              <div className="flex items-center gap-2 text-black">
                <span className="material-symbols-outlined text-xl">celebration</span>
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="w-6 h-6 bg-black text-white rounded brutal-border-sm flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Header with Personal vs Team Tab Switcher */}
          <BucketListHeader
            totalGoals={
              activeTab === 'personal' ? goals.length : teamGoals.length
            }
            activeTab={activeTab}
            onTabChange={setActiveTab}
            teamGoalCount={teamGoals.length}
          />

          {/* Group Challenge Banner */}
          <GroupChallengeBanner
            onLogCheckpoint={() => {
              const activeGoal = goals.find((g) => g.status === 'in-progress') || goals[0] || {
                id: 'challenge-mt-fuji',
                title: 'Summit Mount Fuji at Sunrise 🏔️',
                description: 'Shared milestone challenge! Complete collective altitude checkpoints, gear prep checks, and endurance runs.',
                category: 'ADVENTURE',
                progress: 80,
                status: 'in-progress',
              };
              setDrawerGoal(activeGoal);
            }}
            onOpenDiscussion={() => {
              setToastMessage('💬 Squad discussion thread opened for Mt. Fuji summit quest!');
              setTimeout(() => setToastMessage(null), 4000);
            }}
          />

          {activeTab === 'personal' ? (
            /* ────── PERSONAL GOALS TAB ────── */
            <>
              <GoalFilters
                filters={STATUS_FILTERS}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                getCount={getCount}
              />

              {showForm && (
                <AddGoalForm
                  onAdd={handleAddGoal}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {filteredGoals.length === 0 ? (
                <div className="text-center py-16 bg-white brutal-border-lg rounded-xl shadow-brutal p-8">
                  <p className="font-bricolage text-2xl font-bold mb-2">
                    {goals.length === 0
                      ? 'No goals yet'
                      : 'No goals match your filters'}
                  </p>
                  <p className="text-gray-600 font-hanken mb-6">
                    {goals.length === 0
                      ? 'Create your first goal to get started!'
                      : 'Try changing the status or category filter.'}
                  </p>
                  {goals.length === 0 && (
                    <div className="flex justify-center">
                      <AddGoalCard onClick={() => setShowForm(true)} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={setSelectedGoal}
                      onQuickStatus={handleQuickStatus}
                    />
                  ))}
                  <AddGoalCard onClick={() => setShowForm(true)} />
                </div>
              )}

              {/* Goal Detail Modal (View, Edit, Checkpoints, Progress, Delete) */}
              {selectedGoal && (
                <GoalDetailModal
                  goal={selectedGoal}
                  onClose={() => setSelectedGoal(null)}
                  onUpdate={(updated) => {
                    handleUpdateGoal(updated);
                    if (updated.status === 'completed' && updated.progress === 100) {
                      setCelebrateGoal(updated);
                    }
                  }}
                  onDelete={handleDeleteGoal}
                  onOpenDrawer={(g) => {
                    setSelectedGoal(null);
                    setDrawerGoal(g);
                  }}
                  onCelebrate={(g) => {
                    setSelectedGoal(null);
                    setCelebrateGoal(g);
                  }}
                />
              )}
            </>
          ) : (
            /* ────── TEAM GOALS TAB ────── */
            <TeamGoalsView
              teamGoals={teamGoals}
              setTeamGoals={setTeamGoals}
              teamRequests={teamRequests}
              setTeamRequests={setTeamRequests}
              activeFilter={teamActiveFilter}
              setActiveFilter={setTeamActiveFilter}
              activeCategory={teamActiveCategory}
              setActiveCategory={setTeamActiveCategory}
            />
          )}
        </div>
      </main>

      {/* Create Squad Modal */}
      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        onCreateSquad={handleCreateSquad}
      />

      {/* Progress Update Drawer */}
      <ProgressUpdateDrawer
        isOpen={Boolean(drawerGoal)}
        goal={drawerGoal}
        onClose={() => setDrawerGoal(null)}
        onSaveProgress={(updated) => {
          handleUpdateGoal(updated);
          setToastMessage(`📈 Progress updated to ${updated.progress}% for "${updated.title}"!`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onOpenCelebration={(g) => {
          setDrawerGoal(null);
          setCelebrateGoal(g);
        }}
      />

      {/* Quest Completion Celebration Modal */}
      <QuestCompletionModal
        isOpen={Boolean(celebrateGoal)}
        goal={celebrateGoal}
        onClose={() => setCelebrateGoal(null)}
        onPostAchievement={(achievement) => {
          setToastMessage(`🎉 Quest "${achievement.badge}" posted to Wall of Fame! (+${achievement.xpEarned} XP)`);
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </>
  );
}

export default BucketList;
