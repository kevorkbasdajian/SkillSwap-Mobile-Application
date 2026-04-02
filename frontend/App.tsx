// import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { FontLoader } from "./src/components/FontLoader";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./src/navigation/types";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "./src/context/NotificationContext";
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["skillswap://", "https://skillswap.app", "http://skillswap.app"],
  config: {
    screens: {
      Auth: {
        screens: {
          Splash: "splash",
          Login: "login",
          SignUp: "signup",
          ForgotPassword: "forgot-password",
          ResetPassword: "reset-password",
        },
      },
      Main: {
        screens: {
          Home: "home",
          Groups: "groups",
          Sessions: "sessions",
          Profile: "profile",
        },
      },
    },
  },
};
export default function App() {
  return (
    <FontLoader>
      <AuthProvider>
        <NotificationProvider>
          <SafeAreaProvider>
            <NavigationContainer linking={linking}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </NotificationProvider>
      </AuthProvider>
    </FontLoader>
  );
}
