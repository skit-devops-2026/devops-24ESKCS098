import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const PHOTO_PRESETS = [
  {
    label: 'Mountain Trek',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  },
  {
    label: 'Deep Sea Scuba',
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  },
  {
    label: 'Marathon Run',
    url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
  },
  {
    label: 'Culinary Master',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  },
  {
    label: 'Skydiving Jump',
    url: 'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces',
  },
];

const AVAILABLE_SQUADS = [
  'Trip Squad ✈️',
  'College Gang 🎓',
  'Family Adventure 🏡',
  'Fitness Freaks 🏋️',
];

const FRIENDS_LIST = [
  'Sarah Chen',
  'Marco Polo',
  'Priya Sharma',
  'Elena Vance',
  'Jordan Smith',
  'Riya Sharma',
];

function CelebrateQuestModal({ isOpen, onClose, onPostAchievement }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [selectedSquad, setSelectedSquad] = useState(AVAILABLE_SQUADS[0]);
  const [badgeText, setBadgeText] = useState('Epic Milestone');
  const [statBadge, setStatBadge] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [xpEarned, setXpEarned] = useState(250);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo states
  const [imageUrl, setImageUrl] = useState(PHOTO_PRESETS[0].url);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleFriend = (name) => {
    setSelectedFriends((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // Process File from Device (FileReader -> base64 data URL)
  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP, etc.)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const newAchievement = {
      id: Date.now(),
      filter: 'my-groups',
      badge: badgeText || 'Quest Conquered',
      badgeStyle: { background: '#ffed00', color: '#000000' },
      name: 'Alex Rivero (You)',
      subtitle: subtitle.trim() || `Conquered "${title}" with the squad!`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
      image: imageUrl,
      likes: 1,
      hasLiked: true,
      comments: 0,
      squadName: selectedSquad.split(' ')[0] + ' ' + (selectedSquad.split(' ')[1] || ''),
      xpEarned: xpEarned,
      statBadge: statBadge.trim() || 'Verified Proof ⚡',
      completionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      taggedFriends: selectedFriends.map((f) => ({ name: f })),
      reactions: ['🔥', '🎉'],
      reactionCounts: { '🔥': 1, '🎉': 1 },
      userReaction: '🎉',
      commentList: [],
    };

    setTimeout(() => {
      onPostAchievement(newAchievement);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#FFFDF5] border-4 border-black rounded-2xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-yellow border-b-4 border-black shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-white border-2 border-black rounded-full flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-6">
              🎉
            </span>
            <div>
              <h2 className="font-bricolage font-black text-xl md:text-2xl uppercase tracking-tight text-black">
                Post Celebration Proof
              </h2>
              <p className="text-xs font-space font-bold text-black/80">
                Share your conquered bucket list quest to the Wall of Fame!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 bg-white border-2 border-black rounded-lg font-mono font-black text-sm flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e4006c] hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Quest Title & Badge Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
                Quest Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scuba diving in Andaman"
                className="w-full px-4 py-2.5 bg-white border-3 border-black rounded-xl font-hanken text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0"
              />
            </div>
            <div>
              <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
                Trophy / Badge Label
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Ocean Conqueror"
                className="w-full px-4 py-2.5 bg-white border-3 border-black rounded-xl font-hanken text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Squad & Stat Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
                Share With Squad
              </label>
              <select
                value={selectedSquad}
                onChange={(e) => setSelectedSquad(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-3 border-black rounded-xl font-space font-bold text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none cursor-pointer"
              >
                {AVAILABLE_SQUADS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
                Custom Metric / Stat Badge
              </label>
              <input
                type="text"
                value={statBadge}
                onChange={(e) => setStatBadge(e.target.value)}
                placeholder="e.g. 18m depth • 45 mins"
                className="w-full px-4 py-2.5 bg-white border-3 border-black rounded-xl font-hanken text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
              />
            </div>
          </div>

          {/* Story / Subtitle */}
          <div>
            <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
              Story / Reflection Note
            </label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="What made this moment unforgettable? Tell the squad your story..."
              className="w-full px-4 py-2 bg-white border-3 border-black rounded-xl font-hanken text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            />
          </div>

          {/* Proof Photo Upload Section (Device File Upload + Adventure Presets) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-space font-bold uppercase text-xs text-black">
                Proof Photo <span className="text-red-600">*</span>
              </label>
              <span className="text-[11px] font-space text-black/60">
                Upload from your phone or computer
              </span>
            </div>

            {/* Device File Upload Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`border-3 border-dashed border-black rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'bg-[#ffed00] scale-[0.99] border-black'
                  : 'bg-white hover:bg-amber-50/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-brand-yellow border-2 border-black rounded-xl flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-3">
                  📤
                </div>
                <div>
                  <p className="font-bricolage font-black text-sm text-black">
                    {uploadedFileName ? (
                      <span className="text-[#e4006c]">📷 {uploadedFileName} (Click to change)</span>
                    ) : (
                      'Click to browse or drag & drop photo from your device'
                    )}
                  </p>
                  <p className="font-space text-xs text-black/60 mt-0.5">
                    Supports JPG, PNG, WEBP, HEIC (Max 15MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Adventure Sample Presets */}
            <div>
              <p className="text-[11px] font-space font-bold text-black/70 uppercase mb-1.5">
                Or pick a sample adventure photo:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setUploadedFileName(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-space font-bold border-2 border-black rounded-lg shrink-0 cursor-pointer transition-all ${
                      imageUrl === preset.url && !uploadedFileName
                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,237,0,1)]'
                        : 'bg-white hover:bg-yellow-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Image Preview */}
            {imageUrl && (
              <div className="relative h-44 w-full border-3 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black group">
                <img
                  alt="Proof Preview"
                  src={imageUrl}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces';
                  }}
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/85 text-white border border-white rounded font-space font-black text-[10px] uppercase shadow">
                  ✅ Photo Ready
                </div>
              </div>
            )}
          </div>

          {/* Tag Squad Friends (Sec 5 Social Interaction) */}
          <div>
            <label className="block font-space font-bold uppercase text-xs mb-1.5 text-black">
              Tag Friends Who Did This With You
            </label>
            <div className="flex flex-wrap gap-2">
              {FRIENDS_LIST.map((friend) => {
                const isSelected = selectedFriends.includes(friend);
                return (
                  <button
                    key={friend}
                    type="button"
                    onClick={() => toggleFriend(friend)}
                    className={`px-3 py-1 text-xs font-space font-bold border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:scale-105 cursor-pointer ${
                      isSelected ? 'bg-brand-pink text-white' : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}@{friend}
                  </button>
                );
              })}
            </div>
          </div>

          {/* XP Reward Preview */}
          <div className="flex items-center justify-between p-3.5 bg-[#bdf2ff] border-3 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="font-space font-bold text-xs uppercase">Squad Achievement XP</span>
            </div>
            <span className="font-space font-black text-sm bg-white px-3 py-1 border-2 border-black rounded-md">
              +{xpEarned} XP
            </span>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black text-[#ffed00] border-3 border-black rounded-xl font-space font-black text-sm uppercase tracking-wider shadow-[5px_5px_0px_0px_rgba(228,0,108,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Minting Trophy & Posting... 🚀</span>
              ) : (
                <>
                  <span>🏆 Post To Wall Of Fame</span>
                  <span>(+{xpEarned} XP)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default CelebrateQuestModal;
