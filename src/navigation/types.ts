import { NativeStackScreenProps } from '@react-navigation/native-stack';

export enum RouteName {
  Splash = 'Splash',
  Onboarding = 'Onboarding',
  CreateAccount = 'CreateAccount',
  Login = 'Login',
  CodeVerification = 'CodeVerification',
  ResetPassword = 'ResetPassword',
  CreateNewPassword = 'CreateNewPassword',
  Home = 'Home',
  Profile = 'Profile',
  Scanner = 'Scanner',
  History = 'History',
  Community = 'Community',
  BottomTabStack = 'BottomTabStack',
  DrawerTabStack = 'DrawerTabStack',
  Support = 'Support',
  Subscription = 'Subscription',
}

export type StackParamList = {
  Home: undefined;
  Splash: undefined;
  Onboarding: undefined;
  CreateAccount: undefined;
  CodeVerification: {
    phoneNumber?: string;
    email?: string;
    isFromResetPassword?: boolean;
  };
  Login: undefined;
  ResetPassword: undefined;
  CreateNewPassword: { phoneNumber: string };
  Profile: { openAddForm?: boolean } | undefined;
  Scanner: undefined;
  History: undefined;
  Community: undefined;
  BottomTabStack: undefined;
  Support: undefined;
  DrawerTabStack: undefined;
  Subscription: undefined;
};

type ScreenProps<T extends keyof StackParamList> = NativeStackScreenProps<
  StackParamList,
  T
>;

export type HomeProps = ScreenProps<RouteName.Home>;
export type SplashProps = ScreenProps<RouteName.Splash>;
export type OnboardingProps = ScreenProps<RouteName.Onboarding>;
export type CreateAccountProps = ScreenProps<RouteName.CreateAccount>;
export type LoginProps = ScreenProps<RouteName.Login>;
export type CodeVerificationProps = ScreenProps<RouteName.CodeVerification>;
export type ResetPasswordProps = ScreenProps<RouteName.ResetPassword>;
export type CreateNewPasswordProps = ScreenProps<RouteName.CreateNewPassword>;
export type ProfileProps = ScreenProps<RouteName.Profile>;
export type ScannerProps = ScreenProps<RouteName.Scanner>;
export type HistoryProps = ScreenProps<RouteName.History>;
export type CommunityProps = ScreenProps<RouteName.Community>;
export type BottomTabStackProps = ScreenProps<RouteName.BottomTabStack>;
export type DrawerStackProps = ScreenProps<RouteName.DrawerTabStack>;

export type SupportProps = ScreenProps<RouteName.Support>;
export type SubscriptionProps = ScreenProps<RouteName.Subscription>;