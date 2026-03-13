import { Slot } from "expo-router";

import { FontLoader } from "../src/components/FontLoader";

import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <FontLoader>
      <StatusBar style="dark" />
      <Slot />
    </FontLoader>
  );
}
