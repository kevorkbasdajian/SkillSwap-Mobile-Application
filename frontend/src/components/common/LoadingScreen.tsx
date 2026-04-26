import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import LottieView from "lottie-react-native";
import { COLORS } from "../../constants";
import { GradientBackground } from "./GradientBackground";

interface LoadingScreenProps {
  variant?: "blue" | "orange";
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  variant = "blue",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <GradientBackground
      variant={variant === "blue" ? "lightBlueToMid" : "darkOrangeToLight"}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.lottieContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LottieView
            source={require("../../assets/animations/loading.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        {/* Pulsing ring behind lottie */}
        <PulsingRing
          color={variant === "blue" ? COLORS.lightBlue : COLORS.skinToneOrange}
        />
      </View>
    </GradientBackground>
  );
};

// ── Pulsing ring ─────────────────────────────────────────────────────────────
const PulsingRing: React.FC<{ color: string }> = ({ color }) => {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.4)).current;
  const opacity2 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    // First ring — faster
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulse1, {
          toValue: 1.8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Second ring — slower, delayed
    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(pulse2, {
            toValue: 2.2,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity2, {
            toValue: 0,
            duration: 1600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, 400);
  }, []);

  return (
    <View style={styles.ringContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: opacity1,
            transform: [{ scale: pulse1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ring,
          {
            borderColor: color,
            opacity: opacity2,
            transform: [{ scale: pulse2 }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieContainer: {
    zIndex: 2,
  },
  lottie: {
    width: 220,
    height: 220,
  },
  ringContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  ring: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
});
