interface UserQueryRes {
  uid: string;
  email: string;
  name: string;
  otpCreatedAt: string;
  phoneVerified: boolean;
  otp: string;
  number: string;
  createdAt: string;
  photoUrl?: string;
}

interface UpdateProfileArg {
  name?: string;
  number?: string;
  location?: string;
}
interface UpdateProfileRes {
  detail: string;
  updated: {
    name: string;
    number: string;
    location: string;
    updatedAt: string;
    photoUrl?: string;
  };
}
