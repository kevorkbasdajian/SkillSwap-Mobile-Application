import { View, Text, StyleSheet } from "react-native";
import { COLORS, FONT_USAGE, FONT_SIZES, SPACING } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";
export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home Screen</Text>
      <Text style={styles.subtitle}>Welcome, {user?.full_name}!</Text>

      <Button
        title="Sign Out"
        onPress={signOut}
        variant="secondary"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.midBlue,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlack,
    marginBottom: SPACING.xxl,
  },
  button: {
    minWidth: 200,
  },
});
