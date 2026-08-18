import React, { useState, useEffect, useCallback } from 'react';
import { 
  getActiveUser, 
  saveActiveUser, 
  scheduleSaveActiveUser,
  flushPendingUserSave,
  getAllUsers, 
  saveAllUsers, 
  getAllWithdrawals, 
  saveAllWithdrawals, 
  getAdminConfig, 
  saveAdminConfig, 
  getAllNotifications, 
  saveAllNotifications, 
  calculateCurrentEnergy
} from './utils/storage';
import { 
  UserProfile, 
  WithdrawalRequest, 
  AdminConfig, 
  UserNotification, 
  Language, 
  WithdrawMethod, 
  WithdrawStatus 
} from './types';
import { translations } from './utils/translations';
import { Navbar } from './components/Navbar';
import { ClickerArea } from './components/ClickerArea';
import { ProfileModal } from './components/ProfileModal';
import { WithdrawModal } from './components/WithdrawModal';
import { WithdrawalHistoryModal } from './components/WithdrawalHistoryModal';
import { AdminModal } from './components/AdminModal';
import { NotificationsModal } from './components/NotificationsModal';
import { sounds } from './utils/audio';
import { Youtube, Send } from 'lucide-react';

export default function App() {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('rbx_clicker_lang');
      if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved as Language;
    } catch {}
    return 'uz';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('rbx_clicker_lang', newLang);
    } catch {}
  };

  const t = translations[lang];
  const [user, setUser] = useState<UserProfile>(() => getActiveUser());
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => getAllUsers());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => getAllWithdrawals());
  const [notifications, setNotifications] = useState<UserNotification[]>(() => getAllNotifications());
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(() => getAdminConfig());

  // Modal open states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Periodic passive energy refill check (500 clicks in 3 hours)
  useEffect(() => {
    const timer = setInterval(() => {
      setUser(prev => {
        const updated = calculateCurrentEnergy(prev, adminConfig);
        if (updated.energy !== prev.energy) {
          scheduleSaveActiveUser(updated);
          return updated;
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [adminConfig]);

  // Flush pending writes when closing or unmounting
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingUserSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushPendingUserSave();
    };
  }, []);

  // Click / Tap Handler: 1 touch = 0.1 Robux, max 500 clicks, max 10,000 balance
  // OPTIMIZED for ZERO LAG with instant in-memory mutation and debounced persistence
  const handleTap = useCallback((_x?: number, _y?: number) => {
    setUser(prev => {
      const maxCap = adminConfig.maxBalanceCap || 10000;
      if (prev.energy <= 0 || prev.robuxBalance >= maxCap) {
        return prev;
      }

      const reward = adminConfig.robuxPerClick || 0.5;
      const nextBalance = Math.min(maxCap, Number((prev.robuxBalance + reward).toFixed(2)));
      const nextEnergy = Math.max(0, prev.energy - 1);
      const nextClicks = prev.totalClicks + 1;

      const now = Date.now();
      const refillDurationMs = (adminConfig.refillDurationHours || 3) * 3600 * 1000;
      const msPerPoint = refillDurationMs / (adminConfig.maxEnergy || 500);

      const updated: UserProfile = {
        ...prev,
        robuxBalance: nextBalance,
        energy: nextEnergy,
        totalClicks: nextClicks,
        clicksToday: (prev.clicksToday || 0) + 1,
        lastEnergyRefillTimestamp: prev.energy === prev.maxEnergy ? now : prev.lastEnergyRefillTimestamp,
        nextFullRefillTimestamp: now + (prev.maxEnergy - nextEnergy) * msPerPoint,
        lastActiveAt: now,
        isOnline: true
      };

      // Debounced storage write so fast multi-touches are completely fluid without lockup
      scheduleSaveActiveUser(updated);

      return updated;
    });
  }, [adminConfig]);

  // Update Profile
  const handleUpdateProfile = (updatedProps: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = { ...prev, ...updatedProps };
      saveActiveUser(updated);
      setAllUsers(prevAll => {
        const idx = prevAll.findIndex(u => u.id === updated.id);
        const copy = [...prevAll];
        if (idx >= 0) copy[idx] = updated;
        saveAllUsers(copy);
        return copy;
      });
      return updated;
    });
  };

  // Submit Withdrawal Request (7-day Hold / Razmorozka)
  const handleSubmitWithdrawal = (
    amountRobux: number,
    method: WithdrawMethod,
    details: {
      robloxUsername?: string;
      gamepassLinkOrId?: string;
      groupName?: string;
    }
  ) => {
    const now = Date.now();
    const unlockAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    const newReq: WithdrawalRequest = {
      id: `WD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      username: user.username,
      amountRobux,
      withdrawMethod: method,
      destinationDetails: details,
      requestedAt: now,
      unlockAt,
      status: 'pending_7days'
    };

    // Update User Balance: Deduct from active robuxBalance, add to frozenRobux
    setUser(prev => {
      const updated: UserProfile = {
        ...prev,
        robuxBalance: Math.max(0, Number((prev.robuxBalance - amountRobux).toFixed(2))),
        frozenRobux: Number((prev.frozenRobux + amountRobux).toFixed(2))
      };
      saveActiveUser(updated);
      return updated;
    });

    // Save Withdrawal
    setWithdrawals(prev => {
      const updated = [newReq, ...prev];
      saveAllWithdrawals(updated);
      return updated;
    });

    // Add Notification
    const newNotif: UserNotification = {
      id: `NOTIF-${Date.now()}`,
      userId: user.id,
      title: lang === 'uz' ? 'Robux yechish so\'rovi qabul qilindi' : lang === 'ru' ? 'Заявка на вывод принята' : 'Withdrawal Request Submitted',
      message: lang === 'uz' 
        ? `${amountRobux} R$ yechishga so'rov berildi. Roblox qoidasiga binoan 7 kunlik razmorozkadan keyin hisobingizga o'tkaziladi.`
        : lang === 'ru'
        ? `Заявка на вывод ${amountRobux} R$ принята. Согласно правилам Roblox, робуксы поступят через 7 дней разморозки.`
        : `${amountRobux} R$ withdrawal requested. Under Roblox rules, Robux will be credited after 7 days cooldown.`,
      type: 'info',
      timestamp: now,
      isRead: false,
      relatedWithdrawalId: newReq.id
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveAllNotifications(updated);
      return updated;
    });
  };

  // Admin updates withdrawal status (e.g. "Gived" -> "Robux was gived")
  const handleUpdateWithdrawalStatus = (
    requestId: string,
    status: WithdrawStatus,
    note?: string
  ) => {
    const now = Date.now();
    const req = withdrawals.find(w => w.id === requestId);
    if (!req) return;

    setWithdrawals(prev => {
      const updated = prev.map(w => {
        if (w.id === requestId) {
          return {
            ...w,
            status,
            adminNote: note || (status === 'gived' ? 'Robux was gived!' : ''),
            givedAt: status === 'gived' ? now : undefined
          };
        }
        return w;
      });
      saveAllWithdrawals(updated);
      return updated;
    });

    // Update target user balances
    setAllUsers(prevAll => {
      const updatedUsers = prevAll.map(u => {
        if (u.id === req.userId) {
          if (status === 'gived') {
            return {
              ...u,
              frozenRobux: Math.max(0, Number((u.frozenRobux - req.amountRobux).toFixed(2)))
            };
          } else if (status === 'rejected') {
            return {
              ...u,
              robuxBalance: Number((u.robuxBalance + req.amountRobux).toFixed(2)),
              frozenRobux: Math.max(0, Number((u.frozenRobux - req.amountRobux).toFixed(2)))
            };
          }
        }
        return u;
      });
      saveAllUsers(updatedUsers);
      return updatedUsers;
    });

    // If target user is current active user, sync state
    if (user.id === req.userId) {
      setUser(prev => {
        if (status === 'gived') {
          return {
            ...prev,
            frozenRobux: Math.max(0, Number((prev.frozenRobux - req.amountRobux).toFixed(2)))
          };
        } else if (status === 'rejected') {
          return {
            ...prev,
            robuxBalance: Number((prev.robuxBalance + req.amountRobux).toFixed(2)),
            frozenRobux: Math.max(0, Number((prev.frozenRobux - req.amountRobux).toFixed(2)))
          };
        }
        return prev;
      });
    }

    // Send notification to user: "Robux was gived"
    const notifTitle = status === 'gived' ? '✅ Robux was gived!' : '❌ Yechib olish bekor qilindi';
    const notifMsg = status === 'gived'
      ? `Robux was gived! Admin sizning ${req.amountRobux} R$ so'rovingizni tasdiqladi va Roblox hisobingizga muvaffaqiyatli yetkazildi!`
      : `Sizning ${req.amountRobux} R$ so'rovingiz bekor qilindi va Robux balansingizga qaytarildi. Izoh: ${note || 'Admin bekor qildi'}`;

    const newNotif: UserNotification = {
      id: `NOTIF-${Date.now()}`,
      userId: req.userId,
      title: notifTitle,
      message: notifMsg,
      type: status === 'gived' ? 'success' : 'warning',
      timestamp: now,
      isRead: false,
      relatedWithdrawalId: req.id
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveAllNotifications(updated);
      return updated;
    });
  };

  // Admin adds (+) or minuses (-) Robux balance to ANY user ID
  const handleAdminUpdateUserBalance = (
    userId: string,
    deltaRobux: number,
    reason: string
  ) => {
    const now = Date.now();
    const changeDescription = `${deltaRobux > 0 ? '+' : ''}${deltaRobux} RBX`;

    setAllUsers(prevAll => {
      const existingIdx = prevAll.findIndex(u => u.id.toLowerCase() === userId.toLowerCase());
      let updatedUsers = [...prevAll];

      if (existingIdx >= 0) {
        const u = prevAll[existingIdx];
        const nextBal = Math.max(0, Math.min(adminConfig.maxBalanceCap, Number((u.robuxBalance + deltaRobux).toFixed(2))));
        updatedUsers[existingIdx] = {
          ...u,
          robuxBalance: nextBal,
          lastActiveAt: now
        };
      } else {
        // Create new user record for this ID if not exists
        const newUser: UserProfile = {
          id: userId,
          username: `Player_${userId}`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          robuxBalance: Math.max(0, Math.min(adminConfig.maxBalanceCap, Math.max(0, deltaRobux))),
          frozenRobux: 0,
          energy: adminConfig.maxEnergy || 500,
          maxEnergy: adminConfig.maxEnergy || 500,
          lastEnergyRefillTimestamp: now,
          nextFullRefillTimestamp: now,
          totalClicks: 0,
          clicksToday: 0,
          createdAt: now,
          lastActiveAt: now
        };
        updatedUsers.push(newUser);
      }

      saveAllUsers(updatedUsers);
      return updatedUsers;
    });

    if (user.id.toLowerCase() === userId.toLowerCase()) {
      setUser(prev => {
        const nextBal = Math.max(0, Math.min(adminConfig.maxBalanceCap, Number((prev.robuxBalance + deltaRobux).toFixed(2))));
        const updated = {
          ...prev,
          robuxBalance: nextBal
        };
        saveActiveUser(updated);
        return updated;
      });
    }

    // Add notification
    const newNotif: UserNotification = {
      id: `NOTIF-${Date.now()}`,
      userId,
      title: deltaRobux >= 0 ? 'Admin Robux o\'tkazmasi' : 'Admin Robux hisobdan chiqarildi',
      message: `Admin balansingizga ${changeDescription} kiritdi. Sabab: ${reason || 'Admin boshqaruvi'}.`,
      type: deltaRobux >= 0 ? 'success' : 'info',
      timestamp: now,
      isRead: false
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      saveAllNotifications(updated);
      return updated;
    });
  };

  // Admin saves system config
  const handleUpdateAdminConfig = (newConfig: AdminConfig) => {
    setAdminConfig(newConfig);
    saveAdminConfig(newConfig);
  };

  // Admin switches active user
  const handleSelectActiveUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      const recalculated = calculateCurrentEnergy(target, adminConfig);
      setUser(recalculated);
      saveActiveUser(recalculated);
    }
  };

  const unreadNotifsCount = notifications.filter(n => n.userId === user.id && !n.isRead).length;
  const userWithdrawals = withdrawals.filter(w => w.userId === user.id);
  const activeWithdrawalsCount = userWithdrawals.filter(w => w.status === 'pending_7days').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-white selection:text-zinc-950 relative overflow-x-hidden font-sans">
      
      {/* Top Navbar with White Theme, YouTube & Telegram, and 3-Lines Admin */}
      <Navbar
        user={user}
        lang={lang}
        onSetLang={setLang}
        unreadNotifsCount={unreadNotifsCount}
        activeWithdrawalsCount={activeWithdrawalsCount}
        onOpenProfile={() => { setIsProfileOpen(true); sounds.playClick(); }}
        onOpenWithdraw={() => { setIsWithdrawOpen(true); sounds.playClick(); }}
        onOpenHistory={() => { setIsHistoryOpen(true); sounds.playClick(); }}
        onOpenNotifications={() => { setIsNotificationsOpen(true); sounds.playClick(); }}
        onOpenAdmin={() => { setIsAdminOpen(true); sounds.playClick(); }}
      />

      {/* Main Interactive Screen */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-4xl mx-auto w-full">
        <ClickerArea
          user={user}
          adminConfig={adminConfig}
          lang={lang}
          onTap={handleTap}
          onOpenWithdraw={() => { setIsWithdrawOpen(true); sounds.playClick(); }}
          onOpenAdmin={() => { setIsAdminOpen(true); sounds.playClick(); }}
        />
      </main>

      {/* Footer Info & Social Links */}
      <footer className="w-full py-4 px-6 border-t border-zinc-800 bg-zinc-950 text-zinc-400 text-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wide">{t.cooldownNotice}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://youtube.com/@richbestrbx?si=LicXoj_ECGS-3lhD"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 transition"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube</span>
            </a>
            <a
              href="https://t.me/whymee33"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-sky-400 transition"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          user={user}
          lang={lang}
          onClose={() => setIsProfileOpen(false)}
          onUpdateProfile={handleUpdateProfile}
        />
      )}

      {isWithdrawOpen && (
        <WithdrawModal
          isOpen={isWithdrawOpen}
          user={user}
          lang={lang}
          onClose={() => setIsWithdrawOpen(false)}
          onSubmitWithdraw={handleSubmitWithdrawal}
        />
      )}

      {isHistoryOpen && (
        <WithdrawalHistoryModal
          withdrawals={userWithdrawals}
          lang={lang}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        lang={lang}
        users={allUsers}
        activeUserId={user.id}
        withdrawals={withdrawals}
        adminConfig={adminConfig}
        onUpdateAdminConfig={handleUpdateAdminConfig}
        onUpdateUserBalance={handleAdminUpdateUserBalance}
        onUpdateWithdrawalStatus={handleUpdateWithdrawalStatus}
        onSelectActiveUser={handleSelectActiveUser}
      />

      {isNotificationsOpen && (
        <NotificationsModal
          notifications={notifications.filter(n => n.userId === user.id)}
          lang={lang}
          onClose={() => setIsNotificationsOpen(false)}
          onMarkAllRead={() => {
            setNotifications(prev => {
              const updated = prev.map(n => n.userId === user.id ? { ...n, isRead: true } : n);
              saveAllNotifications(updated);
              return updated;
            });
            sounds.playClick();
          }}
          onClearAll={() => {
            setNotifications(prev => {
              const updated = prev.filter(n => n.userId !== user.id);
              saveAllNotifications(updated);
              return updated;
            });
            sounds.playClick();
          }}
        />
      )}
    </div>
  );
}
