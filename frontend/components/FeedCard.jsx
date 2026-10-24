import { useState } from 'react';

const REACTION_OPTIONS = [
  { emoji: '🔥', label: 'Fire', bg: 'hover:bg-amber-100' },
  { emoji: '❤️', label: 'Love', bg: 'hover:bg-pink-100' },
  { emoji: '👏', label: 'Clap', bg: 'hover:bg-emerald-100' },
  { emoji: '🎉', label: 'Party', bg: 'hover:bg-yellow-100' },
  { emoji: '⚡', label: 'Epic', bg: 'hover:bg-cyan-100' },
];

function FeedCard({ item, onShare, onFriendClick }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [hasLiked, setHasLiked] = useState(item.hasLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(item.commentList || []);
  const [newComment, setNewComment] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(item.userReaction || null);
  const [reactionCounts, setReactionCounts] = useState(
    item.reactionCounts || {
      '🔥': item.reactions?.includes('🔥') ? 5 : 0,
      '❤️': item.reactions?.includes('❤️') ? 3 : 0,
      '👏': item.reactions?.includes('👏') ? 4 : 0,
      '🎉': item.reactions?.includes('🎉') ? 2 : 0,
    }
  );

  const rotateClass = item.id % 2 === 1 ? 'rotate-1' : '-rotate-1';

  // Toggle Like
  const handleToggleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  // Add Reaction
  const handleSelectReaction = (emoji) => {
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (userReaction === emoji) {
        // deselect
        next[emoji] = Math.max(0, (next[emoji] || 1) - 1);
        setUserReaction(null);
      } else {
        if (userReaction && next[userReaction]) {
          next[userReaction] = Math.max(0, next[userReaction] - 1);
        }
        next[emoji] = (next[emoji] || 0) + 1;
        setUserReaction(emoji);
      }
      return next;
    });
    setShowReactionPicker(false);
  };

  // Submit Comment
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj = {
      name: 'You (Alex)',
      color: 'text-primary font-black',
      text: newComment.trim(),
      time: 'Just now',
    };

    setComments((prev) => [...prev, commentObj]);
    setNewComment('');
  };

  const activeReactions = Object.entries(reactionCounts).filter(([_, count]) => count > 0);

  return (
    <article
      className={`card flex flex-col gap-5 ${rotateClass} bg-white border-3 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:rotate-0 hover:-translate-y-1.5 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span
          className="sticker-label px-3 py-1 bg-brand-yellow text-black border-2 border-black font-space font-black text-xs uppercase tracking-wider rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          style={item.badgeStyle}
        >
          {item.badge}
        </span>

        {item.squadName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#bdf2ff] text-black border-2 border-black rounded-md font-space font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span>🛡️</span>
            <span>{item.squadName}</span>
          </span>
        )}
      </div>

      {/* Author & Description */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 shrink-0 border-3 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer hover:z-10 hover:scale-105 transition-transform bg-brand-pink">
          <img alt={item.name} className="w-full h-full object-cover" src={item.avatar} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bricolage font-extrabold text-xl uppercase tracking-tight text-black truncate">
              {item.name}
            </h4>
            {item.xpEarned && (
              <span className="px-2 py-0.5 bg-[#b4f8c8] text-black border-2 border-black rounded text-[11px] font-space font-black">
                +{item.xpEarned} XP
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-black/75 font-hanken line-clamp-2">
            {item.subtitle}
          </p>
        </div>
      </div>

      {/* Tagged Squad Friends (Sec 5 Social) */}
      {item.taggedFriends && item.taggedFriends.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-space flex-wrap bg-[#fff9c4] border-2 border-dashed border-black px-3 py-1.5 rounded-lg">
          <span className="font-black uppercase text-black/70">With:</span>
          {item.taggedFriends.map((friend, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onFriendClick && onFriendClick(friend.name)}
              className="px-2 py-0.5 bg-white border border-black rounded font-bold hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              @{friend.name}
            </button>
          ))}
        </div>
      )}

      {/* Proof Media Photo (Sec 4 Proof Upload) */}
      <div className="relative h-72 border-3 border-black rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group bg-black">
        <img
          alt="Achievement Proof"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95 group-hover:opacity-100"
          src={item.image}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces';
          }}
        />
        {item.completionDate && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/85 text-white border-2 border-white rounded font-space font-bold text-xs uppercase tracking-wider backdrop-blur-sm shadow-md">
            🗓️ {item.completionDate}
          </div>
        )}
      </div>

      {/* Engagement Actions Row */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <div className="flex items-center gap-2.5">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black font-space font-bold text-sm rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer ${
              hasLiked
                ? 'bg-[#e4006c] text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] translate-x-[1px] translate-y-[1px]'
                : 'bg-white text-black hover:bg-pink-50'
            }`}
          >
            <span>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{likes}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border-2 border-black rounded font-space font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-150 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] cursor-pointer ${
              showComments ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <span>💬</span>
            <span>{comments.length}</span>
          </button>

          {/* Reactions Trigger & Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="inline-flex items-center gap-1 px-3 py-2 border-2 border-black bg-white rounded font-space font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              title="Add Reaction"
            >
              <span>{userReaction || '😀'}</span>
              <span className="text-xs">+</span>
            </button>

            {/* Floating Reaction Dock */}
            {showReactionPicker && (
              <div className="absolute bottom-12 left-0 z-30 flex items-center gap-1.5 p-2 bg-white border-3 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95">
                {REACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    type="button"
                    onClick={() => handleSelectReaction(opt.emoji)}
                    className={`w-9 h-9 flex items-center justify-center text-lg border-2 border-black rounded-lg ${opt.bg} hover:scale-125 transition-transform cursor-pointer ${
                      userReaction === opt.emoji ? 'bg-brand-yellow font-black' : 'bg-white'
                    }`}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Action: Share & Stat Badge */}
        <div className="flex items-center gap-2">
          {item.statBadge && (
            <span className="inline-block px-3 py-1.5 bg-[#bdf2ff] text-black border-2 border-black rounded-md font-space font-bold text-xs uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {item.statBadge}
            </span>
          )}

          <button
            type="button"
            onClick={() => onShare && onShare(item)}
            className="p-2 border-2 border-black bg-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffed00] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            title="Share Recap Card"
          >
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Active Reaction Pills (Sec 5 Social) */}
      {activeReactions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeReactions.map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelectReaction(emoji)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-space font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 cursor-pointer ${
                userReaction === emoji ? 'bg-brand-yellow' : 'bg-gray-50'
              }`}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Comments Section */}
      {showComments && (
        <div className="flex flex-col gap-3 pt-4 border-t-3 border-black text-sm">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {comments.map((c, i) => (
              <div
                key={i}
                className="p-2.5 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs flex justify-between items-start gap-2"
              >
                <div>
                  <span className={`font-bricolage font-black uppercase ${c.color || 'text-black'}`}>
                    {c.name}:
                  </span>{' '}
                  <span className="font-hanken font-medium text-black">{c.text}</span>
                </div>
                {c.time && (
                  <span className="text-[10px] font-space text-black/50 shrink-0">{c.time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Add Comment Input Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Drop some props or cheer them on..."
              className="flex-1 px-3 py-2 border-2 border-black rounded-lg font-hanken text-xs focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white font-space font-bold text-xs uppercase border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffed00] hover:text-black hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default FeedCard;
