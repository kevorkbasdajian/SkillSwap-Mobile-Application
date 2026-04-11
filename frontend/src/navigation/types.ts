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

export type ProfileCompletionParamList = {
  ProfileInfo: undefined;
  SkillsTeach: {
    profileData: {
      nick_name: string;
      date_of_birth: string;
      gender: string;
      biography: string;
      education_level: string;
      profile_image_url?: string;
    };
  };
  SkillsLearn: {
    profileData: {
      nick_name: string;
      date_of_birth: string;
      gender: string;
      biography: string;
      education_level: string;
      profile_image_url?: string;
    };
    selectedTeachSkills: object[];
  };
};

// Tab Navigator Routes
export type TabParamList = {
  Home: undefined;
  Groups: undefined;
  Sessions: undefined;
  Profile: undefined;
  Search: undefined;
  AddNewSkill: undefined;
  Settings: undefined;
};

// Root Navigator Routes
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ProfileCompletion: NavigatorScreenParams<ProfileCompletionParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  UserProfile: { userId: string };
  AddNewSkillModal: undefined;
  SkillDetail: {
    userSkillId: string;
    role: "teacher" | "learner";
    skillName: string;
    skillIconUrl: string;
    proficiencyLevel: number;
    skillId: string;
  };
  GroupMain: {
    groupId: number;
    groupName: string;
    skillName: string;
    skillIconUrl: string;
    coverImageUrl: string | null;
    maxParticipants: number;
    difficulty: string;
    visibility: string;
    currentParticipants: number;
    userRole: "teacher" | "learner";
  };
};

export type GroupTabParamList = {
  GroupHome: undefined;
  GroupChat: undefined;
  GroupSessions: undefined;
};

export type GroupStackParamList = {
  GroupTabs: undefined;
  GroupNotificationHistory: undefined;
  SessionDetail: { sessionId: string };
};

// Type helpers for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
