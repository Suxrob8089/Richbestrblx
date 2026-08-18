import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle, 
  XCircle, 
  Users, 
  Settings, 
  Search,
  Gamepad2,
  User as UserIcon,
  Users as GroupIcon,
  KeyRound,
  Radio,
  Clock,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  UserProfile, 
  WithdrawalRequest, 
  AdminConfig, 
  Language, 
  WithdrawStatus 
} from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  users: UserProfile[];
  activeUserId: string;
  withdrawals: WithdrawalRequest[];
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (cfg: AdminConfig) => void;
  onUpdateUserBalance: (
    userId: string, 
    deltaRobux: number, 
    reason: string
  ) => void;
  onUpdateWithdrawalStatus: (
    requestId: string, 
    status: WithdrawStatus, 
    note?: string
  ) => void;
  onSelectActiveUser: (userId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  lang,
  users,
  activeUserId,
  withdrawals,
  adminConfig,
  onUpdateAdminConfig,
  onUpdateUserBalance,
  onUpdateWithdrawalStatus,
  onSelectActiveUser
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'balance' | 'online' | 'withdrawals' | 'settings'>('balance');

  // Balance Form State (Direct User ID input)
  const [targetUserId, setTargetUserId] = useState(activeUserId || (users[0]?.id ?? ''));
  const [customIdInput, setCustomIdInput] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('100');
  const [balanceAction, setBalanceAction] = useState<'add' | 'minus'>('add');
  const [balanceReason, setBalanceReason] = useState('Admin bonusi');
  const [balanceSuccessMsg, setBalanceSuccessMsg] = useState('');
  const [balanceErrorMsg, setBalanceErrorMsg] = useState('');

  // Settings State
  const [cfgRobuxPerClick, setCfgRobuxPerClick] = useState((adminConfig.robuxPerClick || 0.5).toString());
  const [cfgMaxEnergy, setCfgMaxEnergy] = useState((adminConfig.maxEnergy || 500).toString());
  const [cfgRefillHours, setCfgRefillHours] = useState((adminConfig.refillDurationHours || 3).toString());
  const [cfgMaxCap, setCfgMaxCap] = useState((adminConfig.maxBalanceCap || 10000).toString());
  const [cfgBroadcast, setCfgBroadcast] = useState(adminConfig.broadcastMessage || '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const t = translations[lang];

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = passwordInput.trim();
    if (cleanPass === '11224566ss' || cleanPass === adminConfig.adminPassword || cleanPass === '11224566SS') {
      setIsAuthenticated(true);
      setAuthError(false);
      sounds.playSuccess();
    } else {
      setAuthError(true);
      sounds.playClick(0.6);
    }
  };

  const handleApplyBalance = (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceErrorMsg('');
    setBalanceSuccessMsg('');

    const finalId = (customIdInput.trim() || targetUserId).trim();
    if (!finalId) {
      setBalanceErrorMsg(lang === 'uz' ? 'Foydalanuvchi ID sini kiriting!' : 'Please enter user ID!');
      return;
    }

    const val = parseFloat(balanceAmount);
    if (isNaN(val) || val <= 0) {
      setBalanceErrorMsg(lang === 'uz' ? 'To\'g\'ri Robux miqdorini kiriting!' : 'Enter valid Robux amount!');
      return;
    }

    const delta = balanceAction === 'add' ? val : -val;
    onUpdateUserBalance(finalId, delta, balanceReason.trim() || 'Admin amali');

    try {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch {}

    sounds.playSuccess();
    setBalanceSuccessMsg(
      `${finalId} ID ga ${delta > 0 ? '+' : ''}${delta} Robux ${delta > 0 ? 'qo\'shildi' : 'ayirildi'}!`
    );

    setTimeout(() => {
      setBalanceSuccessMsg('');
    }, 4000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newCfg: AdminConfig = {
      ...adminConfig,
      robuxPerClick: parseFloat(cfgRobuxPerClick) || 0.5,
      maxEnergy: parseInt(cfgMaxEnergy) || 500,
      refillDurationHours: parseFloat(cfgRefillHours) || 3,
      maxBalanceCap: parseFloat(cfgMaxCap) || 10000,
      broadcastMessage: cfgBroadcast
    };
    onUpdateAdminConfig(newCfg);
    sounds.playSuccess();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending_7days');
  const now = Date.now();

  // Helper to format last active
  const formatLastActive = (timestamp?: number) => {
    if (!timestamp) return t.justNow;
    const diffSeconds = Math.floor((now - timestamp) / 1000);
    if (diffSeconds < 60) return t.justNow;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins} ${t.minsAgo}`;
    const hours = Math.floor(mins / 60);
    return `${hours} ${t.hoursLeft} oldin`;
  };

  // Online Users filtering (users active in last 10 mins or flagged online)
  const onlineUsers = users.filter(u => u.isOnline !== false || (u.lastActiveAt && (now - u.lastActiveAt) < 10 * 60 * 1000));
  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.robloxUsername && u.robloxUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-black shadow-md">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{t.adminDashboard}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20 uppercase tracking-wider">
                  {t.adminBadge}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono">Roblox Creator Control Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Screen if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 flex-1 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white shadow-xl">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>

            <div className="max-w-sm space-y-1">
              <h4 className="text-lg font-bold text-white">{t.adminLoginTitle}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {t.enterPassword}
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setAuthError(false); }}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-base font-mono font-bold tracking-widest text-white focus:outline-none focus:border-white transition"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold">
                  {t.wrongPassword}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm transition shadow-lg active:scale-98"
              >
                {t.loginBtn}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <>
            {/* Nav Tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 pt-2 gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => { setActiveTab('balance'); sounds.playClick(); }}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'balance'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-white" />
                <span>{t.usersTab}</span>
              </button>

              <button
                onClick={() => { setActiveTab('online'); sounds.playClick(); }}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'online'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>{t.onlineTab} ({onlineUsers.length})</span>
              </button>

              <button
                onClick={() => { setActiveTab('withdrawals'); sounds.playClick(); }}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'withdrawals'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-white" />
                <span>{t.withdrawalsTab}</span>
                {pendingWithdrawals.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-white text-zinc-950 text-[10px] font-black rounded-full ml-1">
                    {pendingWithdrawals.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('settings'); sounds.playClick(); }}
                className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-zinc-900 text-white border-t border-x border-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-white" />
                <span>{t.settingsTab}</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* TAB 1: Direct ID Balance Management */}
              {activeTab === 'balance' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <Coins className="w-4 h-4 text-white" />
                        {t.manageBalance}
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        Max: {adminConfig.maxBalanceCap.toLocaleString()} RBX
                      </span>
                    </div>

                    {/* ID Input or Directory Selection */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                          {t.enterUserIdLabel}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customIdInput}
                            onChange={(e) => {
                              setCustomIdInput(e.target.value);
                              setTargetUserId(e.target.value);
                            }}
                            placeholder={t.userIdPlaceholder}
                            className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                          />
                        </div>
                      </div>

                      {/* User Picker from database */}
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">
                          {t.selectFromList}:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-1">
                          {users.map(u => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setTargetUserId(u.id);
                                setCustomIdInput(u.id);
                                sounds.playClick();
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center justify-between gap-1 transition text-xs font-mono ${
                                (customIdInput === u.id || (!customIdInput && targetUserId === u.id))
                                  ? 'bg-white text-zinc-950 border-white font-bold'
                                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                              }`}
                            >
                              <div className="truncate">
                                <span className="block font-bold truncate">{u.username}</span>
                                <span className="text-[10px] opacity-75">ID: {u.id}</span>
                              </div>
                              <span className="font-bold shrink-0">{u.robuxBalance.toFixed(1)} R$</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Type: Add (+) vs Minus (-) */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setBalanceAction('add'); sounds.playClick(); }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                            balanceAction === 'add'
                              ? 'bg-green-500 text-zinc-950 border-green-400 shadow-md'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>{t.addRobux}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setBalanceAction('minus'); sounds.playClick(); }}
                          className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                            balanceAction === 'minus'
                              ? 'bg-red-500 text-white border-red-400 shadow-md'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>{t.minusRobux}</span>
                        </button>
                      </div>

                      {/* Amount Input & Quick Presets */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                          {t.amount} (Robux)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max={adminConfig.maxBalanceCap}
                          value={balanceAmount}
                          onChange={(e) => setBalanceAmount(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-white transition"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[50, 100, 500, 1000, 3000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setBalanceAmount(amt.toString())}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 font-bold transition"
                            >
                              {balanceAction === 'add' ? `+${amt}` : `-${amt}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                          {t.reasonNote}
                        </label>
                        <input
                          type="text"
                          value={balanceReason}
                          onChange={(e) => setBalanceReason(e.target.value)}
                          placeholder="Admin bonusi / Turnir g'olibi"
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white transition"
                        />
                      </div>

                      {/* Feedback Messages */}
                      {balanceSuccessMsg && (
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>{balanceSuccessMsg}</span>
                        </div>
                      )}

                      {balanceErrorMsg && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold flex items-center gap-2">
                          <XCircle className="w-4 h-4 shrink-0" />
                          <span>{balanceErrorMsg}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="button"
                        onClick={handleApplyBalance}
                        className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm transition shadow-lg active:scale-98"
                      >
                        {t.applyChanges}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Online Users (Who is Online) */}
              {activeTab === 'online' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500 animate-ping"></span>
                      <span className="w-2 h-2 rounded-full bg-green-500 -ml-4"></span>
                      <span className="text-sm font-bold text-white">{t.onlineUsersTitle}</span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      {onlineUsers.length} {t.onlineCount}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {users.map(u => {
                      const isUserOnline = u.isOnline !== false || (u.lastActiveAt && (now - u.lastActiveAt) < 10 * 60 * 1000);
                      const isCurrent = u.id === activeUserId;

                      return (
                        <div 
                          key={u.id}
                          className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                            isUserOnline
                              ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                              : 'bg-zinc-950/30 border-zinc-900 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <img 
                                src={u.avatar} 
                                alt={u.username} 
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-800"
                              />
                              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                                isUserOnline ? 'bg-green-500' : 'bg-zinc-600'
                              }`} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">{u.username}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-zinc-950">
                                    YOU
                                  </span>
                                )}
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  isUserOnline 
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {isUserOnline ? t.onlineBadge : t.offlineBadge}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono mt-0.5">
                                <span>ID: <strong className="text-white">{u.id}</strong></span>
                                {u.robloxUsername && (
                                  <span>RBX: <strong className="text-zinc-300">@{u.robloxUsername}</strong></span>
                                )}
                                <span>{formatLastActive(u.lastActiveAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right font-mono">
                              <span className="text-sm font-black text-white block">
                                {u.robuxBalance.toFixed(1)} R$
                              </span>
                              <span className="text-[10px] text-zinc-500 block">
                                {u.energy}/{u.maxEnergy} Energy
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setTargetUserId(u.id);
                                setCustomIdInput(u.id);
                                setActiveTab('balance');
                                sounds.playClick();
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg transition"
                            >
                              Balans
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Withdrawal Requests & 7-Day Cooldown */}
              {activeTab === 'withdrawals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white" />
                      {t.pendingRequests} ({pendingWithdrawals.length})
                    </h4>
                    <span className="text-xs text-zinc-500 font-mono">
                      Jami: {withdrawals.length} ta
                    </span>
                  </div>

                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs bg-zinc-950/40 rounded-xl border border-zinc-800">
                      <Coins className="w-8 h-8 mx-auto mb-2 opacity-30 text-white" />
                      <p>{t.noRequests}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((req) => {
                        const isPending = req.status === 'pending_7days';
                        const isGived = req.status === 'gived';
                        const isRejected = req.status === 'rejected';

                        return (
                          <div 
                            key={req.id}
                            className={`p-4 rounded-xl border space-y-3 ${
                              isPending 
                                ? 'bg-zinc-950 border-zinc-800' 
                                : 'bg-zinc-950/40 border-zinc-850 opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-black text-base text-white">
                                    {req.amountRobux.toFixed(1)} RBX
                                  </span>
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                    {req.withdrawMethod.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  Foydalanuvchi: <strong className="text-white">{req.username}</strong> (ID: {req.userId})
                                </div>
                              </div>

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

                            {/* Destination information */}
                            <div className="p-2.5 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-300 space-y-1">
                              {req.destinationDetails.robloxUsername && (
                                <div>Roblox User: <strong className="text-white">@{req.destinationDetails.robloxUsername}</strong></div>
                              )}
                              {req.destinationDetails.gamepassLinkOrId && (
                                <div>Gamepass: <strong className="text-zinc-300">{req.destinationDetails.gamepassLinkOrId}</strong></div>
                              )}
                              {req.destinationDetails.groupName && (
                                <div>Group: <strong className="text-zinc-300">{req.destinationDetails.groupName}</strong></div>
                              )}
                            </div>

                            {/* Admin Action Buttons for Pending */}
                            {isPending && (
                              <div className="space-y-2 pt-1">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateWithdrawalStatus(req.id, 'gived', 'Robux was gived! Robux hisobingizga muvaffaqiyatli yetkazildi.');
                                      sounds.playSuccess();
                                      try {
                                        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
                                      } catch {}
                                    }}
                                    className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{t.giveRobuxBtn}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const reason = window.prompt(
                                        'Nosozlik sababini tanlang yoki yozing:\n1. Gamepass yaratilmagan yoki topilmadi\n2. Roblox username xato\n3. Texnik nosozlik',
                                        'Gamepass yaratilmagan yoki topilmadi (Nosozlik bo\'ldi)'
                                      );
                                      if (reason !== null) {
                                        onUpdateWithdrawalStatus(req.id, 'rejected', reason || 'Nosozlik bo\'ldi (Admin bekor qildi)');
                                        sounds.playClick(0.6);
                                      }
                                    }}
                                    className="px-3 sm:px-4 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-red-500/30 active:scale-98"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>{t.rejectBtn}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: System Settings (Rates & Energy) */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-4">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-white" />
                      {t.settingsTab}
                    </h4>

                    {/* Robux Per Tap */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        1 bosishdagi Robux mukofoti (R$)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={cfgRobuxPerClick}
                        onChange={(e) => setCfgRobuxPerClick(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-white transition"
                      />
                      <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Standart: 0.5 Robux per click</span>
                    </div>

                    {/* Max Energy */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        {t.maxEnergySetting}
                      </label>
                      <input
                        type="number"
                        value={cfgMaxEnergy}
                        onChange={(e) => setCfgMaxEnergy(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                      />
                    </div>

                    {/* Refill Hours */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        {t.refillHoursSetting}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={cfgRefillHours}
                        onChange={(e) => setCfgRefillHours(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                      />
                    </div>

                    {/* Max Balance Cap */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        {t.maxBalanceSetting}
                      </label>
                      <input
                        type="number"
                        value={cfgMaxCap}
                        onChange={(e) => setCfgMaxCap(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-white transition"
                      />
                    </div>

                    {/* Broadcast */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                        {t.broadcastMsg}
                      </label>
                      <textarea
                        rows={2}
                        value={cfgBroadcast}
                        onChange={(e) => setCfgBroadcast(e.target.value)}
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white transition"
                      />
                    </div>

                    {settingsSaved && (
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{t.settingsSavedMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm transition"
                    >
                      {t.saveSettings}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 shrink-0 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">
                Admin: <strong className="text-white">Active</strong>
              </span>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setPasswordInput('');
                  sounds.playClick();
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition"
              >
                {t.logoutBtn}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
