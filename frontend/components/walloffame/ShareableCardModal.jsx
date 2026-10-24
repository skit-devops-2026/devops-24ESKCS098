import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function ShareableCardModal({ isOpen, onClose, item }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/wall-of-fame?quest=' + item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF5] border-4 border-black rounded-3xl shadow-[12px_12px_0px_0px_rgba(255,237,0,1)] overflow-hidden flex flex-col">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 bg-white border-2 border-black rounded-full font-black text-xs flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#e4006c] hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* The Brag Card Canvas */}
        <div className="p-6 md:p-8 flex flex-col gap-5">
          <div className="p-5 bg-brand-yellow border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4 relative overflow-hidden">
            {/* Top Branding */}
            <div className="flex items-center justify-between">
              <span className="font-bricolage font-black tracking-tighter text-lg uppercase text-black">
                LIFE<span className="text-[#e4006c]">QUEST</span>
              </span>
              <span className="px-2 py-0.5 bg-black text-white font-space font-black text-[10px] rounded uppercase">
                Conquered ⚡
              </span>
            </div>

            {/* Proof Photo */}
            <div className="h-56 border-3 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative bg-black">
              <img
                alt="Proof"
                src={item.image}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://cdn-imgix.headout.com/tour/19210/TOUR-IMAGE/41bf9e61-4def-4e7d-bd13-a5b27ff477ae-SAWGD2-21-1-.jpg?auto=format&q=90&fit=crop&crop=faces';
                }}
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 bg-white border-2 border-black rounded-md font-space font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {item.badge}
              </div>
            </div>

            {/* User & Title */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 border-2 border-black rounded-lg overflow-hidden shrink-0">
                  <img alt={item.name} src={item.avatar} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bricolage font-black text-sm uppercase text-black leading-tight">
                    {item.name}
                  </h4>
                  <p className="font-space text-[11px] text-black/75">{item.squadName || 'Trip Squad'}</p>
                </div>
              </div>
              <p className="font-hanken font-bold text-sm text-black leading-snug">
                "{item.subtitle}"
              </p>
            </div>

            {/* Bottom Stats Banner */}
            <div className="pt-2 border-t-2 border-black flex items-center justify-between font-space text-xs font-bold text-black">
              <span>{item.statBadge || 'Bucket List Verified'}</span>
              <span className="px-2 py-0.5 bg-[#b4f8c8] border border-black rounded">
                +{item.xpEarned || 300} XP
              </span>
            </div>
          </div>

          {/* Share Actions */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-3 bg-black text-[#ffed00] border-3 border-black rounded-xl font-space font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{copied ? '✅ Link Copied to Clipboard!' : '🔗 Copy Shareable Quest Link'}</span>
            </button>
            <p className="text-center text-[11px] font-space text-black/60">
              Share your victory card to WhatsApp, Instagram Stories, or Squad chat.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ShareableCardModal;
