import { useState } from 'react';
import GoalCard from './GoalCard';
import GoalDetailModal from './GoalDetailModal';
import AddGoalCard from './AddGoalCard';
import AddGoalForm from './AddGoalForm';
import GoalFilters from './GoalFilters';
import TeamRequestsPanel from './TeamRequestsPanel';
import { DEMO_USER_ID, DEMO_USER_NAME, STATUS_FILTERS } from './constants';
import { generateId } from './storage';

/**
 * Team Goals tab content.
 *
 * Props:
 *   teamGoals       – array of team goal objects
 *   setTeamGoals    – state setter
 *   teamRequests    – array of join-request objects
 *   setTeamRequests – state setter
 *   activeFilter    – status filter key
 *   setActiveFilter – status filter setter
 *   activeCategory  – category filter key
 *   setActiveCategory – category filter setter
 */
function TeamGoalsView({
  teamGoals,
  setTeamGoals,
  teamRequests,
  setTeamRequests,
  activeFilter = 'all',
  setActiveFilter,
  activeCategory = 'all',
  setActiveCategory,
}) {
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Count goals where the demo user is admin
  const adminGoals = teamGoals.filter(
    (g) => g.createdBy === DEMO_USER_ID
  );

  const pendingForMe = teamRequests.filter((r) =>
    adminGoals.some((g) => g.id === r.goalId)
  );

  const handleAddGoal = (goalData) => {
    const newGoal = {
      ...goalData,
      id: generateId('t'),
      createdAt: new Date().toISOString(),
      createdBy: DEMO_USER_ID,
      visibility: 'public',
      members: [{ id: DEMO_USER_ID, name: DEMO_USER_NAME, role: 'admin' }],
    };
    setTeamGoals((prev) => [...prev, newGoal]);
    setShowForm(false);
  };

  const handleUpdateGoal = (updated) => {
    setTeamGoals((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g))
    );
    setSelectedGoal(updated);
  };

  const handleDeleteGoal = (id) => {
    setTeamGoals((prev) => prev.filter((g) => g.id !== id));
    // Also remove related requests
    setTeamRequests((prev) => prev.filter((r) => r.goalId !== id));
    setSelectedGoal(null);
  };

  const handleQuickStatus = (id, newStatus) => {
    setTeamGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: newStatus,
              progress: newStatus === 'completed' ? 100 : newStatus === 'not-started' ? 0 : g.progress,
            }
          : g
      )
    );
  };

  const handleJoinRequest = (goalId) => {
    // Check if a pending request already exists
    const exists = teamRequests.some(
      (r) => r.goalId === goalId && r.userId === 'member-new'
    );
    if (exists) return;

    const req = {
      id: generateId('req'),
      goalId,
      userId: 'member-new',
      userName: 'New Member (Demo)',
      message: "I'd like to join this goal!",
      createdAt: new Date().toISOString(),
    };
    setTeamRequests((prev) => [...prev, req]);
  };

  const handleApproveRequest = (reqId) => {
    const req = teamRequests.find((r) => r.id === reqId);
    if (!req) return;

    // Add the user to the goal's members
    setTeamGoals((prev) =>
      prev.map((g) => {
        if (g.id !== req.goalId) return g;
        const alreadyMember = g.members?.some((m) => m.id === req.userId);
        if (alreadyMember) return g;
        return {
          ...g,
          members: [
            ...(g.members || []),
            { id: req.userId, name: req.userName, role: 'member' },
          ],
        };
      })
    );

    // Remove the request
    setTeamRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const handleRejectRequest = (reqId) => {
    setTeamRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  const filteredTeamGoals = teamGoals.filter((g) => {
    const statusMatch =
      activeFilter === 'all' || g.status === activeFilter;
    const categoryMatch =
      activeCategory === 'all' || g.category === activeCategory;
    return statusMatch && categoryMatch;
  });

  const getCount = (key) =>
    key === 'all'
      ? teamGoals.length
      : teamGoals.filter((g) => g.status === key).length;

  return (
    <>
      {/* Pending requests panel (shown only if there are pending requests for admin goals) */}
      {pendingForMe.length > 0 && (
        <TeamRequestsPanel
          requests={pendingForMe}
          teamGoals={teamGoals}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      {/* Status filters */}
      <GoalFilters
        filters={STATUS_FILTERS}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        getCount={getCount}
      />

      {/* Team goals grid */}
      {filteredTeamGoals.length === 0 ? (
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
        />
      )}
    </>
  );
}

export default TeamGoalsView;
