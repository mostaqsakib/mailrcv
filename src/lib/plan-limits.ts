export type PlanType = 'guest' | 'free' | 'paid';

export interface PlanLimits {
  maxInboxes: number;
  maxEmailsPerInbox: number;
  retentionHours: number;
  retentionLabel: string;
  customDomain: boolean;
  passwordProtection: boolean;
  label: string;
  description: string;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  guest: {
    maxInboxes: 5,
    maxEmailsPerInbox: 10,
    retentionHours: 24,
    retentionLabel: '24 hours',
    customDomain: false,
    passwordProtection: false,
    label: 'Guest',
    description: 'No signup needed',
  },
  free: {
    maxInboxes: 10,
    maxEmailsPerInbox: 50,
    retentionHours: 168, // 7 days
    retentionLabel: '7 days',
    customDomain: false,
    passwordProtection: true,
    label: 'Free',
    description: 'Create an account',
  },
  paid: {
    maxInboxes: Infinity,
    maxEmailsPerInbox: Infinity,
    retentionHours: Infinity,
    retentionLabel: 'Forever',
    customDomain: true,
    passwordProtection: true,
    label: 'Pro',
    description: 'Unlimited everything',
  },
};

// Guest inbox tracking via localStorage
const GUEST_INBOXES_KEY = 'mailrcv_guest_inboxes';

export function getGuestInboxes(): string[] {
  try {
    const stored = localStorage.getItem(GUEST_INBOXES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addGuestInbox(aliasId: string): void {
  const inboxes = getGuestInboxes();
  if (!inboxes.includes(aliasId)) {
    inboxes.push(aliasId);
    localStorage.setItem(GUEST_INBOXES_KEY, JSON.stringify(inboxes));
  }
}

export function removeGuestInbox(aliasId: string): void {
  const inboxes = getGuestInboxes().filter(id => id !== aliasId);
  localStorage.setItem(GUEST_INBOXES_KEY, JSON.stringify(inboxes));
}

export function canCreateInbox(plan: PlanType, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].maxInboxes;
}

export function canUsePasswordProtection(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].passwordProtection;
}

export function canUseCustomDomain(plan: PlanType): boolean {
  return PLAN_LIMITS[plan].customDomain;
}
