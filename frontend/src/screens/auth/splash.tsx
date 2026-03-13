import { Button } from "@/src/components/common/Button";
import { GradientBackground } from "@/src/components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  FONT_WEIGHTS,
  SPACING,
} from "@/src/constants";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import LottieView from "lottie-react-native";

export default function SplashScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    //Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  const handleGetStarted = () => {
    router.push("/login");
  };
  return (
    <GradientBackground variant="whiteToBlue">
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image
            source={require("../../assets/images/Logo.png")}
            style={styles.logo}
          />
          <Text style={styles.tagline}>Learn Together, Grow Together</Text>
        </Animated.View>
        <View style={styles.animationHolder}>
          <LottieView
            source={require("../../assets/animations/SplashAnimation.json")}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="large"
            style={styles.button}
          />
        </View>
      </View>
    </GradientBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingTop: 90,
  },
  logoContainer: {
    justifyContent: "flex-start",
    alignItems: "center",
  },
  logo: {
    width: "90%",
    height: 120,
  },
  tagline: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    fontWeight: 700,
    opacity: 0.9,
    marginBottom: SPACING.sm,
  },
  animationHolder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  animation: {
    width: 300,
    height: 300,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  button: {
    width: "100%",
    backgroundColor: COLORS.skinToneOrange,
    borderRadius: BORDER_RADIUS.xl,
  },
});
