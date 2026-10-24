import { useState } from 'react';

import BucketListHeader from '../components/bucketlist/BucketListHeader';
import GoalFilters from '../components/bucketlist/GoalFilters';
import GoalCard from '../components/bucketlist/GoalCard';
import AddGoalCard from '../components/bucketlist/AddGoalCard';
import AddGoalForm from '../components/bucketlist/AddGoalForm';
import SquadSidebar from '../components/sidebar/SquadSidebar';
import GroupChallengeBanner from '../components/challenge/GroupChallengeBanner';
import CreateSquadModal from '../components/squad/CreateSquadModal';

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

const GOALS = [
  {
    id: 1,
    status: 'in-progress',
    category: 'ADVENTURE',
    title: 'Summit Mount Fuji at Sunrise',
    description:
      'An epic 2-day trek to catch the dawn from the highest peak in Japan.',
    progress: 40,
  },
  {
    id: 2,
    status: 'not-started',
    category: 'SKILLS',
    title: 'Master 5 Authentic Pasta Recipes',
    description:
      'Weekly cooking workshop to learn carbonara and more from scratch.',
    progress: 0,
  },
  {
    id: 3,
    status: 'completed',
    category: 'TRAVEL',
    title: 'Road Trip Through the Amalfi Coast',
    description:
      '7 days, 3 friends, and an open-top vintage car. Done last summer.',
    progress: 100,
    participants: ['A', 'S', 'J'],
  },
];

const FILTERS = [
  { key: 'all', label: 'All', activeBg: 'bg-black text-white' },
  {
    key: 'in-progress',
    label: 'In Progress',
    activeBg: 'bg-[#ffed00] text-black',
  },
  {
    key: 'not-started',
    label: 'Not Started',
    activeBg: 'bg-[#bdf2ff] text-black',
  },
  {
    key: 'completed',
    label: 'Completed',
    activeBg: 'bg-[#ffdad6] text-black',
  },
];

function BucketList() {
  const [goals, setGoals] = useState(GOALS);
  const [squads, setSquads] = useState(INITIAL_SQUADS);
  const [activeSquadId, setActiveSquadId] = useState('trip-squad');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Apply both status filter and category filter
  const filteredGoals = goals.filter((goal) => {
    const matchesStatus = activeFilter === 'all' || goal.status === activeFilter;
    const matchesCategory = !selectedCategory || goal.category === selectedCategory;
    return matchesStatus && matchesCategory;
  });

  const getCount = (key) =>
    key === 'all'
      ? goals.length
      : goals.filter((goal) => goal.status === key).length;

  const handleAddGoal = (goal) => {
    setGoals((prevGoals) => [...prevGoals, goal]);
    setShowForm(false);
    setActiveFilter('all');
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
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
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

          <BucketListHeader totalGoals={goals.length} />

          {/* Group Challenge Banner */}
          <GroupChallengeBanner
            onLogCheckpoint={() => {/* TODO: open ProgressUpdateDrawer */}}
            onOpenDiscussion={() => {/* TODO: open discussion */}}
          />

          <GoalFilters
            filters={FILTERS}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}

            <AddGoalCard onClick={() => setShowForm(true)} />
          </div>
        </div>
      </main>

      {/* Step 5: Create Squad Modal */}
      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        onCreateSquad={handleCreateSquad}
      />
    </>
  );
}

export default BucketList;

