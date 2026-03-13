import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  COLORS,
  FONT_USAGE,
  FONT_SIZES,
  BORDER_RADIUS,
  SPACING,
} from "../../constants";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];
  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ];
  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.midBlue : COLORS.white}
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },

  //Variants
  primary: {
    backgroundColor: COLORS.midBlue,
  },
  secondary: {
    backgroundColor: COLORS.lightOrange,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.midBlue,
  },
  ghost: {
    backgroundColor: "transparent",
  },

  //Sizes
  size_small: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  size_medium: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  size_large: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
  },

  //States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },

  //Text styles
  text: {
    fontFamily: FONT_USAGE.button,
    textAlign: "center",
  },
  text_primary: {
    color: COLORS.white,
  },
  text_secondary: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.midBlue,
  },
  text_ghost: {
    color: COLORS.midBlue,
  },
  textSize_small: {
    fontSize: FONT_SIZES.sm,
  },
  textSize_medium: {
    fontSize: FONT_SIZES.md,
  },
  textSize_large: {
    fontSize: FONT_SIZES.lg,
  },
});
