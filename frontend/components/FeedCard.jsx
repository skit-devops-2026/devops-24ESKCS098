import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

const REACTION_OPTIONS = [
  { emoji: '🔥', label: 'Fire', bg: 'hover:bg-amber-100', type: 'fire' },
  { emoji: '❤️', label: 'Love', bg: 'hover:bg-pink-100', type: 'like' },
  { emoji: '👏', label: 'Clap', bg: 'hover:bg-emerald-100', type: 'clap' },
  { emoji: '🎉', label: 'Party', bg: 'hover:bg-yellow-100', type: 'party' },
  { emoji: '⚡', label: 'Epic', bg: 'hover:bg-cyan-100', type: 'epic' },
];

const REACTION_TYPE_TO_EMOJI = {
  fire: '🔥',
  like: '❤️',
  clap: '👏',
  party: '🎉',
  epic: '⚡',
  star: '⭐',
  muscle: '💪',
};

const EMOJI_TO_REACTION_TYPE = {
  '🔥': 'fire',
  '❤️': 'like',
  '👏': 'clap',
  '🎉': 'party',
  '⚡': 'epic',
  '⭐': 'star',
  '💪': 'muscle',
  '🙌': 'party',
};

const getReactionEmoji = (val) => (val ? REACTION_TYPE_TO_EMOJI[val] || val : '');
const getReactionType = (val) => (val ? EMOJI_TO_REACTION_TYPE[val] || val : '');

