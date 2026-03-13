import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Lato_400Regular,
  Lato_700Bold,
  Lato_900Black,
} from "@expo-google-fonts/lato";
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from "@expo-google-fonts/nunito-sans";
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
  Merriweather_900Black,
} from "@expo-google-fonts/merriweather";
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from "@expo-google-fonts/roboto";
import {
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_700Bold,
} from "@expo-google-fonts/rubik";

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

export function FontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    // Lato
    Lato_400Regular,
    Lato_700Bold,
    Lato_900Black,

    // Nunito Sans
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,

    // Merriweather
    Merriweather_400Regular,
    Merriweather_700Bold,
    Merriweather_900Black,

    // Roboto
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,

    // Rubik
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) {
    return null; // Show splash while loading
  }
  return <>{children}</>;
}
