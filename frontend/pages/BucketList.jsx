import { useState, useEffect, useCallback } from 'react';

import BucketListHeader from '../components/bucketlist/BucketListHeader';
import GoalFilters from '../components/bucketlist/GoalFilters';
import GoalCard from '../components/bucketlist/GoalCard';
import AddGoalCard from '../components/bucketlist/AddGoalCard';
import AddGoalForm from '../components/bucketlist/AddGoalForm';
import GoalDetailModal from '../components/bucketlist/GoalDetailModal';
import TeamGoalsView from '../components/bucketlist/TeamGoalsView';
import { STATUS_FILTERS, CATEGORIES, DEMO_USER_ID } from '../components/bucketlist/constants';
import {
  loadPersonalGoals,
  savePersonalGoals,
  loadTeamGoals,
  saveTeamGoals,
  loadTeamRequests,
  saveTeamRequests,
  generateId,
} from '../components/bucketlist/storage';

function BucketList() {
  // ── State ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('personal');

  // Personal goals
  const [goals, setGoals] = useState(() => loadPersonalGoals());
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Team goals
  const [teamGoals, setTeamGoals] = useState(() => loadTeamGoals());
  const [teamRequests, setTeamRequests] = useState(() => loadTeamRequests());

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

  // ── Filtering (personal goals only) ──────────────────────────
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

  // ── Personal goal handlers ───────────────────────────────────
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
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: newStatus,
              progress:
                newStatus === 'completed'
                  ? 100
                  : newStatus === 'not-started'
                  ? 0
                  : g.progress,
            }
          : g
      )
    );
  };

  // Team goals filtering
  const [teamActiveFilter, setTeamActiveFilter] = useState('all');
  const [teamActiveCategory, setTeamActiveCategory] = useState('all');

  // Active dataset & filters depending on tab
  const currentGoals = activeTab === 'personal' ? goals : teamGoals;
  const currentActiveCategory =
    activeTab === 'personal' ? activeCategory : teamActiveCategory;
  const setCurrentActiveCategory =
    activeTab === 'personal' ? setActiveCategory : setTeamActiveCategory;

  // Stat counts for current tab
  const currentTotal = currentGoals.length;
  const inProgressCount = currentGoals.filter(
    (g) => g.status === 'in-progress'
  ).length;
  const completedCount = currentGoals.filter(
    (g) => g.status === 'completed'
  ).length;
  const notStartedCount = currentGoals.filter(
    (g) => g.status === 'not-started'
  ).length;
  const completionPercentage =
    currentTotal > 0 ? Math.round((completedCount / currentTotal) * 100) : 0;

  // Extra team breakdown counts
  const myAdminGoalsCount = teamGoals.filter(
    (g) => g.createdBy === DEMO_USER_ID
  ).length;
  const myPendingRequestsCount = teamRequests.filter((r) =>
    teamGoals.some((g) => g.id === r.goalId && g.createdBy === DEMO_USER_ID)
  ).length;

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
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-28 space-y-4">
            {/* Quick Stats Card */}
            <div className="bg-white border-3 border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bricolage font-bold text-lg">
                  {activeTab === 'personal' ? 'Quick Stats' : 'Team Stats'}
                </h3>
                {activeTab === 'team' && (
                  <span className="text-[10px] bg-[#bdf2ff] border border-black font-space font-bold px-2 py-0.5 rounded-full">
                    SQUAD
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-hanken text-gray-600">
                    Total Goals
                  </span>
                  <span className="bg-black text-white font-space font-bold text-xs px-3 py-1 rounded-full">
                    {currentTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-hanken text-gray-600">
                    In Progress
                  </span>
                  <span className="bg-[#ffed00] font-space font-bold text-xs px-3 py-1 rounded-full border border-black">
                    {inProgressCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-hanken text-gray-600">
                    Completed
                  </span>
                  <span className="bg-[#e4006c] text-white font-space font-bold text-xs px-3 py-1 rounded-full border border-black">
                    {completedCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-hanken text-gray-600">
                    Not Started
                  </span>
                  <span className="bg-[#bdf2ff] font-space font-bold text-xs px-3 py-1 rounded-full border border-black">
                    {notStartedCount}
                  </span>
                </div>
              </div>

              {/* Completion percentage */}
              {currentTotal > 0 && (
                <div className="mt-5 pt-4 border-t-2 border-black/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-space font-bold uppercase">
                      Completion
                    </span>
                    <span className="text-xs font-space font-bold">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full border border-black/20 overflow-hidden">
                    <div
                      className="h-full bg-[#e4006c] rounded-full transition-all duration-500"
                      style={{
                        width: `${completionPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Extra team squad badge info */}
              {activeTab === 'team' && (
                <div className="mt-4 pt-3 border-t-2 border-dashed border-black/15 flex justify-between items-center text-xs font-space font-bold text-gray-700">
                  <span>Led by you:</span>
                  <span className="bg-[#ffed00] px-2 py-0.5 rounded border border-black">
                    {myAdminGoalsCount} goals
                  </span>
                </div>
              )}
            </div>

            {/* Categories Filter Card */}
            <div className="bg-white border-3 border-black rounded-xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bricolage font-bold text-base">
                  Categories
                </h3>
                {currentActiveCategory !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCurrentActiveCategory('all')}
                    className="text-[11px] font-space font-bold uppercase text-gray-500 hover:text-black hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 font-space font-bold text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentActiveCategory('all')}
                  className={`flex items-center justify-between px-3 py-2 border-2 border-black rounded-lg transition-all duration-150 text-left ${
                    currentActiveCategory === 'all'
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#fafafa] text-black hover:bg-yellow-50 hover:translate-x-[2px]'
                  }`}
                >
                  <span>All Categories</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border border-black ${
                      currentActiveCategory === 'all'
                        ? 'bg-white text-black'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    {currentTotal}
                  </span>
                </button>

                {CATEGORIES.map((c) => {
                  const catCount = currentGoals.filter(
                    (g) => g.category === c.value
                  ).length;
                  const isSelected = currentActiveCategory === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        setCurrentActiveCategory(isSelected ? 'all' : c.value)
                      }
                      className={`flex items-center justify-between px-3 py-2 border-2 border-black rounded-lg transition-all duration-150 text-left ${
                        isSelected
                          ? `${c.color} text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-extrabold`
                          : 'bg-[#fafafa] text-black hover:bg-gray-100 hover:translate-x-[2px]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full border border-black ${c.color}`}
                        />
                        {c.label}
                      </span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-black text-gray-700">
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <BucketListHeader
            totalGoals={
              activeTab === 'personal' ? goals.length : teamGoals.length
            }
            activeTab={activeTab}
            onTabChange={setActiveTab}
            teamGoalCount={teamGoals.length}
          />

          {activeTab === 'personal' ? (
            /* ────── PERSONAL GOALS ────── */
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
                <div className="text-center py-16">
                  <p className="font-bricolage text-2xl font-bold mb-2">
                    {goals.length === 0
                      ? 'No goals yet'
                      : 'No goals match your filters'}
                  </p>
                  <p className="text-gray-600 font-hanken">
                    {goals.length === 0
                      ? 'Create your first goal to get started!'
                      : 'Try changing the status or category filter.'}
                  </p>
                  {goals.length === 0 && (
                    <div className="mt-6 flex justify-center">
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

              {selectedGoal && (
                <GoalDetailModal
                  goal={selectedGoal}
                  onClose={() => setSelectedGoal(null)}
                  onUpdate={handleUpdateGoal}
                  onDelete={handleDeleteGoal}
                />
              )}
            </>
          ) : (
            /* ────── TEAM GOALS ────── */
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
    </>
  );
}

export default BucketList;
