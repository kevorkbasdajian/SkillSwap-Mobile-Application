import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
//This interface is needed to define the User data in the AuthContext.
interface User {
  id?: string;
  email?: string;
  full_name?: string;
  nick_name?: string;
  profile_image_url?: string;
  gender?: string;
  date_of_birth?: string;
  biography?: string;
  education_level?: string;
}
//This interface is to define the types of the data stored in the AuthContext
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  //---------------Constants-----------
  /*- user: needed to store information about the user and fetch it in other places
    - token:needed to patch the requests to the backend with this token
    - isLoading: needed at the beginning of booting, where the application is checking from the AsyncStorage information about the user
    to determine navigation nature.
    */
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  //---------------Hooks-----------
  useEffect(() => {
    loadUserData();
  }, []);

  //---------------Functions-----------
  //1-loadUserData: tries to fetch user data and token from AsyncStorage. If found, puts them in the user and token constants. At the end
  // sets the isLoading to false.
  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);

        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  /*2-signIn: Stores in AsyncStorage the authentication Token and the User Data as JSON, also sets the constants user and token with the appropriate data.
    This pushes the navigation to switch from the authNavigator to the TabsNavigator because of (user &&) which becomes true on the tabsNavigator.
 */
  const signIn = async (authToken: string, userData: User) => {
    try {
      await AsyncStorage.setItem("authToken", authToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      console.error("Failed to save auth data:", error);
      throw error;
    }
  };

  /*3-signOut: Removes the user data and token both from AsyncStorage and the constants user and token. This basically pushes the navigation to
  revert back to the Authentication Stack's first component, which is the SplashScreen.
  */
  const signOut = async () => {
    try {
      console.log("Entered Sign Out");
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

//This function is used to access the authContext from anywhere in the app.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
