import React, { useState } from 'react';
import { 
  X, 
  ArrowDownToLine, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Gamepad2, 
  Users,
  Sparkles,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, WithdrawMethod, Language } from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface WithdrawModalProps {
  isOpen?: boolean;
  onClose: () => void;
  user: UserProfile;
  lang: Language;
  onSubmitWithdraw: (
    amountRobux: number,
    method: WithdrawMethod,
    destination: {
      robloxUsername?: string;
      gamepassLinkOrId?: string;
      groupName?: string;
    }
  ) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen = true,
  onClose,
  user,
  lang,
  onSubmitWithdraw
}) => {
  const [method, setMethod] = useState<WithdrawMethod>('roblox_username');
  const [amountStr, setAmountStr] = useState(user.robuxBalance >= 10 ? '10' : user.robuxBalance >= 5 ? '5' : '5');
  const [robloxUsername, setRobloxUsername] = useState(user.robloxUsername || '');
  const [gamepassId, setGamepassId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = translations[lang];

  if (isOpen === false) return null;

  const parsedAmount = parseFloat(amountStr) || 0;
  const minLimit = 5;
  const maxLimit = 10000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (user.robuxBalance < minLimit) {
      setErrorMsg(t.lowBalanceWarning || `Minimal yechish miqdori: ${minLimit} Robux! Ekranni bosib Robux yig'ing.`);
      sounds.playClick(0.6);
      return;
    }

    if (parsedAmount < minLimit) {
      setErrorMsg(`Minimal yechish miqdori: ${minLimit} Robux!`);
      sounds.playClick(0.6);
      return;
    }

    if (parsedAmount > maxLimit) {
      setErrorMsg(`Maksimal yechish miqdori: ${maxLimit} Robux!`);
      sounds.playClick(0.6);
      return;
    }

    if (parsedAmount > user.robuxBalance) {
      setErrorMsg(lang === 'uz' ? 'Balansda yetarli Robux yo\'q!' : lang === 'ru' ? 'Недостаточно Robux на балансе!' : 'Insufficient Robux balance!');
      sounds.playClick(0.6);
      return;
    }

    if (!robloxUsername.trim()) {
      setErrorMsg(lang === 'uz' ? 'Roblox foydalanuvchi nomingizni (Username) kiriting!' : lang === 'ru' ? 'Введите никнейм в Roblox!' : 'Enter your Roblox username!');
      sounds.playClick(0.6);
      return;
    }

    if (!gamepassId.trim() && method !== 'roblox_group') {
      setErrorMsg(
        lang === 'uz'
          ? 'Gamepass yaratilgan havola yoki ID sini kiriting! (Gamepass bo\'lmasa Robux tushmaydi)'
          : lang === 'ru'
          ? 'Укажите ссылку или ID Gamepass! (Без Gamepass робуксы не поступят)'
          : 'Please provide Gamepass link or ID! (Robux cannot be delivered without Gamepass)'
      );
      sounds.playClick(0.6);
      return;
    }

    // Submit withdrawal request
    onSubmitWithdraw(parsedAmount, method, {
      robloxUsername: robloxUsername.trim(),
      gamepassLinkOrId: gamepassId.trim(),
      groupName: groupName.trim()
    });

    sounds.playCoin();
    try {
      confetti({ particleCount: 50, spread: 60, colors: ['#ffffff', '#22c55e', '#a1a1aa'] });
    } catch {}
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-zinc-950 font-black shadow-md">
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{t.withdrawTitle}</h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {t.minWithdraw}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {submitted ? (
            <div className="py-6 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shadow-xl">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">{t.withdrawSuccessNotice}</h4>
                <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  {t.withdrawModalCooldownBanner}
                </p>
              </div>

              <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl max-w-sm mx-auto text-xs font-mono space-y-2 text-zinc-300 shadow-inner">
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-500">Yechilgan Miqdor:</span>
                  <span className="text-white font-bold">{parsedAmount.toFixed(1)} RBX</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-500">Roblox Nick:</span>
                  <span className="text-white font-bold">@{robloxUsername}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-500">Gamepass:</span>
                  <span className="text-zinc-300 font-bold truncate max-w-[150px]">{gamepassId || 'Mavjud'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Holat:</span>
                  <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded">7 KUN RAZMOROZKA</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl text-sm transition shadow-lg active:scale-98"
              >
                {t.understoodClose}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* CRITICAL USER WARNING / QOIDA BANNER */}
              <div className="p-4 bg-gradient-to-r from-red-950/40 via-amber-950/30 to-zinc-950 border-2 border-red-500/40 rounded-2xl text-xs text-zinc-200 space-y-1.5 shadow-lg">
                <div className="flex items-center gap-2 text-red-400 font-black tracking-wide text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce text-red-400" />
                  <span>MUHIM QOIDA / QAT'IY OGOHLANTIRISH</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-zinc-300 font-medium">
                  {t.withdrawRuleWarning}
                </p>
              </div>

              {/* Balance Summary & Low Balance Check */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold text-xs">
                    R$
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">{t.availableRobux}</span>
                    <span className="text-sm font-black font-mono text-white">{user.robuxBalance.toFixed(1)} RBX</span>
                  </div>
                </div>
                {user.robuxBalance < minLimit && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                    Kamida 5 RBX kerak
                  </span>
                )}
              </div>

              {/* Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  {t.selectMethod}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMethod('roblox_username'); sounds.playClick(); }}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      method === 'roblox_username'
                        ? 'bg-white text-zinc-950 border-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span className="text-xs font-bold leading-tight">Gamepass (Asosiy)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMethod('roblox_gamepass'); sounds.playClick(); }}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      method === 'roblox_gamepass'
                        ? 'bg-white text-zinc-950 border-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold leading-tight">Roblox Nick</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMethod('roblox_group'); sounds.playClick(); }}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition ${
                      method === 'roblox_group'
                        ? 'bg-white text-zinc-950 border-white shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold leading-tight">Guruh (Group)</span>
                  </button>
                </div>
              </div>

              {/* Amount Input & Presets */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                    {t.amountToWithdraw}
                  </label>
                  <span className="text-xs font-mono text-zinc-400">
                    Mavjud: <strong className="text-white">{user.robuxBalance.toFixed(1)} RBX</strong>
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min={minLimit}
                    max={Math.min(maxLimit, Math.max(minLimit, user.robuxBalance))}
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-lg font-mono font-bold text-white focus:outline-none focus:border-white transition"
                    placeholder="10"
                  />
                  <button
                    type="button"
                    onClick={() => setAmountStr(Math.floor(user.robuxBalance).toString())}
                    className="absolute right-2 top-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition"
                  >
                    MAX
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[5, 10, 50, 100, 500, 1000, 3000].map(val => (
                    <button
                      key={val}
                      type="button"
                      disabled={val > user.robuxBalance}
                      onClick={() => { setAmountStr(val.toString()); sounds.playClick(); }}
                      className="flex-1 min-w-[45px] py-1.5 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 font-bold transition"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination inputs: Roblox Username & Gamepass */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                    <span>1. Roblox Username (Majburiy)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Nikni aniq yozing</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={robloxUsername}
                    onChange={(e) => setRobloxUsername(e.target.value)}
                    placeholder="Masalan: ProGamer_99"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-white transition font-mono"
                  />
                </div>

                {method !== 'roblox_group' && (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                      <span>2. Gamepass Link yoki Asset ID (Majburiy)</span>
                      <span className="text-[10px] text-red-400 font-bold">Gamepass bo'lishi shart!</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={gamepassId}
                      onChange={(e) => setGamepassId(e.target.value)}
                      placeholder="Masalan: https://roblox.com/game-pass/12345678 yoki 12345678"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-white transition font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">
                      * O'yiningizda yechilayotgan Robux miqdoridagi Gamepass yarating.
                    </p>
                  </div>
                )}

                {method === 'roblox_group' && (
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                      Roblox Guruh Nomi (Group Name)
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Guruh nomi yoki havolasi"
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-white focus:outline-none focus:border-white transition"
                    />
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold flex items-start gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl text-sm shadow-xl active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                <span>{t.submitWithdraw}</span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
