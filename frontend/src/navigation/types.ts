// This file is needed so that we can pass the types of the props when using the useNavigation hook to navigate between pages.

import { NavigatorScreenParams } from "@react-navigation/native";

// Auth Stack Routes
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

// Tab Navigator Routes
export type TabParamList = {
  Home: undefined;
  Groups: undefined;
  Sessions: undefined;
  Profile: undefined;
};

// Root Navigator Routes
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
};

// Type helpers for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
