import React from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  CheckCheck, 
  Trash2 
} from 'lucide-react';
import { UserNotification, Language } from '../types';
import { translations } from '../utils/translations';

interface NotificationsModalProps {
  notifications: UserNotification[];
  lang: Language;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  lang,
  onClose,
  onMarkAllRead,
  onClearAll
}) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.notifications}</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{t.inboxTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toolbar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-xs shrink-0">
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t.markAllAsRead}</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
              <p>{t.noNotifications}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition ${
                  n.isRead 
                    ? 'bg-zinc-950/30 border-zinc-800/80 opacity-75' 
                    : 'bg-zinc-950/70 border-white/30 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-white" />}
                    {n.type === 'info' && <Info className="w-4 h-4 text-zinc-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-white truncate">{n.title}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
