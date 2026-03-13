import { BORDER_RADIUS, COLORS, SPACING } from "@/src/constants";
import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "elevated" | "outlined" | "flat";
  padding?: keyof typeof SPACING;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = "elevated",
  padding = "lg",
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    { padding: SPACING[padding] },
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [...cardStyles, pressed && styles.pressed]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};
const styles = StyleSheet.create({
  base: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.white,
  },
  elevated: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.dimBlue,
  },
  flat: {
    backgroundColor: COLORS.lightGray,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
