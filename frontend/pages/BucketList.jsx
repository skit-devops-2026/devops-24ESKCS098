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
import SquadMembersWidget from '../components/squad/SquadMembersWidget';

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
    id: 'fitness-freaks',
    name: 'Fitness Freaks 🏋️',
    members: 5,
    activeQuests: 8,
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=150&q=80',
    icon: '🏋️',
    bgColor: 'bg-brand-lime',
  },
  {
    id: 'family-adventure',
    name: 'Family Adventure 🏡',
    members: 5,
    activeQuests: 8,
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=150&q=80',
    icon: '🏡',
    bgColor: 'bg-brand-purple',
  },
];

function BucketList() {
  // ── Tab State: 'personal' | 'team' ──────────────────────────
  const [activeTab, setActiveTab] = useState('personal');

  // ── Squad State ─────────────────────────────────────────────
  const [squads, setSquads] = useState(INITIAL_SQUADS);
  const [activeSquadId, setActiveSquadId] = useState('trip-squad');
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // ── Personal Goals State (Persisted in localStorage) ────────
  const [goals, setGoals] = useState(() => loadPersonalGoals());
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [drawerGoal, setDrawerGoal] = useState(null);
  const [celebrateGoal, setCelebrateGoal] = useState(null);
  const [squadView, setSquadView] = useState('challenge'); // 'challenge' | 'roster'
  const currentSquad = squads.find((s) => s.id === activeSquadId) || squads[0];

  // ── Team Goals State (Persisted in localStorage) ────────────
  const [teamGoals, setTeamGoals] = useState(() => loadTeamGoals());
  const [teamRequests, setTeamRequests] = useState(() => loadTeamRequests());
  const [teamActiveFilter, setTeamActiveFilter] = useState('all');
  const [teamActiveCategory, setTeamActiveCategory] = useState('all');

  // ── Persist on change ────────────────────────────────────────
  useEffect(() => {
    savePersonalGoals(goals);
  }, [goals]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg, duration = 5000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), duration);
  }, []);

  // ── Load squads ───────────────────────────────────────────────────────────
  const loadSquads = useCallback(async () => {
    setSquadsLoading(true);
    try {
      const data = await api.getSquads({ devUserId: DEV_USER_ID });
      const BG_COLORS = ['bg-brand-pink', 'bg-brand-cyan', 'bg-brand-lime', 'bg-brand-yellow', 'bg-brand-purple'];
      const mapped = (data.squads || []).map((s, idx) => {
        const emojiMatch = (s.name || '').match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
        const icon = s.icon || (emojiMatch ? emojiMatch[0] : (s.name ? s.name.trim().charAt(0).toUpperCase() : '👥'));
        return {
          id: s.id,
          name: s.name,
          members: s.members || 1,
          activeQuests: s.active_quests || 0,
          unreadCount: 0,
          joinCode: s.join_code,
          avatar: s.cover_url || null,
          icon,
          bgColor: s.bg_color || BG_COLORS[idx % BG_COLORS.length],
          userRole: s.user_role,
        };
      });
      setSquads(mapped);
      if (mapped.length && !activeSquadId) {
        setActiveSquadId(mapped[0].id);
      }
    } catch {
      // Squad loading failure is not fatal — we just show an empty sidebar
      setSquads([]);
    } finally {
      setSquadsLoading(false);
    }
  }, [activeSquadId]);

  // ── Load personal goals ───────────────────────────────────────────────────
  const loadPersonalGoals = useCallback(async () => {
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const data = await api.getPersonalGoals({ devUserId: DEV_USER_ID });
      setGoals(data.goals || []);
    } catch (err) {
      setGoalsError(err.message || 'Could not load your goals. Check backend connection.');
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  // ── Load team goals for active squad ─────────────────────────────────────
  const loadTeamGoals = useCallback(async (squadId) => {
    if (!squadId) return;
    setTeamGoalsLoading(true);
    setTeamGoalsError(null);
    try {
      const data = await api.getTeamGoals(squadId, { devUserId: DEV_USER_ID });
      setTeamGoals(data.goals || []);
    } catch (err) {
      setTeamGoalsError(err.message || 'Could not load team goals.');
    } finally {
      setTeamGoalsLoading(false);
    }
  }, []);

  // ── Initial fetch ─────────────────────────────────────────────────────────
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

  const handleDeleteGoal = async (id) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.deletePersonalGoal(id, { devUserId: DEV_USER_ID });
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setSelectedGoal(null);
      showToast('🗑️ Goal deleted.');
    } catch (err) {
      showToast(`❌ Failed to delete goal: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (id, newStatus) => {
    const progress =
      newStatus === 'completed' ? 100 : newStatus === 'not-started' ? 0 : undefined;
    const saved = await handleStatusUpdate(id, newStatus, progress);
    if (saved && newStatus === 'completed') {
      setCelebrateGoal(saved);
    }
  };

  const handleSaveProgress = async (updated, note) => {
    const isTeam =
      Boolean(updated.isTeamGoal) ||
      Boolean(updated.groupId) ||
      activeTab === 'team' ||
      teamGoals.some((g) => g.id === updated.id);
    const targetSquadId = updated.groupId || activeSquadId;

    if (isTeam && targetSquadId) {
      try {
        const data = await api.updateTeamGoalStatus(
          targetSquadId,
          updated.id,
          { status: updated.status, progress: updated.progress },
          { devUserId: DEV_USER_ID }
        );
        const saved = data.goal;

        if (note && note.trim()) {
          try {
            await api.updateMemberContribution(
              targetSquadId,
              updated.id,
              { progress: updated.progress, note: note.trim() },
              { devUserId: DEV_USER_ID }
            );
          } catch (e) {
            console.warn('Could not record contribution note:', e);
          }
        }

        setTeamGoals((prev) =>
          prev.map((g) => (g.id === saved.id ? { ...g, ...saved } : g))
        );
        showToast(`📈 Team progress updated to ${saved.progress}% for "${saved.title}"!`);
        if (saved.status === 'completed' || saved.progress === 100) {
          setCelebrateGoal(saved);
        }
      } catch (err) {
        showToast(`❌ Failed to update team goal progress: ${err.message}`, 6000);
      }
    } else {
      const saved = await handleStatusUpdate(updated.id, updated.status, updated.progress);
      if (saved) {
        showToast(`📈 Progress updated to ${saved.progress}% for "${saved.title}"!`);
        if (saved.status === 'completed' || saved.progress === 100) {
          setCelebrateGoal(saved);
        }
      }
    }
  };

  // ── Handlers: Squad ───────────────────────────────────────────────────────

  const handleCreateSquad = async (newSquadData) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await api.createSquad(
        { name: newSquadData.name, description: newSquadData.description || '' },
        { devUserId: DEV_USER_ID }
      );
      const squad = data.squad;
      const BG_COLORS = ['bg-brand-pink', 'bg-brand-cyan', 'bg-brand-lime', 'bg-brand-yellow', 'bg-brand-purple'];
      const emojiMatch = (squad.name || '').match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
      const icon = squad.icon || (emojiMatch ? emojiMatch[0] : (squad.name ? squad.name.trim().charAt(0).toUpperCase() : '👥'));
      const mapped = {
        id: squad.id,
        name: squad.name,
        members: squad.members || 1,
        activeQuests: 0,
        unreadCount: 0,
        joinCode: squad.join_code,
        avatar: squad.cover_url || null,
        icon,
        bgColor: BG_COLORS[squads.length % BG_COLORS.length],
        userRole: 'admin',
      };
      setSquads((prev) => [...prev, mapped]);
      setActiveSquadId(mapped.id);
      showToast(`🎉 Squad "${squad.name}" created! Join code: ${squad.join_code}`);
      setIsCreateSquadOpen(false);
    } catch (err) {
      showToast(`❌ Failed to create squad: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSquad = async (code) => {
    if (!code || !code.trim()) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      const data = await api.joinSquad(code.trim(), { devUserId: DEV_USER_ID });
      const squad = data.squad;
      const BG_COLORS = ['bg-brand-pink', 'bg-brand-cyan', 'bg-brand-lime', 'bg-brand-yellow', 'bg-brand-purple'];
      const emojiMatch = (squad.name || '').match(/(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u);
      const icon = squad.icon || (emojiMatch ? emojiMatch[0] : (squad.name ? squad.name.trim().charAt(0).toUpperCase() : '👥'));
      const mapped = {
        id: squad.id,
        name: squad.name,
        members: squad.members || 1,
        activeQuests: squad.active_quests || 0,
        unreadCount: 0,
        joinCode: squad.join_code,
        avatar: squad.cover_url || null,
        icon,
        bgColor: BG_COLORS[squads.length % BG_COLORS.length],
        userRole: squad.user_role || 'member',
      };
      setSquads((prev) => {
        const exists = prev.some((s) => s.id === mapped.id);
        if (exists) return prev.map((s) => (s.id === mapped.id ? mapped : s));
        return [...prev, mapped];
      });
      setActiveSquadId(mapped.id);
      setJoinCodeInput('');
      setJoinError(null);
      showToast(data.message || `🎉 Joined ${squad.name}!`);
    } catch (err) {
      setJoinError(err.message || 'Invalid join code. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveSquad = async (squadId) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.leaveSquad(squadId, { devUserId: DEV_USER_ID });
      const remaining = squads.filter((s) => s.id !== squadId);
      setSquads(remaining);
      setActiveSquadId(remaining.length > 0 ? remaining[0].id : null);
      setTeamGoals([]);
      showToast('🚪 Left the squad.');
    } catch (err) {
      showToast(`❌ Failed to leave squad: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handlers: Team Goals ──────────────────────────────────────────────────

  const handleAddTeamGoal = async (goalData) => {
    if (!activeSquadId || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.createTeamGoal(activeSquadId, goalData, { devUserId: DEV_USER_ID });
      setTeamGoals((prev) => [data.goal, ...prev]);
      showToast(`✅ Team goal "${data.goal.title}" created!`);
    } catch (err) {
      showToast(`❌ Failed to create team goal: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeamGoal = async (updated) => {
    if (!activeSquadId || submitting) return;
    setSubmitting(true);
    try {
      const data = await api.updateTeamGoal(
        activeSquadId,
        updated.id,
        {
          title: updated.title,
          description: updated.description,
          category: updated.category,
          difficulty: updated.difficulty,
          deadline: updated.deadline,
          priority: updated.priority,
        },
        { devUserId: DEV_USER_ID }
      );
      const saved = data.goal;
      setTeamGoals((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
      // Sync status/progress if changed
      if (updated.status !== saved.status || updated.progress !== saved.progress) {
        await handleUpdateTeamGoalStatus(saved.id, updated.status, updated.progress);
      }
    } catch (err) {
      showToast(`❌ Failed to update team goal: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeamGoalStatus = async (goalId, newStatus, progress) => {
    if (!activeSquadId) return;
    try {
      const data = await api.updateTeamGoalStatus(
        activeSquadId,
        goalId,
        { status: newStatus, progress },
        { devUserId: DEV_USER_ID }
      );
      const saved = data.goal;
      setTeamGoals((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
    } catch (err) {
      showToast(`❌ Team goal status update failed: ${err.message}`, 6000);
    }
  };

  const handleDeleteTeamGoal = async (id) => {
    if (!activeSquadId || submitting) return;
    setSubmitting(true);
    try {
      await api.deleteTeamGoal(activeSquadId, id, { devUserId: DEV_USER_ID });
      setTeamGoals((prev) => prev.filter((g) => g.id !== id));
      showToast('🗑️ Team goal deleted.');
    } catch (err) {
      showToast(`❌ Failed to delete team goal: ${err.message}`, 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSquad = (newSquad) => {
    setSquads((prev) => [
      ...prev,
      {
        ...newSquad,
        bgColor: newSquad.bgColor || 'bg-brand-yellow',
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
                className="w-6 h-6 bg-black text-white rounded brutal-border-sm flex items-center justify-center text-xs cursor-pointer hover:bg-neutral-800"
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

          {/* Squad Showcase: Active Challenge vs Squad Members Roster */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="inline-flex p-1 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <button
                  type="button"
                  id="squad-tab-challenge-btn"
                  onClick={() => setSquadView('challenge')}
                  className={`px-3.5 py-1.5 font-space font-bold text-xs uppercase rounded-lg transition-all cursor-pointer ${
                    squadView === 'challenge'
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                      : 'text-black hover:bg-neutral-100'
                  }`}
                >
                  🏔️ Active Squad Quest
                </button>
                <button
                  type="button"
                  id="squad-tab-roster-btn"
                  onClick={() => setSquadView('roster')}
                  className={`px-3.5 py-1.5 font-space font-bold text-xs uppercase rounded-lg transition-all cursor-pointer ${
                    squadView === 'roster'
                      ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                      : 'text-black hover:bg-neutral-100'
                  }`}
                >
                  👥 Squad Roster ({currentSquad?.name || 'Trip Squad'})
                </button>
              </div>

              {squadView === 'roster' && (
                <span className="font-mono text-xs font-bold text-neutral-600 hidden sm:inline">
                  Viewing Roster for {currentSquad?.name}
                </span>
              )}
            </div>

            {squadView === 'challenge' ? (
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
            ) : (
              <SquadMembersWidget
                squadName={currentSquad?.name || 'Trip Squad ✈️'}
                category="ADVENTURE"
                motto="Tackle shared goals, track progress together, and celebrate as a team."
                joinCode={currentSquad?.joinCode || currentSquad?.join_code || ''}
                onInvite={() => setIsCreateSquadOpen(true)}
                onLeave={() => {
                  if (currentSquad?.id) {
                    handleLeaveSquad(currentSquad.id);
                  }
                }}
              />
            )}
          </div>

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
                    setDrawerGoal({ ...g, isTeamGoal: false });
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
            activeSquadId ? (
              <TeamGoalsView
                squadId={activeSquadId}
                squadName={currentSquad?.name || 'Your Squad'}
                teamGoals={teamGoals}
                teamGoalsLoading={teamGoalsLoading}
                teamGoalsError={teamGoalsError}
                onRetry={() => loadTeamGoals(activeSquadId)}
                onAddGoal={handleAddTeamGoal}
                onUpdateGoal={handleUpdateTeamGoal}
                onDeleteGoal={handleDeleteTeamGoal}
                onQuickStatus={handleTeamQuickStatus}
                onOpenDrawer={(g) => {
                  setDrawerGoal({ ...g, groupId: activeSquadId, isTeamGoal: true });
                }}
                onCelebrate={(g) => {
                  setCelebrateGoal(g);
                }}
                activeFilter={teamActiveFilter}
                setActiveFilter={setTeamActiveFilter}
                activeCategory={teamActiveCategory}
                setActiveCategory={setTeamActiveCategory}
              />
            ) : (
              /* No squad selected — prompt user to create or join one */
              <div className="bg-white brutal-border-lg rounded-2xl shadow-brutal p-10 text-center space-y-6">
                <div className="text-6xl">👥</div>
                <div>
                  <h2 className="font-bricolage text-2xl font-extrabold mb-2">No Squad Selected</h2>
                  <p className="font-hanken text-gray-600 max-w-sm mx-auto">
                    Team goals belong to a squad. Create a new squad or join one with a code to get started.
                  </p>
                </div>

                {/* Join squad inline */}
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="flex gap-2">
                    <input
                      id="team-join-code-input"
                      type="text"
                      placeholder="Enter join code (e.g. LQ-TRIP)"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinSquad(joinCodeInput)}
                      className="flex-1 border-2 border-black rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                    <button
                      type="button"
                      id="team-join-squad-btn"
                      disabled={joinLoading || !joinCodeInput.trim()}
                      onClick={() => handleJoinSquad(joinCodeInput)}
                      className="bg-black text-white font-space font-bold text-xs px-4 py-2 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {joinLoading ? '...' : 'Join'}
                    </button>
                  </div>
                  {joinError && (
                    <p className="text-xs font-hanken text-red-600 font-medium">{joinError}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 max-w-xs mx-auto">
                  <div className="flex-1 h-px bg-black/20" />
                  <span className="font-mono text-xs text-black/40 font-bold">OR</span>
                  <div className="flex-1 h-px bg-black/20" />
                </div>

                <button
                  type="button"
                  id="team-create-squad-btn"
                  onClick={() => setIsCreateSquadOpen(true)}
                  className="bg-brand-yellow border-2 border-black rounded-lg px-6 py-3 font-space font-bold text-sm shadow-brutal hover:-translate-y-0.5 transition-all"
                >
                  + Create a New Squad
                </button>
              </div>
            )
          )}
        </div>
      </main>

      {/* Create Squad Modal */}
      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        onCreateSquad={handleCreateSquad}
        onJoinSquad={handleJoinSquad}
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
