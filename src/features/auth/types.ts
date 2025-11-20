export type SendOtpArg = {
  phoneNumber: string;
};

export type SendOtpRes = {
  code: number;
  status: boolean;
  message: string;
  data: { user_id: number };
};

export type ResendOtpArg = {
  phoneNumber: string;
};

export type RegisterUserArg = {
  name: string;
  email: string;
  number: string;
  password: string;
  confirmPassword: string;
};

export type ResendOtpRes = {
  message: string;
};

export type RegisterUserRes = {
  uid: string;
};

export type VerifyOtpArg = {
  phoneNumber: string;
  code: string;
};

export type loginArg = {
  email: string;
  password: string;
  returnSecureToken: boolean;
};

export type loginRes = {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered?: boolean;
  refreshToken: string;
  expiresIn: string;
};

export type VerifyOtpRes = {
  code: number;
  status: boolean;
  message: string;
  data: {
    id: number;
    first_name: string;
    last_name: string;
    email: any;
    profile: string;
    phone: string;
    email_verified_at: any;
    created_at: string;
    updated_at: string;
    ein: any;
    business_name: any;
    business_number: any;
    business_website: any;
    business_description: any;
    is_business: number;
    business_logo: any;
    dob: Date;
    is_online: number;
    company: string;
    position: string;
  };
};

export interface ChangePasswordArg {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordArg {
  phoneNumber: string;
}

export interface ResetPasswordArg {
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}
