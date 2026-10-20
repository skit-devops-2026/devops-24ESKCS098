
import { useState } from 'react';

import BucketListHeader from '../components/bucketlist/BucketListHeader';
import GoalFilters from '../components/bucketlist/GoalFilters';
import GoalCard from '../components/bucketlist/GoalCard';
import AddGoalCard from '../components/bucketlist/AddGoalCard';

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
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredGoals =
    activeFilter === 'all'
      ? GOALS
      : GOALS.filter((goal) => goal.status === activeFilter);

  const getCount = (key) =>
    key === 'all'
      ? GOALS.length
      : GOALS.filter((goal) => goal.status === key).length;

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
        <aside className="hidden lg:block w-72 shrink-0" />

        <div className="flex-1">
          <BucketListHeader totalGoals={GOALS.length} />

          <GoalFilters
            filters={FILTERS}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            getCount={getCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}

            <AddGoalCard />
          </div>
        </div>
      </main>
    </>
  );
}

export default BucketList;
