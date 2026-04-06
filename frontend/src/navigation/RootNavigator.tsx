/*Main navigator. Root Navigator is a stack that holdes 2 screens. one screen is the AuthNavigator, which does not require a user to be authenticated. The other screen is the TabNavigator
which requires the user to be authenticated.
- If loading, an activityIndicator is shown on the screen.
*/
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { RootStackParamList } from "./types";
import AuthNavigator from "./AuthNavigator";
import TabNavigator from "./TabNavigator";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../constants";
import ProfileCompletionNavigator from "./ProfileCompletionNavigator";
import UserProfileScreen from "../screens/home/UserProfileScreen";
import AddNewSkillModal from "../screens/home/AddNewSkillModal";
import SkillDetailScreen from "../screens/home/SkillDetailScreen";
import GroupNavigator from "./GroupNavigator";
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.midBlue} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
      }}
    >
      {!user ? (
        // Not logged in - show auth flow
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !user.nick_name ? (
        // Logged in but profile incomplete - show profile completion
        <Stack.Screen
          name="ProfileCompletion"
          component={ProfileCompletionNavigator}
        />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddNewSkillModal"
            component={AddNewSkillModal}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
          <Stack.Screen name="GroupMain" component={GroupNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
});
