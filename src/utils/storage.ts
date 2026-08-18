import { UserProfile, WithdrawalRequest, AdminConfig, UserNotification } from '../types';

const STORAGE_KEY_USERS = 'rbx_clicker_users_v4';
const STORAGE_KEY_ACTIVE_USER = 'rbx_clicker_active_user_id_v4';
const STORAGE_KEY_WITHDRAWALS = 'rbx_clicker_withdrawals_v4';
const STORAGE_KEY_ADMIN_CONFIG = 'rbx_clicker_admin_config_v4';
const STORAGE_KEY_NOTIFICATIONS = 'rbx_clicker_notifications_v4';

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  robuxPerClick: 0.5,
  maxEnergy: 500,
  refillDurationHours: 3,
  maxBalanceCap: 10000,
  broadcastMessage: 'Xush kelibsiz! 1 bosish = 0.5 R$. 500 ta energiya har 3 soatda to\'liq tiklanadi.',
  adminPassword: '11224566ss'
};

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
];

export function generateUserId(): string {
  const randNum = Math.floor(10000 + Math.random() * 90000);
  return `${randNum}`;
}

export function createInitialUser(): UserProfile {
  const now = Date.now();
  return {
    id: generateUserId(),
    username: 'Robloxian_' + Math.floor(100 + Math.random() * 900),
    avatar: DEFAULT_AVATARS[0],
    robloxUsername: '',
    robuxBalance: 0.0,
    frozenRobux: 0.0,
    totalClicks: 0,
    clicksToday: 0,
    energy: 500,
    maxEnergy: 500,
    lastEnergyRefillTimestamp: now,
    nextFullRefillTimestamp: now + 3 * 60 * 60 * 1000,
    createdAt: now,
    lastActiveAt: now,
    isOnline: true
  };
}

export function getAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.robuxPerClick || parsed.robuxPerClick === 0.1) {
        parsed.robuxPerClick = 0.5;
      }
      return { ...DEFAULT_ADMIN_CONFIG, ...parsed };
    }
  } catch {
    // Fallback
  }
  return DEFAULT_ADMIN_CONFIG;
}

export function saveAdminConfig(cfg: AdminConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_CONFIG, JSON.stringify(cfg));
  } catch {
    // Ignore
  }
}

// REAL USERS ONLY (NO FAKE ONLINES)
export function getAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const users: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(users) && users.length > 0) return users;
    }
  } catch {
    // Fallback
  }
  const primary = createInitialUser();
  saveAllUsers([primary]);
  return [primary];
}

export function saveAllUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch {
    // Ignore
  }
}

export function getActiveUser(): UserProfile {
  const users = getAllUsers();
  const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
  const found = users.find(u => u.id === activeId);
  if (found) {
    return calculateCurrentEnergy(found, getAdminConfig());
  }
  const first = users[0] || createInitialUser();
  localStorage.setItem(STORAGE_KEY_ACTIVE_USER, first.id);
  return calculateCurrentEnergy(first, getAdminConfig());
}

let saveUserTimeout: NodeJS.Timeout | null = null;
let pendingUserToSave: UserProfile | null = null;

export function scheduleSaveActiveUser(user: UserProfile) {
  pendingUserToSave = user;
  if (saveUserTimeout) clearTimeout(saveUserTimeout);
  saveUserTimeout = setTimeout(() => {
    if (pendingUserToSave) {
      saveActiveUser(pendingUserToSave);
      pendingUserToSave = null;
    }
  }, 400);
}

export function flushPendingUserSave() {
  if (saveUserTimeout) clearTimeout(saveUserTimeout);
  if (pendingUserToSave) {
    saveActiveUser(pendingUserToSave);
    pendingUserToSave = null;
  }
}

export function saveActiveUser(user: UserProfile) {
  try {
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    saveAllUsers(users);
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, user.id);
  } catch {
    // Ignore
  }
}

// Calculate passive energy recovery over 3 hours
export function calculateCurrentEnergy(user: UserProfile, config: AdminConfig): UserProfile {
  const now = Date.now();
  const maxEnergy = config.maxEnergy || 500;
  const refillDurationMs = (config.refillDurationHours || 3) * 60 * 60 * 1000;

  if (user.energy >= maxEnergy) {
    return {
      ...user,
      energy: maxEnergy,
      maxEnergy: maxEnergy,
      lastEnergyRefillTimestamp: now,
      nextFullRefillTimestamp: now
    };
  }

  const timePassed = now - (user.lastEnergyRefillTimestamp || now);
  const energyRecovered = Math.floor((timePassed / refillDurationMs) * maxEnergy);

  if (energyRecovered > 0) {
    const newEnergy = Math.min(maxEnergy, user.energy + energyRecovered);
    const msPerPoint = refillDurationMs / maxEnergy;
    const remainingTime = (maxEnergy - newEnergy) * msPerPoint;

    return {
      ...user,
      energy: newEnergy,
      maxEnergy: maxEnergy,
      lastEnergyRefillTimestamp: now - (timePassed % (refillDurationMs / maxEnergy)),
      nextFullRefillTimestamp: now + remainingTime
    };
  }

  const msPerPoint = refillDurationMs / maxEnergy;
  const remainingTime = (maxEnergy - user.energy) * msPerPoint;

  return {
    ...user,
    maxEnergy: maxEnergy,
    nextFullRefillTimestamp: now + remainingTime
  };
}

export function getAllWithdrawals(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WITHDRAWALS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function saveAllWithdrawals(withdrawals: WithdrawalRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEY_WITHDRAWALS, JSON.stringify(withdrawals));
  } catch {
    // Ignore
  }
}

export function getAllNotifications(): UserNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function saveAllNotifications(notifs: UserNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
  } catch {
    // Ignore
  }
}
