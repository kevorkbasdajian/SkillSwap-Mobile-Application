import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { BORDER_RADIUS, COLORS } from "../../constants";
import { StyleSheet, ViewStyle } from "react-native";
interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: keyof typeof COLORS.gradients;
  style?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = "whiteToBlue",
  style,
}) => {
  return (
    <LinearGradient
      colors={COLORS.gradients[variant] as [string, string]}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
