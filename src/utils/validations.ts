import * as Yup from 'yup';

export const signupSchemaEnglish = Yup.object().shape({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  number: Yup.string()
    .matches(/^[0-9]{10,15}$/, 'Enter a valid phone number')
    .required('Mobile number is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
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
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
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
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters long')
    .required('Please enter a new password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), ''], 'Passwords must match')
    .required('Please confirm your password'),
});
