import { useState } from 'react';
import GoalCard from './GoalCard';
import GoalDetailModal from './GoalDetailModal';
import AddGoalCard from './AddGoalCard';
import AddGoalForm from './AddGoalForm';
import GoalFilters from './GoalFilters';
import TeamRequestsPanel from './TeamRequestsPanel';
import { DEMO_USER_ID, DEMO_USER_NAME, STATUS_FILTERS } from './constants';

/**
 * Team Goals tab content.
 *
 * Accepts either the old localStorage-based props (for backward compatibility)
 * or the new API-driven props from BucketList.jsx.
 *
 * NEW API props (used when parent is BucketList.jsx):
 *   squadId             – the active squad's ID (required for API mode; gates goal creation)
 *   squadName           – human-readable squad name for context display
 *   teamGoals           – array of team goal objects from the API
 *   teamGoalsLoading    – boolean
 *   teamGoalsError      – string | null
 *   onRetry             – () => void
 *   onAddGoal           – async (goalData) => void
 *   onUpdateGoal        – async (updatedGoal) => void
 *   onDeleteGoal        – async (goalId) => void
 *   onQuickStatus       – async (goalId, newStatus) => void
 *
 * LEGACY props (kept for compatibility):
 *   setTeamGoals        – if provided, team goals are managed locally (old localStorage path)
 *   teamRequests / setTeamRequests – local request management (not yet API-backed)
 */
