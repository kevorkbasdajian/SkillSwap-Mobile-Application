import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import React, { Children } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface headerProps {
  title: string;
  style?: ViewStyle;
  showBackButton?: boolean;
  handleOnPress?(): void;
  children?: React.ReactNode;
}
export const Header: React.FC<headerProps> = ({
  title,
  style,
  showBackButton = true,
  handleOnPress,
  children,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerSection}>
        {showBackButton && (
          <TouchableOpacity onPress={handleOnPress}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={30}
              color={COLORS.lightOrange}
              style={{ marginBottom: SPACING.md }}
            />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.headerTitle, !showBackButton && { marginLeft: 8 }]}
        >
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
};
const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.darkBlue,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.lightOrange,
    marginBottom: SPACING.md,
  },
});
