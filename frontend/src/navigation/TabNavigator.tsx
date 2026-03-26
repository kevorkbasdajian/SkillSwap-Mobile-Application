/* Tab Navigator. This is a Tab Navigator that includes the pages like HomePage, Profile, Search, Groups, etc... */

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TabParamList } from "./types";
import { COLORS, FONT_SIZES } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/home/HomeScreen";
import GroupsScreen from "../screens/groups/GroupsScreen";
import SearchScreen from "../screens/home/SearchScreen";
// import SessionsScreen from "../screens/sessions/SessionsScreen";
// import ProfileScreen from "../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const insets = useSafeAreaInsets(); // get device safe area insets

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.midBlue,
        tabBarInactiveTintColor: COLORS.lightBlack,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      {/*
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
}
