import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { GroupStackParamList, GroupTabParamList } from "./types";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT_SIZES } from "../constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GroupChatScreen from "../screens/groups/GroupChatScreen";
import GroupSessionsScreen from "../screens/groups/GroupSessionsScreen";
import { GroupProvider } from "../context/GroupContext";
import GroupNotificationHistoryScreen from "../screens/groups/GroupNotificationHistoryScreen";
import GroupHomeScreen from "../screens/groups/GroupHomeScreen";
import SessionDetailScreen from "../screens/groups/SessionDetailScreen";

const Tab = createBottomTabNavigator<GroupTabParamList>();
const Stack = createNativeStackNavigator<GroupStackParamList>();

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

export default function GroupNavigator() {
  return (
    <GroupProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GroupTabs" component={GroupTabs} />
        <Stack.Screen
          name="GroupNotificationHistory"
          component={GroupNotificationHistoryScreen}
        />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      </Stack.Navigator>
    </GroupProvider>
  );
}
