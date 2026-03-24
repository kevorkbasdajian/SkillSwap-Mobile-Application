import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ErrorToastProps {
  visible: boolean;
  message: string;
  onDismiss?(): void;
  duration?: number;
  type?: "error" | "success" | "warning" | "info";
}

const { width } = Dimensions.get("window");

export const ErrorToast: React.FC<ErrorToastProps> = ({
  visible,
  message,
  onDismiss,
  duration = 3000,
  type = "error",
}) => {
  const slideAnim = useRef(new Animated.Value(200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      //Auto-dismiss after duration
      const timer = setTimeout(() => {
        dismissToast();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      dismissToast();
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
    });
  };

  if (!isVisible) return null;

  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: COLORS.success, icon: "check-circle" };
      case "warning":
        return { bg: COLORS.lightOrange, icon: "alert" };
      case "info":
        return { bg: COLORS.midBlue, icon: "information" };
      case "error":
      default:
        return { bg: COLORS.error, icon: "alert-circle" };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: colors.bg,
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={colors.icon as any}
          size={24}
          color={COLORS.white}
        />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={dismissToast} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    left: SPACING.lg,
    right: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  message: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    lineHeight: 20,
  },
  closeButton: {
    padding: SPACING.xs,
  },
});
