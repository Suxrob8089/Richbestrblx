export type WithdrawMethod = 'roblox_username' | 'roblox_gamepass' | 'roblox_group';

export type WithdrawStatus = 'pending_7days' | 'gived' | 'rejected';

export interface UserProfile {
  id: string; // e.g. "89241" or "RBX-7741"
  username: string;
  avatar: string;
  robloxUsername?: string;
  robuxBalance: number; // Max 10,000 RBX
  frozenRobux: number; // Robux in 7-day razmorozka wait
  totalClicks: number;
  clicksToday?: number;
  energy: number; // 0 to 500 clicks
  maxEnergy: number; // 500
  lastEnergyRefillTimestamp: number;
  nextFullRefillTimestamp: number;
  createdAt: number;
  lastActiveAt: number;
  isOnline?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  amountRobux: number;
  withdrawMethod: WithdrawMethod;
  destinationDetails: {
    robloxUsername?: string;
    gamepassLinkOrId?: string;
    groupName?: string;
  };
  requestedAt: number;
  unlockAt: number; // requestedAt + 7 days in ms
  status: WithdrawStatus;
  adminNote?: string;
  givedAt?: number;
}

export interface AdminConfig {
  robuxPerClick: number; // 0.1 R$
  maxEnergy: number; // 500 clicks
  refillDurationHours: number; // 3 hours
  maxBalanceCap: number; // 10,000 Robux
  broadcastMessage: string;
  adminPassword: string; // "11224566ss"
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
  isRead: boolean;
  relatedWithdrawalId?: string;
}

export type Language = 'uz' | 'ru' | 'en';
