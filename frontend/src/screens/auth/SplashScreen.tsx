import { Button } from "../../components/common/Button";
import { GradientBackground } from "../../components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "../../constants";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/src/navigation/types";

export default function SplashScreen() {
  //---------------Constants-----------

  //Type constant for the navigation
  type SplashScreenNavigationProp = NativeStackNavigationProp<
    AuthStackParamList,
    "Splash"
  >;

  //Navigation Constant
  const navigation = useNavigation<SplashScreenNavigationProp>();

  // Constants for animation
  //1- Logo
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.3)).current;
  //2- LottieAnimation
  const lottieOpacityAnim = useRef(new Animated.Value(0)).current;
  const lottieTranslateY = useRef(new Animated.Value(50)).current;
  //3- Button
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(30)).current;

  //---------------Hooks-----------
  useEffect(() => {
    // Sequence of animation: Logo → Lottie → Button
    Animated.sequence([
      // 1. Logo animation (fade + scale)
      Animated.parallel([
        Animated.timing(logoFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),

      // 2. Delay
      Animated.delay(300),

      // 3. Lottie animation (fade + slide up)
      Animated.parallel([
        Animated.timing(lottieOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(lottieTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),

      // 4. Delay
      Animated.delay(200),

      // 5. Button animation (fade + slide up)
      Animated.parallel([
        Animated.timing(buttonOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  //---------------Functions-----------
  //1- handleGetStarted: Navigate to Login Screen upon clicking the button.
  const handleGetStarted = () => {
    navigation.navigate("Login");
  };

  return (
    <GradientBackground variant="whiteToBlue">
      <View style={styles.container}>
        {/* Logo with fade + scale animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/Logo.png")}
            style={styles.logo}
          />
          <Text style={styles.tagline}>Learn Together, Grow Together</Text>
        </Animated.View>

        {/* Lottie animation with fade + slide up */}
        <Animated.View
          style={[
            styles.animationHolder,
            {
              opacity: lottieOpacityAnim,
              transform: [{ translateY: lottieTranslateY }],
            },
          ]}
        >
          <LottieView
            source={require("../../assets/animations/SplashAnimation.json")}
            autoPlay
            loop
            style={styles.animation}
          />
        </Animated.View>

        {/* Button with fade + slide up */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: buttonOpacityAnim,
              transform: [{ translateY: buttonTranslateY }],
            },
          ]}
        >
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="large"
            style={styles.button}
          />
        </Animated.View>
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
    fontWeight: "700",
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
