import { GradientBackground } from "@/src/components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { AuthStackParamList } from "@/src/navigation/types";
import { authAPI } from "@/src/services/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import { resetPasswordSchema } from "@/src/utils/validationSchemas";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { Modal } from "@/src/components/common/Modal";

//Navigation type
type ResetPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ResetPassword"
>;

//interface needed for Formik's form
interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordScreen() {
  //---------------Constants-----------
  //navigation constant
  const navigation = useNavigation<ResetPasswordNavigationProp>();

  //To store the extracted change password token
  const [token, setToken] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  //Formik's form initial values
  const initialValues: ResetPasswordFormValues = {
    password: "",
    confirmPassword: "",
  };

  //---------------Functions-----------
  //1-handleResetPassword: Checks if token exists and then calls the resetPassword from authAPI. redirection to Login is handled in the
  //modal
  const handleResetPassword = async (
    values: ResetPasswordFormValues,
    { setSubmitting }: any,
  ) => {
    if (!token) {
      setErrorMessage("Invalid or missing reset token");
      setSubmitting(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword(token, values.password);

      if (response.success) {
        setErrorMessage("");
        setShowModal(true);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Failed to reset password. The link may have expired.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };
  //2-handleBackToLogin: This function is called when the user presses the back icon.
  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };
  return (
    <GradientBackground variant="lightBlueToMid">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {/* Top Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../assets/images/ChangePasswordIllustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>
              <Text style={styles.titleOrange}>Reset </Text>
              <Text style={styles.titleBlue}>Password</Text>
            </Text>

            <Text style={styles.description}>
              Enter your new password below.
            </Text>

            {errorMessage && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color={COLORS.error}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <Formik
              initialValues={initialValues}
              validationSchema={resetPasswordSchema}
              onSubmit={handleResetPassword}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <>
                  {/* Token Input */}
                  <View>
                    <Text style={styles.inputLabel}>Reset Token</Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={token}
                        onChangeText={setToken}
                        placeholder="Paste your token here"
                        autoCapitalize="none"
                        inputStyle={styles.input}
                        textStyle={{ color: COLORS.darkBlue }}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        placeholder="********"
                        isPassword={true}
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.password
                            ? COLORS.error
                            : COLORS.darkBlue,
                        }}
                        error={
                          touched.password && errors.password
                            ? errors.password
                            : undefined
                        }
                      />
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.confirmPassword}
                        onChangeText={handleChange("confirmPassword")}
                        onBlur={handleBlur("confirmPassword")}
                        placeholder="********"
                        isPassword={true}
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.confirmPassword
                            ? COLORS.error
                            : COLORS.darkBlue,
                        }}
                        error={
                          touched.confirmPassword && errors.confirmPassword
                            ? errors.confirmPassword
                            : undefined
                        }
                      />
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Button
                    title="Change Password"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !token.trim()}
                    variant="primary"
                    size="large"
                    style={styles.submitButton}
                  />
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        title="Password Reset!"
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          navigation.navigate("Login");
        }}
        showCloseButton={true}
        size="medium"
      >
        <Text style={styles.message}>
          Your password has been successfully reset. You can now sign in with
          your new password.
        </Text>
      </Modal>
    </GradientBackground>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.xxl,
  },
  backButton: {
    position: "absolute",
    top: SPACING.massive,
    left: SPACING.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    backgroundColor: COLORS.darkGray,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.massive,
    paddingBottom: SPACING.xl,
  },
  illustration: {
    width: "80%",
    height: "100%",
  },
  card: {
    backgroundColor: COLORS.darkGray,
    borderTopEndRadius: BORDER_RADIUS.xxxl,
    borderTopStartRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    paddingTop: SPACING.xl,
    flex: 1,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  titleBlue: {
    color: COLORS.darkBlue,
  },
  titleOrange: {
    color: COLORS.lightOrange,
  },
  description: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
    textAlign: "center",
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.errorDim,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    flex: 1,
  },
  inputLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightOrange,
    marginLeft: SPACING.md,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.darkBlue,
  },
  submitButton: {
    marginTop: SPACING.xl,
  },
  message: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    fontWeight: 600,
    marginBlock: 20,
    lineHeight: 22,
  },
});