function TeamGoalsView({
  // Squad context (new required for API mode)
  squadId,
  squadName,

  // New API-driven interface
  teamGoals: teamGoalsProp,
  teamGoalsLoading = false,
  teamGoalsError = null,
  onRetry,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onQuickStatus,
  onOpenDrawer,
  onCelebrate,

  // Legacy local-state interface (still supported if caller passes setTeamGoals)
  setTeamGoals,
  teamRequests: teamRequestsProp = [],
  setTeamRequests,

  // Shared filter state
  activeFilter = 'all',
  setActiveFilter,
  activeCategory = 'all',
  setActiveCategory,
}) {
  const isApiMode = typeof onAddGoal === 'function';

  // Local state for the legacy path
  const [localTeamGoals, setLocalTeamGoals] = useState(teamGoalsProp || []);
  const [localRequests, setLocalRequests] = useState(teamRequestsProp || []);

  const teamGoals = isApiMode ? (teamGoalsProp || []) : localTeamGoals;
  const teamRequests = isApiMode ? [] : localRequests;

  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Count goals where the demo user is admin (only meaningful in legacy mode)
  const adminGoals = teamGoals.filter((g) => g.createdBy === DEMO_USER_ID);
  const pendingForMe = teamRequests.filter((r) =>
    adminGoals.some((g) => g.id === r.goalId)
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddGoal = async (goalData) => {
    if (isApiMode) {
      await onAddGoal(goalData);
      setShowForm(false);
    } else {
      const newGoal = {
        ...goalData,
        id: `t-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: DEMO_USER_ID,
        visibility: 'public',
        members: [{ id: DEMO_USER_ID, name: DEMO_USER_NAME, role: 'admin' }],
      };
      const updated = [newGoal, ...localTeamGoals];
      setLocalTeamGoals(updated);
      setTeamGoals?.(updated);
      setShowForm(false);
    }
  };

  const handleUpdateGoal = async (updated) => {
    if (isApiMode) {
      await onUpdateGoal(updated);
      setSelectedGoal(updated);
    } else {
      const next = localTeamGoals.map((g) => (g.id === updated.id ? updated : g));
      setLocalTeamGoals(next);
      setTeamGoals?.(next);
      setSelectedGoal(updated);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (isApiMode) {
      await onDeleteGoal(id);
      setSelectedGoal(null);
    } else {
      const next = localTeamGoals.filter((g) => g.id !== id);
      setLocalTeamGoals(next);
      setTeamGoals?.(next);
      setLocalRequests((prev) => prev.filter((r) => r.goalId !== id));
      setTeamRequests?.((prev) => prev.filter((r) => r.goalId !== id));
      setSelectedGoal(null);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    if (isApiMode) {
      await onQuickStatus(id, newStatus);
    } else {
      const next = localTeamGoals.map((g) =>
        g.id === id
          ? {
              ...g,
              status: newStatus,
              progress: newStatus === 'completed' ? 100 : newStatus === 'not-started' ? 0 : g.progress,
            }
          : g
      );
      setLocalTeamGoals(next);
      setTeamGoals?.(next);
    }
  };

  // Legacy request handlers (not yet API-backed)
  const handleJoinRequest = (goalId) => {
    if (isApiMode) return; // not implemented via API yet
    const exists = localRequests.some((r) => r.goalId === goalId && r.userId === 'member-new');
    if (exists) return;
    const req = {
      id: `req-${Date.now()}`,
      goalId,
      userId: 'member-new',
      userName: 'New Member (Demo)',
      message: "I'd like to join this goal!",
      createdAt: new Date().toISOString(),
    };
    const next = [...localRequests, req];
    setLocalRequests(next);
    setTeamRequests?.(next);
  };

  const handleApproveRequest = (reqId) => {
    if (isApiMode) return;
    const req = localRequests.find((r) => r.id === reqId);
    if (!req) return;
    const next = localTeamGoals.map((g) => {
      if (g.id !== req.goalId) return g;
      const alreadyMember = g.members?.some((m) => m.id === req.userId);
      if (alreadyMember) return g;
      return {
        ...g,
        members: [...(g.members || []), { id: req.userId, name: req.userName, role: 'member' }],
      };
    });
    setLocalTeamGoals(next);
    setTeamGoals?.(next);
    const nextReqs = localRequests.filter((r) => r.id !== reqId);
    setLocalRequests(nextReqs);
    setTeamRequests?.(nextReqs);
  };

  const handleRejectRequest = (reqId) => {
    if (isApiMode) return;
    const next = localRequests.filter((r) => r.id !== reqId);
    setLocalRequests(next);
    setTeamRequests?.(next);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredTeamGoals = teamGoals.filter((g) => {
    const statusMatch = activeFilter === 'all' || g.status === activeFilter;
    const categoryMatch = activeCategory === 'all' || g.category === activeCategory;
    return statusMatch && categoryMatch;
  });

  const getCount = (key) =>
    key === 'all'
      ? teamGoals.length
      : teamGoals.filter((g) => g.status === key).length;

  return (
    <>
      {/* Pending requests panel (legacy demo only) */}
      {!isApiMode && pendingForMe.length > 0 && (
        <TeamRequestsPanel
          requests={pendingForMe}
          teamGoals={teamGoals}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      {/* Squad context badge (API mode) */}
      {isApiMode && squadName && (
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 bg-black text-brand-yellow font-space font-bold text-xs px-3 py-1 rounded-full border-2 border-black">
            👥 {squadName}
          </span>
          <span className="font-hanken text-xs text-gray-500">
            Team goals shared with all squad members
          </span>
        </div>
      )}

      {/* Status filters */}
      <GoalFilters
        filters={STATUS_FILTERS}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        getCount={getCount}
      />

      {/* Loading state (API mode) */}
      {isApiMode && teamGoalsLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white animate-pulse"
            >
              <div className="p-8 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
              <div className="h-14 bg-gray-100 border-t-3 border-black" />
            </div>
          ))}
        </div>
      )}

      {/* Error state (API mode) */}
      {isApiMode && !teamGoalsLoading && teamGoalsError && (
        <div className="py-12 bg-[#ffdad6] border-3 border-black rounded-xl p-8 text-center space-y-4">
          <p className="font-bricolage text-xl font-bold">Failed to load team goals</p>
          <p className="font-hanken text-sm text-[#93000a]">{teamGoalsError}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="bg-black text-white font-space font-bold uppercase text-sm px-6 py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Goals grid */}
      {(!isApiMode || (!teamGoalsLoading && !teamGoalsError)) && (
        filteredTeamGoals.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-bricolage text-2xl font-bold mb-2">
              {teamGoals.length === 0
                ? 'No team goals yet'
                : 'No team goals match your filters'}
            </p>
            <p className="text-gray-600 font-hanken">
              {teamGoals.length === 0
                ? 'Create the first team goal to get started!'
                : 'Try changing the status or category filter.'}
            </p>
            {teamGoals.length === 0 && (
              <div className="mt-6 flex justify-center">
                <AddGoalCard onClick={() => setShowForm(true)} />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredTeamGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={setSelectedGoal}
                onQuickStatus={handleQuickStatus}
              />
            ))}
            <AddGoalCard onClick={() => setShowForm(true)} />
          </div>
        )
      )}

      {/* Add team goal modal */}
      {showForm && (
        <AddGoalForm
          isTeamGoal
          onAdd={handleAddGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Detail modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          isTeamGoal
          onClose={() => setSelectedGoal(null)}
          onUpdate={handleUpdateGoal}
          onDelete={handleDeleteGoal}
          onOpenDrawer={(g) => {
            setSelectedGoal(null);
            if (onOpenDrawer) onOpenDrawer(g);
          }}
          onCelebrate={(g) => {
            setSelectedGoal(null);
            if (onCelebrate) onCelebrate(g);
          }}
        />
      )}
    </>
  );
}

export default TeamGoalsView;
