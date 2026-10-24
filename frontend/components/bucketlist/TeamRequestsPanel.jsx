import { formatDate } from './constants';

/**
 * Panel showing pending join-requests for team goals the demo user admins.
 */
function TeamRequestsPanel({ requests, teamGoals, onApprove, onReject }) {
  if (!requests || requests.length === 0) return null;

  const goalName = (goalId) => {
    const g = teamGoals.find((t) => t.id === goalId);
    return g ? g.title : 'Unknown Goal';
  };

  return (
    <div className="mb-8 bg-[#fffdf5] border-3 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#e4006c] border-2 border-black flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
          </svg>
        </div>
        <h3 className="font-bricolage font-bold text-lg">
          Pending Join Requests ({requests.length})
        </h3>
      </div>

      <div className="space-y-3">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-black rounded-lg p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-space font-bold text-sm">
                {req.userName}
              </p>
              <p className="text-xs text-gray-600 font-hanken truncate">
                wants to join <span className="font-bold">{goalName(req.goalId)}</span>
              </p>
              {req.message && (
                <p className="text-xs text-gray-500 font-hanken mt-1 italic">
                  "{req.message}"
                </p>
              )}
              <p className="text-[10px] text-gray-400 font-space mt-1">
                {formatDate(req.createdAt)}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onApprove(req.id)}
                className="bg-[#d9f99d] border-2 border-black rounded-lg px-4 py-2 text-xs font-space font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(req.id)}
                className="bg-[#ffdad6] text-[#93000a] border-2 border-black rounded-lg px-4 py-2 text-xs font-space font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 font-hanken mt-3 italic">
        ⓘ This is a local demo simulation. Join requests do not work across users or devices.
      </p>
    </div>
  );
}

export default TeamRequestsPanel;
