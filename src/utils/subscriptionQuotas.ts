import type { SubscriptionQuotas, SubscriptionTier } from '../features/subscription/types';

const VALID_TIERS: SubscriptionTier[] = [
  'account_trial',
  'expired_locked',
  'premium_storekit_trial',
  'family_storekit_trial',
  'premium',
  'family',
  'none',
];

export const DEFAULT_QUOTAS: SubscriptionQuotas = {
  tier: 'expired_locked',
  maxProfiles: 2,
  profilesUsed: 0,
  profilesRemaining: 2,
  scansAllowed: false,
  scansPerDay: 0,
  scansUsedToday: 0,
  scansRemainingToday: 0,
  requiresSubscription: true,
  resetsAt: null,
};

function asNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === 'number' && !Number.isNaN(v)) {
    return v;
  }
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function asNumber(v: unknown, fallback = 0): number {
  const n = asNumberOrNull(v);
  return n == null ? fallback : n;
}

function normalizeTier(raw: unknown): SubscriptionTier {
  const tierRaw = String(raw || 'none').toLowerCase();
  if (tierRaw === 'trial') {
    return 'account_trial';
  }
  if ((VALID_TIERS as string[]).includes(tierRaw)) {
    return tierRaw as SubscriptionTier;
  }
  return 'none';
}

export function mapQuotasFromBackend(
  raw: Record<string, any> | null | undefined,
): SubscriptionQuotas {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_QUOTAS };
  }

  return {
    tier: normalizeTier(raw.tier),
    maxProfiles: asNumberOrNull(raw.maxProfiles),
    profilesUsed: asNumber(raw.profilesUsed, 0),
    profilesRemaining: asNumberOrNull(raw.profilesRemaining),
    scansAllowed: Boolean(raw.scansAllowed),
    scansPerDay: asNumberOrNull(raw.scansPerDay),
    scansUsedToday: asNumber(raw.scansUsedToday, 0),
    scansRemainingToday: asNumberOrNull(raw.scansRemainingToday),
    requiresSubscription: Boolean(raw.requiresSubscription),
    resetsAt:
      typeof raw.resetsAt === 'string' && raw.resetsAt.trim()
        ? raw.resetsAt
        : null,
  };
}

export function canAddPetProfile(quotas: SubscriptionQuotas | null | undefined): boolean {
  if (!quotas) {
    return true;
  }
  if (quotas.profilesRemaining == null) {
    return true;
  }
  return quotas.profilesRemaining > 0;
}

export function canStartScan(quotas: SubscriptionQuotas | null | undefined): boolean {
  if (!quotas) {
    return true;
  }
  if (!quotas.scansAllowed) {
    return false;
  }
  if (quotas.scansRemainingToday == null) {
    return true;
  }
  return quotas.scansRemainingToday > 0;
}

export function formatResetsAt(iso: string | null | undefined): string {
  if (!iso) {
    return 'midnight UTC';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function getApiErrorData(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const data = (error as { data?: unknown }).data;
  if (typeof data === 'object' && data !== null) {
    return data as Record<string, unknown>;
  }
  return null;
}

export function getApiErrorDetail(error: unknown): string | null {
  const data = getApiErrorData(error);
  if (!data) {
    return null;
  }
  const detail = data.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }
  return null;
}

export function getApiErrorCode(error: unknown): string | null {
  const data = getApiErrorData(error);
  if (!data) {
    return null;
  }
  const code = data.code;
  if (typeof code === 'string' && code.trim()) {
    return code;
  }
  return null;
}

/** Quota / paywall 403s — must not log the user out */
export function isQuotaOrPaywallError(
  status: unknown,
  responseData: unknown,
): boolean {
  if (status !== 403 && status !== 429) {
    return false;
  }
  if (typeof responseData !== 'object' || responseData === null) {
    return false;
  }
  const code = String((responseData as { code?: string }).code || '');
  return (
    code === 'subscription_required' ||
    code === 'profile_limit_reached' ||
    code === 'daily_scan_limit_reached'
  );
}

export function isDailyScanLimitError(status: unknown, error: unknown): boolean {
  if (status !== 429) {
    return false;
  }
  const code = getApiErrorCode(error);
  if (code === 'daily_scan_limit_reached') {
    return true;
  }
  const data = getApiErrorData(error);
  return typeof data?.resetsAt === 'string';
}

export function profilesUsageLabel(
  quotas: SubscriptionQuotas | null | undefined,
): string | null {
  if (!quotas || quotas.maxProfiles == null) {
    return null;
  }
  return `${quotas.profilesUsed}/${quotas.maxProfiles} profiles`;
}

export function scansLeftLabel(
  quotas: SubscriptionQuotas | null | undefined,
): string | null {
  if (!quotas) {
    return null;
  }
  if (!quotas.scansAllowed) {
    return 'Subscribe to scan';
  }
  if (quotas.scansRemainingToday == null) {
    return 'Unlimited scans';
  }
  const left = quotas.scansRemainingToday;
  return `${left} scan${left === 1 ? '' : 's'} left today`;
}

export function addPetButtonTitle(
  quotas: SubscriptionQuotas | null | undefined,
): string {
  if (!quotas || canAddPetProfile(quotas)) {
    return 'Add Pet';
  }
  if (quotas.requiresSubscription || quotas.tier === 'expired_locked') {
    return 'Upgrade';
  }
  if (quotas.tier === 'family' && quotas.profilesRemaining === 0) {
    return 'Limit Reached';
  }
  return 'Upgrade';
}

export function isAddPetButtonDisabled(
  quotas: SubscriptionQuotas | null | undefined,
): boolean {
  if (!quotas || canAddPetProfile(quotas)) {
    return false;
  }
  return quotas.tier === 'family' && quotas.profilesRemaining === 0;
}

export function humanizeQuotaTier(tier: SubscriptionTier | string | null): string {
  switch (tier) {
    case 'account_trial':
      return 'Account trial';
    case 'expired_locked':
      return 'Trial ended';
    case 'premium_storekit_trial':
      return 'Premium trial';
    case 'family_storekit_trial':
      return 'Family trial';
    case 'premium':
      return 'Premium';
    case 'family':
      return 'Family';
    default:
      return 'Free';
  }
}
