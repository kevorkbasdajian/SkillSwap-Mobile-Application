import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "success" | "error" | "info" | "warning" | "default";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "default",
  size = "medium",
  style,
}) => {
  return (
    <View
      style={[styles.container, styles[variant], styles[`size_${size}`], style]}
    >
      <Text
        style={[
          styles.text,
          styles[`text_${variant}`],
          styles[`textSize_${size}`],
        ]}
      >
        {label}
      </Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.md,
    alignSelf: "flex-start",
  },

  success: {
    backgroundColor: COLORS.success,
  },
  error: {
    backgroundColor: COLORS.error,
  },
  info: {
    backgroundColor: COLORS.info,
  },
  warning: {
    backgroundColor: COLORS.lightOrange,
  },
  default: {
    backgroundColor: COLORS.dimBlue,
  },

  size_small: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  size_medium: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  text: {
    fontFamily: FONT_USAGE.label,
  },
  text_default: {
    color: COLORS.darkBlue,
  },
  text_success: {
    color: COLORS.white,
  },
  text_error: {
    color: COLORS.white,
  },
  text_info: {
    color: COLORS.white,
  },
  text_warning: {
    color: COLORS.white,
  },
  textSize_small: {
    fontSize: FONT_SIZES.xs,
  },
  textSize_medium: {
    fontSize: FONT_SIZES.sm,
  },
});
