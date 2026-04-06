import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, FONT_USAGE, SPACING } from "../../constants";

export default function GroupSessionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="calendar-clock-outline"
          size={80}
          color={COLORS.lightBlue}
        />
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBlue },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.lightOrange,
  },
  subtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlack3,
  },
});
