import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
  COLORS,
  FONT_USAGE,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
} from "../src/constants";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { Card } from "@/src/components/common/Card";

export default function Index() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>SkillSwap</Text>
      <Text style={styles.subtitle}>Component Testing</Text>

      <View style={styles.section}>
        <Card onPress={() => alert("You pressed the card")}>
          <Text>Hello</Text>
        </Card>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  },
  content: {
    padding: SPACING.xl,
  },
  heading: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.huge,
    color: COLORS.midBlue,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlack,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  section: {
    gap: SPACING.md,
  },
});