function FeedCard({ item, onShare, onFriendClick, onDelete }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [hasLiked, setHasLiked] = useState(item.hasLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(item.commentList || []);
  const [newComment, setNewComment] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(item.userReaction || null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const [reactionCounts, setReactionCounts] = useState(
    item.reactionCounts || {
      '🔥': item.reactions?.includes('🔥') ? 5 : 0,
      '❤️': item.reactions?.includes('❤️') ? 3 : 0,
      '👏': item.reactions?.includes('👏') ? 4 : 0,
      '🎉': item.reactions?.includes('🎉') ? 2 : 0,
    }
  );

  const rotateClass = item.id % 2 === 1 ? 'rotate-1' : '-rotate-1';

  // Keep state in sync with updated/replaced item
  useEffect(() => {
    setComments(item.commentList || []);
    setLikes(item.likes || 0);
    setHasLiked(item.hasLiked || false);
    setUserReaction(item.userReaction || null);
    if (item.reactionCounts) {
      setReactionCounts(item.reactionCounts);
    }
  }, [item.id, item.commentList]);

  // Handle escape key to close delete modal or emoji picker
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (showEmojiPicker) setShowEmojiPicker(false);
        if (showDeleteModal) setShowDeleteModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, showEmojiPicker]);

  // Handle click outside to close emoji picker
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Insert emoji at cursor position into comment input
  const handleAddEmoji = (emoji) => {
    if (!commentInputRef.current) {
      setNewComment((prev) => prev + emoji);
      return;
    }
    const input = commentInputRef.current;
    const start = input.selectionStart ?? newComment.length;
    const end = input.selectionEnd ?? newComment.length;
    const updated = newComment.substring(0, start) + emoji + newComment.substring(end);
    setNewComment(updated);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Toggle Like
  const handleToggleLike = () => {
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikes((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
  };

  // Add / Change Reaction
  const handleSelectReaction = (emoji, type) => {
    const selectedType = type || getReactionType(emoji) || 'fire';
    const selectedEmoji = emoji || getReactionEmoji(selectedType) || '🔥';
    const currentUserType = getReactionType(userReaction);
    const currentUserEmoji = getReactionEmoji(userReaction);
    const isDeselect =
      userReaction === selectedType ||
      userReaction === selectedEmoji ||
      currentUserType === selectedType;

    setReactionCounts((prev) => {
      const next = { ...prev };
      const targetKey =
        next[selectedType] !== undefined
          ? selectedType
          : next[selectedEmoji] !== undefined
          ? selectedEmoji
          : selectedType;

      if (isDeselect) {
        next[targetKey] = Math.max(0, (next[targetKey] || 1) - 1);
        setUserReaction(null);
      } else {
        if (userReaction) {
          const oldType = getReactionType(userReaction);
          const oldEmoji = getReactionEmoji(userReaction);
          const oldKey =
            next[oldType] !== undefined
              ? oldType
              : next[oldEmoji] !== undefined
              ? oldEmoji
              : oldType;
          if (next[oldKey] !== undefined) {
            next[oldKey] = Math.max(0, next[oldKey] - 1);
          }
        }
        next[targetKey] = (next[targetKey] || 0) + 1;
        setUserReaction(selectedType);
      }
      return next;
    });
    setShowReactionPicker(false);
  };

  // Submit Comment
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;

    const tempComment = {
      id: Date.now(),
      authorId: 1,
      isOwner: true,
      name: 'You (Alex)',
      color: 'text-primary font-black',
      text,
      time: 'Just now',
    };

    setComments((prev) => [...prev, tempComment]);
    setNewComment('');
  };

  // Delete Comment
  const handleDeleteComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };


  const activeReactions = Object.entries(reactionCounts).filter(
    ([key, count]) => count > 0 && key !== 'like' && key !== '❤️'
  );
  const userReactionEmoji = getReactionEmoji(userReaction);
  const userReactionType = getReactionType(userReaction);

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
          <img
            alt={item.name}
            className="w-full h-full object-cover"
            src={
              item.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Quester')}&background=FFED00&color=000&bold=true`
            }
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'Quester')}&background=FFED00&color=000&bold=true`;
            }}
          />
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
      {item.image && typeof item.image === 'string' && item.image.trim() !== '' && (
        <div className="relative w-full border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-neutral-900">
          <img
            alt={item.badge || 'Achievement Proof'}
            className="w-full h-auto max-h-[500px] object-cover block"
            src={item.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces';
            }}
          />
          {item.completionDate && (
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/85 text-white border-2 border-white rounded-lg font-space font-bold text-xs uppercase tracking-wider backdrop-blur-sm shadow-md pointer-events-none">
              🗓️ {item.completionDate}
            </div>
          )}
        </div>
      )}

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
              className="inline-flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-white rounded font-space font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
              title="Add Reaction"
            >
              <span>{userReactionEmoji || '😀'}</span>
              <span className="text-xs font-black">+</span>
            </button>

            {/* Floating Reaction Dock */}
            {showReactionPicker && (
              <div className="absolute bottom-12 left-0 z-30 flex items-center gap-1.5 p-2 bg-white border-3 border-black rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95">
                {REACTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    type="button"
                    onClick={() => handleSelectReaction(opt.emoji, opt.type)}
                    className={`w-9 h-9 flex items-center justify-center text-lg border-2 border-black rounded-lg ${opt.bg} hover:scale-125 transition-transform cursor-pointer ${
                      userReactionType === opt.type || userReactionEmoji === opt.emoji ? 'bg-brand-yellow font-black' : 'bg-white'
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

          {/* Delete Post Button */}
          {onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 border-2 border-black bg-white text-black hover:bg-[#ffdad6] hover:text-[#93000a] rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer group/del"
              title="Delete Post"
            >
              <svg
                className="w-4 h-4 text-black group-hover/del:text-[#93000a] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Active Reaction Pills (Sec 5 Social) */}
      {activeReactions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {activeReactions.map(([reactionKey, count]) => {
            const emoji = getReactionEmoji(reactionKey);
            const type = getReactionType(reactionKey);
            const isSelected =
              userReactionType === type ||
              userReactionEmoji === emoji ||
              userReaction === reactionKey;

            return (
              <button
                key={reactionKey}
                type="button"
                onClick={() => handleSelectReaction(emoji, type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-space font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 cursor-pointer ${
                  isSelected ? 'bg-brand-yellow' : 'bg-gray-50'
                }`}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Comments Section */}
      {showComments && (
        <div className="flex flex-col gap-3 pt-4 border-t-3 border-black text-sm">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {comments.map((c) => {
              const isMyComment =
                c.isOwner === true ||
                c.authorId === 1 ||
                c.author_id === 1 ||
                (c.name && (c.name.includes('Alex') || c.name.includes('You')));

              return (
                <div
                  key={c.id || c.text}
                  className="group/comm p-2.5 bg-gray-50 hover:bg-amber-50/50 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs flex justify-between items-center gap-2 transition-all"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <span className={`font-bricolage font-black uppercase ${c.color || 'text-black'}`}>
                      {c.name}:
                    </span>{' '}
                    <span className="font-hanken font-medium text-black break-words">{c.text}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.time && (
                      <span className="text-[10px] font-space text-black/50">{c.time}</span>
                    )}
                    {/* Delete Comment Button - ONLY visible on comments authored by the current user */}
                    {isMyComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-70 group-hover/comm:opacity-100 p-1 hover:bg-[#ffdad6] text-black/60 hover:text-[#ba1a1a] border border-transparent hover:border-black rounded transition-all cursor-pointer"
                        title="Delete Your Comment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Neo-Brutalist Unified Comment Input Capsule */}
          <form onSubmit={handleCommentSubmit} className="relative mt-2">
            <div className="flex items-center bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-within:-translate-y-0.5 transition-all p-1 gap-1.5">
              {/* Emoji Picker Toggle Button */}
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`w-9 h-9 shrink-0 flex items-center justify-center text-lg rounded-lg border-2 border-black transition-all cursor-pointer ${
                  showEmojiPicker
                    ? 'bg-brand-yellow shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-95'
                    : 'bg-[#FFFDF5] hover:bg-brand-yellow hover:scale-105 active:scale-95 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                }`}
                title="Choose Emoji"
                aria-label="Choose Emoji"
              >
                😀
              </button>

              {/* Text Input */}
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Drop some props or cheer them on..."
                className="flex-1 px-2.5 py-1.5 font-hanken text-xs text-black placeholder:text-black/45 bg-transparent focus:outline-none"
              />

              {/* Post Button */}
              <button
                type="submit"
                className="px-5 py-2 bg-black text-white hover:bg-brand-yellow hover:text-black font-space font-black text-xs uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Post
              </button>
            </div>

            {/* Neo-Brutalist Emoji Drawer Popover */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-full sm:w-[360px] bg-[#FFFDF5] border-3 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Header Banner */}
                <div className="flex items-center justify-between px-4 py-2 bg-brand-yellow border-b-3 border-black">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-black" />
                    <span className="font-space font-black text-xs uppercase tracking-wider text-black">
                      Pick an Emoji
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="w-6 h-6 flex items-center justify-center font-black text-xs bg-white hover:bg-black hover:text-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Emoji Picker Body */}
                <EmojiPicker
                  onEmojiClick={(emojiData) => handleAddEmoji(emojiData.emoji)}
                  autoFocusSearch={false}
                  theme={Theme.LIGHT}
                  emojiStyle={EmojiStyle.APPLE}
                  searchPlaceHolder="Search emojis (smile, dog, fire...)"
                  width="100%"
                  height={400}
                  lazyLoadEmojis={true}
                  previewConfig={{
                    showPreview: true,
                  }}
                />
              </div>
            )}
          </form>
        </div>
      )}
      {/* Custom Neo-Brutalist Delete Confirmation Modal (Replaces browser alert) */}
      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Click-outside backdrop */}
            <div
              className="absolute inset-0"
              onClick={() => setShowDeleteModal(false)}
            />

            <div className="relative w-full max-w-lg bg-[#FFFDF5] border-4 border-black rounded-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Top Banner (Magenta / Pink Header bar) */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#e4006c] text-white border-b-4 border-black">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 bg-black text-white font-space font-black text-xs uppercase rounded">
                    WALL OF FAME
                  </span>
                  <span className="font-space font-black text-xs uppercase tracking-wider text-pink-100">
                    DELETE POST
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-8 h-8 bg-white text-black border-2 border-black rounded-full font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-5">
                <div>
                  <h3 className="font-bricolage font-black text-2xl md:text-3xl uppercase tracking-tight text-black leading-tight">
                    Are you sure you want to delete this post?
                  </h3>
                  <p className="font-hanken font-medium text-black/75 text-sm mt-2">
                    This action cannot be undone. This accomplishment will be permanently removed from your feed and the Wall of Fame.
                  </p>
                </div>

                {/* Post Summary Preview */}
                <div className="p-4 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="w-16 h-16 rounded-lg border-2 border-black object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-black bg-brand-yellow flex items-center justify-center text-2xl shrink-0">
                      🏆
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 bg-brand-yellow text-black border border-black rounded text-[10px] font-space font-black uppercase mb-1">
                      {item.badge || 'Quest'}
                    </span>
                    <h4 className="font-bricolage font-black text-sm uppercase text-black truncate">
                      {item.badge}
                    </h4>
                    <p className="font-hanken text-xs text-black/70 line-clamp-1">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {/* Action Buttons matching Picture 2 */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="bg-[#ffed00] text-black border-2 border-black rounded-lg px-6 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      onDelete && onDelete(item.id);
                    }}
                    className="bg-[#ffdad6] text-[#93000a] border-2 border-black rounded-lg px-6 py-3 font-space font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ba1a1a] hover:text-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-2"
                  >
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </article>
  );
}

export default FeedCard;
