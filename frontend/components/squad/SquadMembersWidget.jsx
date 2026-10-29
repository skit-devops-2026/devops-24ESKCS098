import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&q=80';

/**
 * Squad roster widget displaying member activity, roles, contribution totals,
 * and invite actions for collaborative questing groups.
 */
function SquadMembersWidget({
  squadId,
  squadName = 'Community Squad',
  category = 'ADVENTURE',
  motto = 'Collaborative squad tackling summits, deep sea dives, and street food across the globe.',
  joinCode = '',
  cover = DEFAULT_COVER,
  members: propMembers,
  onInvite,
  onLeave,
}) {
  const [members, setMembers] = useState(propMembers || []);
  const [loading, setLoading] = useState(!propMembers && Boolean(squadId));
  const [searchQuery, setSearchQuery] = useState('');
  const [coverUrl, setCoverUrl] = useState(cover || DEFAULT_COVER);
  const [squadMotto, setSquadMotto] = useState(motto);
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    if (cover) setCoverUrl(cover);
  }, [cover]);

  useEffect(() => {
    if (motto) setSquadMotto(motto);
  }, [motto]);

  useEffect(() => {
    if (propMembers) {
      setMembers(propMembers);
      return;
    }
    if (!squadId) return;

    let isMounted = true;
    async function fetchMembers() {
      setLoading(true);
      try {
        const res = await api.getSquadMembers(squadId);
        if (isMounted && res?.success && Array.isArray(res.members)) {
          setMembers(
            res.members.map((m) => ({
              id: m.userId || m.id,
              name: m.name,
              handle: `@${m.name?.toLowerCase().replace(/\s+/g, '')}`,
              role: (m.role || 'MEMBER').toUpperCase(),
              avatar: m.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.name || 'Member')}`,
              activity: m.activity || 'Active contributor',
              xpContributed: m.xp || m.xpContributed || 250,
              isCurrentUser: Boolean(m.isCurrentUser),
            }))
          );
        }
      } catch (err) {
        console.warn('[SquadMembersWidget] Failed to fetch members:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [squadId, propMembers]);

  const totalSquadXp = members.reduce((sum, m) => sum + (m.xpContributed || 0), 0);

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleRole = (memberId) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const newRole = m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
          setToastMessage(`Updated ${m.name}'s role to ${newRole}!`);
          setTimeout(() => setToastMessage(null), 3000);
          return { ...m, role: newRole };
        }
        return m;
      })
    );
  };

  const handleCopyCode = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setToastMessage(`📋 Join code "${joinCode}" copied to clipboard!`);
    setTimeout(() => {
      setCopiedCode(false);
      setToastMessage(null), 3000;
    });
  };

  const handleSaveMotto = (e) => {
    e.preventDefault();
    setIsEditingMotto(false);
    setToastMessage('✨ Squad motto updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div id="squad-members-widget" className="bg-[#FFFDF5] brutal-border-lg rounded-2xl shadow-brutal-xl overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-brand-yellow p-3 border-b-3 border-black font-mono text-xs font-black flex items-center justify-between animate-in slide-in-from-top-2">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="w-5 h-5 bg-black text-white rounded text-[10px] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Cover Banner */}
      <div className="relative h-48 md:h-64 border-b-4 border-black overflow-hidden bg-black group">
        <img
          src={coverUrl}
          alt={squadName}
          className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_COVER;
          }}
        />

        {/* Decorative Punch Holes */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black shadow" />
          <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black shadow" />
        </div>

        {/* Top Right Badges */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10 flex-wrap">
          <span className="px-3 py-1 bg-brand-yellow text-black border-2 border-black rounded-lg font-space font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            {category}
          </span>
          {joinCode && (
            <button
              type="button"
              id="squad-copy-code-btn"
              onClick={handleCopyCode}
              className="px-3 py-1 bg-white text-black hover:bg-[#ffed00] border-2 border-black rounded-lg font-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all flex items-center gap-1.5"
              title="Click to copy Squad Join Code"
            >
              <span>CODE:</span>
              <span className="font-black text-brand-pink">{joinCode}</span>
              <span>{copiedCode ? '✓' : '📋'}</span>
            </button>
          )}
        </div>

        {/* Bottom Banner Info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-5 md:p-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-bricolage font-black text-2xl md:text-4xl uppercase tracking-tight text-[#ffed00]">
                {squadName}
              </h2>
              <span className="px-2 py-0.5 bg-brand-pink text-white border border-white rounded text-[11px] font-space font-black uppercase">
                {members.length} Questers
              </span>
            </div>

            {isEditingMotto ? (
              <form onSubmit={handleSaveMotto} className="mt-2 flex gap-2 max-w-lg">
                <input
                  type="text"
                  value={squadMotto}
                  onChange={(e) => setSquadMotto(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white text-black border-2 border-black rounded font-hanken text-xs font-bold"
                  placeholder="Enter squad motto..."
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-yellow text-black border-2 border-black rounded font-space font-bold text-xs uppercase cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMotto(false)}
                  className="px-2 py-1.5 bg-white text-black border-2 border-black rounded font-space font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </form>
            ) : (
              <p className="text-xs md:text-sm font-hanken text-white/90 mt-1 max-w-xl font-medium">
                "{squadMotto}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditingMotto && (
              <button
                type="button"
                id="squad-edit-motto-btn"
                onClick={() => setIsEditingMotto(true)}
                className="px-3 py-1.5 bg-white text-black hover:bg-brand-yellow border-2 border-black rounded-lg font-space font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                ✏️ Edit Motto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-3 divide-black bg-[#ffed00] border-b-3 border-black font-space">
        <div className="p-4 text-center">
          <p className="text-[11px] font-bold uppercase text-black/70">Squad Roster</p>
          <p className="text-2xl font-black text-black">{members.length} Members</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[11px] font-bold uppercase text-black/70">Collective XP</p>
          <p className="text-2xl font-black text-black">{totalSquadXp.toLocaleString()} XP</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[11px] font-bold uppercase text-black/70">Squad Category</p>
          <p className="text-xl font-black text-brand-pink truncate">{category}</p>
        </div>
      </div>

      {/* Member Roster Controls */}
      <div className="p-5 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <input
              id="squad-member-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name..."
              className="w-full px-4 py-2 bg-white border-2 border-black rounded-xl font-hanken text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {joinCode && (
              <button
                id="squad-invite-member-btn"
                type="button"
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none px-4 py-2 bg-brand-pink text-white border-2 border-black rounded-xl font-space font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>+</span>
                <span>Invite Friend</span>
              </button>
            )}

            {!confirmLeave ? (
              <button
                id="squad-leave-btn"
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="px-3.5 py-2 bg-[#ffdad6] text-[#93000a] border-2 border-black rounded-xl font-space font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ba1a1a] hover:text-white transition-all cursor-pointer"
              >
                Leave
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#ffdad6] border-2 border-black rounded-xl p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] font-space font-bold px-1.5 text-[#93000a]">Leave squad?</span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmLeave(false);
                    if (onLeave) onLeave();
                    setToastMessage('You left the squad.');
                  }}
                  className="px-2 py-1 bg-[#ba1a1a] text-white text-[10px] font-bold rounded cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLeave(false)}
                  className="px-2 py-1 bg-white text-black text-[10px] font-bold rounded cursor-pointer"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Members Grid / List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 bg-gray-100 border-2 border-black rounded-xl" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-8 text-center text-gray-500 font-hanken">
            <p>No squad members found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`p-4 border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5 ${
                  member.isCurrentUser ? 'bg-[#ffed00]/25 border-black' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white shrink-0">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.name || 'Member')}`;
                        }}
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bricolage font-black text-sm text-black truncate">
                        {member.name}
                      </h4>
                      {member.isCurrentUser && (
                        <span className="px-1.5 py-0.2 bg-black text-white text-[9px] font-space font-black rounded uppercase">
                          You
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 border border-black rounded text-[10px] font-space font-black uppercase ${
                          member.role === 'ADMIN'
                            ? 'bg-[#ffed00] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-[#bdf2ff] text-black'
                        }`}
                      >
                        {member.role === 'ADMIN' ? 'ADMIN 👑' : 'MEMBER ⚡'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-black/60 truncate">
                      {member.handle} • {member.xpContributed.toLocaleString()} XP
                    </p>
                    <p className="text-[11px] font-hanken text-black/80 font-medium truncate mt-0.5">
                      {member.activity}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleRole(member.id)}
                  className="shrink-0 p-2 border-2 border-black rounded-lg bg-gray-50 hover:bg-brand-yellow transition-colors cursor-pointer text-xs font-mono font-bold"
                  title={`Toggle role: currently ${member.role}`}
                >
                  {member.role === 'ADMIN' ? 'Demote' : 'Promote'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SquadMembersWidget;
