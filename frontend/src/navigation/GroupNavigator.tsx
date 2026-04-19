import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupTabParamList, GroupStackParamList } from "./types";
import { GroupProvider, useGroupContext } from "../context/GroupContext";
import { QAPanel } from "../components/features/QAPanel";

import GroupHomeScreen from "../screens/groups/GroupHomeScreen";
import GroupChatScreen from "../screens/groups/GroupChatScreen";
import GroupSessionsScreen from "../screens/groups/GroupSessionsScreen";
import GroupNotificationHistoryScreen from "../screens/groups/GroupNotificationHistoryScreen";
import SessionDetailScreen from "../screens/groups/SessionDetailScreen";

const Tab = createBottomTabNavigator<GroupTabParamList>();
const Stack = createNativeStackNavigator<GroupStackParamList>();

// ── Tab navigator (no QA logic here) ────────────────────────────────────────
function GroupTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.lightOrange,
        tabBarInactiveTintColor: COLORS.lightBlack,
        tabBarStyle: {
          backgroundColor: COLORS.darkBlue,
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: FONT_SIZES.xs },
      }}
    >
      <Tab.Screen
        name="GroupHome"
        component={GroupHomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chat-processing"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="GroupSessions"
        component={GroupSessionsScreen}
        options={{
          tabBarLabel: "Sessions",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-clock"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Stack navigator (no QA logic here) ──────────────────────────────────────
function GroupStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupTabs" component={GroupTabs} />
      <Stack.Screen
        name="GroupNotificationHistory"
        component={GroupNotificationHistoryScreen}
      />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  );
}

// ── Inner content: has access to GroupContext ────────────────────────────────
function GroupNavigatorContent() {
  const { userRole, groupId } = useGroupContext();
  const insets = useSafeAreaInsets();
  const [showQA, setShowQA] = useState(false);

  return (
    <View style={styles.container}>
      {/* Stack + tabs */}
      <GroupStack />

      {/* QA floating button — learners only, floats above all screens */}
      {userRole === "learner" && (
        <>
          <TouchableOpacity
            style={[styles.qaBtn, { bottom: 72 + insets.bottom }]}
            onPress={() => setShowQA(true)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="robot-happy-outline"
              size={28}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <QAPanel
            visible={showQA}
            groupId={groupId}
            onClose={() => setShowQA(false)}
          />
        </>
      )}
    </View>
  );
}

// ── Root export: wraps everything with GroupProvider ─────────────────────────
export default function GroupNavigator() {
  return (
    <GroupProvider>
      <GroupNavigatorContent />
    </GroupProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  qaBtn: {
    position: "absolute",
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightOrange,
    justifyContent: "center",
    alignItems: "center",

    zIndex: 9999,
  },
});
