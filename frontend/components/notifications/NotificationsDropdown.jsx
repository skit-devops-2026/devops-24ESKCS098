import { useState, useEffect, useRef } from 'react';

function NotificationsDropdown({ isOpen, onClose, onNotificationClick, initialNotifications = [] }) {
  const [activeTab, setActiveTab] = useState('ALL');
  const [notifications, setNotifications] = useState(initialNotifications);
  const [inviteStatus, setInviteStatus] = useState({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);


  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleInviteAction = (id, action) => {
    setInviteStatus((prev) => ({ ...prev, [id]: action }));
    // Mark as read after responding
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'REMINDERS') return item.category === 'REMINDERS';
    if (activeTab === 'INVITES') return item.type === 'invite';
    return true;
  });

  const remindersCount = notifications.filter((n) => n.category === 'REMINDERS').length;
  const invitesCount = notifications.filter((n) => n.type === 'invite').length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-3 w-[380px] sm:w-[420px] max-w-[92vw] bg-brand-canvas brutal-border-lg rounded-2xl shadow-brutal-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Neo-brutalist Header Bar */}
      <div className="bg-brand-yellow p-4 border-b-3 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl">notifications_active</span>
          <div>
            <h3 className="font-display font-black text-lg uppercase tracking-tight leading-none">
              Notifications
            </h3>
            <span className="font-mono text-[11px] font-bold text-neutral-800">
              {unreadCount > 0 ? `${unreadCount} UNREAD ALERTS` : 'ALL CAUGHT UP'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2.5 py-1 bg-white hover:bg-neutral-100 font-mono text-[11px] font-black uppercase brutal-border-sm rounded shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              Mark Read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 bg-black text-white hover:bg-brand-pink font-black text-sm flex items-center justify-center rounded brutal-border-sm transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-3 bg-white border-b-2 border-black">
        {[
          { key: 'ALL', label: 'All', count: notifications.length },
          { key: 'REMINDERS', label: 'Reminders', count: remindersCount },
          { key: 'INVITES', label: 'Invites', count: invitesCount },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 font-mono text-xs font-black uppercase rounded-full brutal-border-sm transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-black text-white shadow-brutal-sm'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-black'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-brand-yellow text-black' : 'bg-black text-white'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y-2 divide-black p-2 space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-neutral-400">
              mark_chat_read
            </span>
            <p className="font-display font-bold text-sm text-neutral-600">
              No notifications in this tab!
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const hasResponded = inviteStatus[notif.id];

            return (
              <div
                key={notif.id}
                className={`p-3 rounded-xl brutal-border-sm transition-all ${
                  notif.unread
                    ? 'bg-white shadow-brutal-sm border-l-6 border-l-brand-pink'
                    : 'bg-neutral-50/70 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon / Avatar */}
                  <div className="relative shrink-0">
                    {notif.type === 'invite' && notif.sender ? (
                      <img
                        src={notif.sender.avatar}
                        alt={notif.sender.name}
                        className="w-10 h-10 rounded-full brutal-border-sm object-cover"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-full brutal-border-sm flex items-center justify-center text-lg ${
                          notif.type === 'reminder'
                            ? 'bg-brand-yellow text-black'
                            : notif.type === 'celebration'
                            ? 'bg-brand-lime text-black'
                            : 'bg-brand-cyan text-black'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {notif.type === 'reminder'
                            ? 'alarm'
                            : notif.type === 'celebration'
                            ? 'emoji_events'
                            : 'forum'}
                        </span>
                      </div>
                    )}
                    {notif.unread && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-pink rounded-full border-2 border-black animate-pulse" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      {notif.badge ? (
                        <span className="px-1.5 py-0.5 bg-black text-brand-yellow font-mono text-[9px] font-black uppercase rounded">
                          {notif.badge}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase">
                          {notif.type}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-neutral-500">
                        {notif.timestamp}
                      </span>
                    </div>

                    <h4 className="font-display font-extrabold text-xs leading-tight text-neutral-900">
                      {notif.title}
                    </h4>

                    <p className="font-hanken text-[11px] text-neutral-600 line-clamp-2">
                      {notif.description}
                    </p>

                    {/* Reactions Pill */}
                    {notif.reactions && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {notif.reactions.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-neutral-100 rounded-full text-[10px] font-mono font-bold brutal-border-sm cursor-pointer hover:bg-brand-yellow"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons for Invites */}
                    {notif.type === 'invite' && (
                      <div className="pt-2">
                        {hasResponded ? (
                          <div className={`p-2 rounded font-mono text-[11px] font-black text-center brutal-border-sm ${
                            hasResponded === 'accepted' ? 'bg-brand-lime text-black' : 'bg-neutral-200 text-neutral-700'
                          }`}>
                            {hasResponded === 'accepted'
                              ? '✓ JOINED SQUAD!'
                              : '✕ INVITATION DECLINED'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleInviteAction(notif.id, 'accepted')}
                              className="flex-1 py-1 px-3 bg-brand-yellow hover:bg-[#ffe600] font-mono text-xs font-black uppercase rounded brutal-border-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-black"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInviteAction(notif.id, 'declined')}
                              className="py-1 px-3 bg-white hover:bg-neutral-100 font-mono text-xs font-black uppercase rounded brutal-border-sm text-neutral-700 hover:text-black transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button for Reminders */}
                    {notif.type === 'reminder' && notif.actionLabel && (
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            if (onNotificationClick) onNotificationClick(notif);
                          }}
                          className="w-full py-1 px-2.5 bg-black hover:bg-brand-pink text-white font-mono text-[11px] font-black uppercase rounded brutal-border-sm shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1"
                        >
                          <span>{notif.actionLabel}</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Banner */}
      <div className="p-3 bg-neutral-100 border-t-2 border-black flex items-center justify-between font-mono text-[11px] font-bold">
        <span className="text-neutral-600 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">tune</span>
          Settings
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-brand-pink hover:underline font-black"
        >
          VIEW ALL ACTIVITY →
        </button>
      </div>
    </div>
  );
}

export default NotificationsDropdown;
