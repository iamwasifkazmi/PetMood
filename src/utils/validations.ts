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

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }
  const data = (error as { data?: Record<string, unknown> }).data;
  if (data) {
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }
  return fallback;
}
