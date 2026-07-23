import type { SubscriptionQuotas, SubscriptionTier } from '../features/subscription/types';

export const DEFAULT_QUOTAS: SubscriptionQuotas = {
  tier: 'none',
  maxProfiles: 1,
  profilesUsed: 0,
  profilesRemaining: 1,
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

export function mapQuotasFromBackend(
  raw: Record<string, any> | null | undefined,
): SubscriptionQuotas {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_QUOTAS };
  }

  const tierRaw = String(raw.tier || 'none').toLowerCase();
  const tier: SubscriptionTier =
    tierRaw === 'trial' ||
    tierRaw === 'family' ||
    tierRaw === 'premium' ||
    tierRaw === 'none'
      ? tierRaw
      : 'none';

  return {
    tier,
    maxProfiles: asNumberOrNull(raw.maxProfiles),
    profilesUsed: asNumber(raw.profilesUsed, 0),
    profilesRemaining: asNumberOrNull(raw.profilesRemaining),
    scansAllowed: Boolean(raw.scansAllowed),
    scansPerDay: asNumber(raw.scansPerDay, 0),
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

export function getApiErrorDetail(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const data = (error as { data?: unknown }).data;
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }
  return null;
}

export function getApiErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const data = (error as { data?: unknown }).data;
  if (typeof data === 'object' && data !== null && 'code' in data) {
    const code = (data as { code?: unknown }).code;
    if (typeof code === 'string' && code.trim()) {
      return code;
    }
  }
  return null;
}

/** Quota / paywall 403s — must not log the user out */
export function isQuotaOrPaywallError(
  status: unknown,
  responseData: unknown,
): boolean {
  if (status !== 403) {
    return false;
  }
  if (typeof responseData !== 'object' || responseData === null) {
    return false;
  }
  const code = String((responseData as { code?: string }).code || '');
  return (
    code === 'subscription_required' || code === 'profile_limit_reached'
  );
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
