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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
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
