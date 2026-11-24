import * as Yup from 'yup';

export const PASSWORD_REQUIREMENTS_MSG =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.';

const passwordRules = Yup.string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-z]/, 'Password must contain a lowercase letter')
  .matches(/[A-Z]/, 'Password must contain an uppercase letter')
  .matches(/[0-9]/, 'Password must contain a number')
  .matches(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const signupSchemaEnglish = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  number: Yup.string()
    .required('Mobile number is required')
    .transform(v => (typeof v === 'string' ? v.replace(/\s+/g, '') : v))
    .matches(/^[0-9]{6,15}$/, 'Enter a valid phone number'),
  password: passwordRules,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  agreeTerms: Yup.bool().oneOf(
    [true],
    'You must agree to Terms & Conditions to continue',
  ),
});

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export const supportSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  message: Yup.string()
    .min(10, 'Message should be at least 10 characters long')
    .required('Message is required'),
});

export const phoneSchema = Yup.object().shape({
  number: Yup.string()
    .required('Please enter your phone number')
    .matches(/^[0-9]{6,15}$/, 'Enter a valid phone number'),
});

export const resetPasswordSchema = Yup.object().shape({
  password: passwordRules,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain a lowercase letter')
    .matches(/[A-Z]/, 'Password must contain an uppercase letter')
    .matches(/[0-9]/, 'Password must contain a number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  confirmPassword: Yup.string()
    .required('Confirm new password is required')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

export const SAVE_CHANGES_ERROR =
  'Unable to save your changes. Check your connection and try again.';

function looksTechnical(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return true;
  }
  if (/network error|network request failed/i.test(trimmed)) {
    return true;
  }
  if (/^request failed with status code \d+/i.test(trimmed)) {
    return true;
  }
  if (/^\[\d{3}\]/.test(trimmed)) {
    return true;
  }
  return false;
}

export function isOfflineError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { status?: unknown; data?: unknown; message?: string };
  const text = [
    typeof err.message === 'string' ? err.message : '',
    typeof err.data === 'string' ? err.data : '',
  ].join(' ');
  if (
    /network error|network request failed|failed to fetch|timeout exceeded|internet connection/i.test(
      text,
    )
  ) {
    return true;
  }
  const noStatus =
    err.status == null ||
    err.status === 'FETCH_ERROR' ||
    err.status === 'TIMEOUT_ERROR';
  return noStatus && (typeof err.data !== 'object' || err.data == null);
}

function readApiMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    return looksTechnical(trimmed) ? undefined : trimmed;
  }
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const record = data as Record<string, unknown>;
  const candidates = [record.detail, record.message, record.error];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !looksTechnical(trimmed)) {
        return trimmed;
      }
    }
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const nested = (candidate as { message?: unknown }).message;
      if (typeof nested === 'string' && nested.trim() && !looksTechnical(nested)) {
        return nested.trim();
      }
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (!item || typeof item !== 'object') {
          continue;
        }
        const msg =
          (item as { msg?: unknown }).msg ??
          (item as { message?: unknown }).message;
        if (typeof msg === 'string' && msg.trim() && !looksTechnical(msg)) {
          return msg.trim();
        }
      }
    }
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isOfflineError(error)) {
    return fallback;
  }
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const data = (error as { data?: unknown }).data;
  return readApiMessage(data) ?? fallback;
}
