import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: "small" | "medium" | "large" | "fullscreen";
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = "medium",
}) => {
  if (!visible) {
    return null;
  }
  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.container, styles[`size_${size}`]]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && <Text style={styles.title}>{title}</Text>}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={25}
                      color={COLORS.midDarkBlue}
                      style={{ marginBottom: 12 }}
                    />
                  </TouchableOpacity>
                )}
                <View style={styles.border} />
              </View>
            )}

            {/* Content */}
            {/* <View style={styles.content}>{children}</View> */}
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
};
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  container: {
    backgroundColor: COLORS.skinToneOrange,
    borderRadius: BORDER_RADIUS.xl,
    borderColor: COLORS.midDarkBlue,
    borderWidth: 3,
    padding: SPACING.xl,
    maxHeight: "90%",
  },
  size_small: {
    width: "70%",
  },
  size_medium: {
    width: "85%",
  },
  size_large: {
    width: "95%",
  },
  size_fullscreen: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.midDarkBlue,
    flex: 1,
    marginBottom: 12,
  },
  border: {
    position: "absolute",
    bottom: 0,
    height: 2,
    width: "60%",
    backgroundColor: COLORS.lightOrange,
    left: "50%",
    transform: [{ translateX: "-50%" }],
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {},
});
