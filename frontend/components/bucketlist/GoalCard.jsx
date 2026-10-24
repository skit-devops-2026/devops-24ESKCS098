import { statusLabel, formatDate, isOverdue, CATEGORY_COLOR_MAP } from './constants';

const STATUS_BAR = {
  'in-progress': {
    bg: 'bg-[#ffed00]',
    textClass: 'text-black',
  },
  'not-started': {
    bg: 'bg-gray-100',
    textClass: 'text-black',
  },
  completed: {
    bg: 'bg-black',
    textClass: 'text-white',
  },
};

const GoalCard = ({ goal, onClick, onQuickStatus }) => {
  const isCompleted = goal.status === 'completed';
  const barStyle = STATUS_BAR[goal.status] || STATUS_BAR['not-started'];
  const overdue = isOverdue(goal.deadline) && !isCompleted;

  const cardBg = isCompleted
    ? 'bg-[#e4006c] text-white'
    : 'bg-white';

  return (
    <div
      id={`goal-card-${goal.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onClick(goal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(goal);
        }
      }}
      className={`border-3 border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col ${cardBg} hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ffed00] focus:ring-offset-2`}
      aria-label={`Goal: ${goal.title}`}
    >
      {/* Body */}
      <div className="p-8 flex-1">
        {/* Top row: category + visibility */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-black text-white text-xs font-space font-bold px-2 py-1 rounded">
            {goal.category}
          </span>
          {goal.visibility === 'private' && (
            <span className="text-xs font-space font-bold px-2 py-1 rounded bg-gray-800 text-white flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Private
            </span>
          )}
          {overdue && (
            <span className="text-xs font-space font-bold px-2 py-1 rounded bg-[#ffdad6] text-[#93000a]">
              Overdue
            </span>
          )}
        </div>

        <h3
          className={`font-bricolage font-bold text-2xl mt-4 mb-2 ${
            isCompleted ? 'line-through decoration-2' : ''
          }`}
        >
          {goal.title}
        </h3>

        <p
          className={`text-base font-hanken line-clamp-2 ${
            isCompleted ? '' : 'text-gray-700'
          }`}
        >
          {goal.description}
        </p>

        {/* Deadline */}
        {goal.deadline && (
          <p className={`text-xs font-space font-bold mt-3 ${isCompleted ? 'text-white/70' : overdue ? 'text-[#93000a]' : 'text-black/50'}`}>
            Deadline: {formatDate(goal.deadline)}
          </p>
        )}

        {/* Progress bar for in-progress goals */}
        {goal.status === 'in-progress' && (
          <div className="mt-4">
            <div className="w-full h-3 bg-gray-200 rounded-full border border-black/20 overflow-hidden">
              <div
                className="h-full bg-[#ffed00] rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Team members (for team goals) */}
        {goal.members && goal.members.length > 0 && (
          <div className="flex -space-x-2 mt-4">
            {goal.members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className={`w-8 h-8 rounded-full border-2 ${isCompleted ? 'border-white' : 'border-black'} flex items-center justify-center text-xs font-bold bg-[#bdf2ff] text-black hover:z-10 hover:-translate-y-1 transition-transform`}
                title={m.name}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {goal.members.length > 5 && (
              <div className={`w-8 h-8 rounded-full border-2 ${isCompleted ? 'border-white' : 'border-black'} flex items-center justify-center text-xs font-bold bg-gray-200 text-black`}>
                +{goal.members.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div
        className={`${barStyle.bg} ${barStyle.textClass} px-8 h-[56px] flex justify-between items-center text-xs font-space font-bold uppercase border-t-3 ${isCompleted ? 'border-white/20' : 'border-black'}`}
      >
        <span>
          {statusLabel(goal.status)} {isCompleted && '✔'}
        </span>

        {goal.status === 'in-progress' && (
          <span>{goal.progress}%</span>
        )}

        {/* Quick status change buttons */}
        {goal.status === 'not-started' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickStatus(goal.id, 'in-progress');
            }}
            className="bg-[#e4006c] border-2 border-black px-3 py-1.5 rounded hover:bg-black text-white transition-colors"
            aria-label="Start this goal"
          >
            Start
          </button>
        )}
        {goal.status === 'in-progress' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickStatus(goal.id, 'completed');
            }}
            className="bg-black border-2 border-black px-3 py-1.5 rounded hover:bg-[#e4006c] text-white transition-colors ml-2"
            aria-label="Mark as completed"
          >
            Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;
