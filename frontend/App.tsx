// import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { FontLoader } from "./src/components/FontLoader";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./src/navigation/types";
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
        <NavigationContainer linking={linking}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </FontLoader>
  );
}
