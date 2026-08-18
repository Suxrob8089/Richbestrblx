import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  Coins, 
  Sparkles,
  Gamepad2,
  User,
  Users
} from 'lucide-react';
import { WithdrawalRequest, Language } from '../types';
import { translations } from '../utils/translations';

interface WithdrawalHistoryModalProps {
  withdrawals: WithdrawalRequest[];
  lang: Language;
  onClose: () => void;
}

export const WithdrawalHistoryModal: React.FC<WithdrawalHistoryModalProps> = ({
  withdrawals,
  lang,
  onClose
}) => {
  const [now, setNow] = useState(Date.now());
  const t = translations[lang];

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (unlockAt: number) => {
    const diff = unlockAt - now;
    if (diff <= 0) return `00:00:00 (${lang === 'uz' ? 'Razmorozka tugadi' : lang === 'ru' ? 'Разморожено' : 'Unfrozen'})`;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${days} ${t.daysLeft}, ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const getProgressPercent = (req: WithdrawalRequest) => {
    const totalDuration = req.unlockAt - req.requestedAt;
    const elapsed = now - req.requestedAt;
    if (req.status === 'gived') return 100;
    if (req.status === 'rejected') return 0;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.history}</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{t.historyTrackerTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative banner */}
        <div className="p-3.5 bg-zinc-950/60 border-b border-zinc-800 text-xs text-zinc-300 flex items-center gap-2 shrink-0">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>{t.autoTransferBanner}</span>
        </div>

        {/* Requests List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {withdrawals.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Coins className="w-10 h-10 mx-auto mb-2 opacity-30 text-zinc-400" />
              <p>{t.noRequestsYet}</p>
            </div>
          ) : (
            withdrawals.map((req) => {
              const progress = getProgressPercent(req);
              const isGived = req.status === 'gived';
              const isRejected = req.status === 'rejected';
              const isPending = req.status === 'pending_7days';

              return (
                <div 
                  key={req.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-3"
                >
                  {/* Top line: Amount & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-white">
                          {req.amountRobux.toFixed(1)} RBX
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {req.withdrawMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 font-mono">
                        <span>{new Date(req.requestedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isGived && (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-green-500/10 text-green-400 rounded-md border border-green-500/20 uppercase tracking-wider">
                          {t.statusGived}
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-red-500/10 text-red-400 rounded-md border border-red-500/20 uppercase tracking-wider">
                          {t.statusRejected}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-800 text-white rounded-md border border-zinc-700 uppercase tracking-wider">
                          {t.statusPending7Days}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Destination details */}
                  <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs font-mono text-zinc-300 space-y-1">
                    {req.destinationDetails.robloxUsername && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">{t.robloxUsernameLabel}:</span>
                        <span className="text-white font-bold">{req.destinationDetails.robloxUsername}</span>
                      </div>
                    )}
                    {req.destinationDetails.gamepassLinkOrId && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Gamepad2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Gamepass:</span>
                        <span className="text-zinc-300">{req.destinationDetails.gamepassLinkOrId}</span>
                      </div>
                    )}
                    {req.destinationDetails.groupName && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Group:</span>
                        <span className="text-zinc-300">{req.destinationDetails.groupName}</span>
                      </div>
                    )}
                  </div>

                  {/* 7-Day Countdown Progress Bar */}
                  {isPending && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-white" />
                          {t.cooldownRemaining}:
                        </span>
                        <span className="font-bold text-white">
                          {formatCountdown(req.unlockAt)}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="h-full bg-white transition-all duration-300 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Admin Note if gived or rejected */}
                  {req.adminNote && (
                    <div className="p-2 bg-zinc-900/60 rounded-lg text-xs text-zinc-400 font-mono flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span>{req.adminNote}</span>
                    </div>
                  )}
                </div>
              );
            })
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
