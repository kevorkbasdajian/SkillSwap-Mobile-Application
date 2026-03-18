import { GradientBackground } from "@/src/components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  FONT_WEIGHTS,
  SPACING,
} from "@/src/constants";
import { AuthStackParamList } from "@/src/navigation/types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Alert,
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
import { forgotPasswordSchema } from "@/src/utils/validationSchemas";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { authAPI } from "@/src/services/api";
import { useState } from "react";
import { Modal } from "@/src/components/common/Modal";

//Navigation type
type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;
//Needed for Formik's form
interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordScreen() {
  //---------------Constants-----------
  //Navigation constant
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  //Formik's form initial values
  const initialValues: ForgotPasswordFormValues = {
    email: "",
  };

  //---------------Functions-----------
  //1-handleForgotPassword: This function calls the authAPI's forgot-password backend.

  const handleForgotPassword = async (
    values: ForgotPasswordFormValues,
    { setSubmitting }: any,
  ) => {
    try {
      const response = await authAPI.forgotPassword(values.email.toLowerCase());
      if (response.success) {
        setErrorMessage("");
        setShowModal(true);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send reset email. Please try again.";
      setErrorMessage(errorMessage);
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };
  //2-handleBackToLogin: This function is called when the user presses the signUp link.
  const handleBackToLogin = () => {
    navigation.goBack();
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
              source={require("../../assets/images/ForgotPasswordIlustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>
              <Text style={styles.titleOrange}>Forgot</Text>{" "}
              <Text style={styles.titleBlue}>Password?</Text>
            </Text>

            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>

            <Formik
              initialValues={initialValues}
              validationSchema={forgotPasswordSchema}
              onSubmit={handleForgotPassword}
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
                  {/* Email Input*/}
                  <View>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.email
                          ? { color: COLORS.darkBlue }
                          : { color: COLORS.lightOrange },
                      ]}
                    >
                      Email
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        placeholder="JohnDoe@gmail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.email ? COLORS.error : COLORS.darkBlue,
                        }}
                        isPassword={false}
                        error={
                          touched.email && errors.email
                            ? errors.email
                            : undefined
                        }
                        rightIcon={
                          <MaterialCommunityIcons
                            name="email-outline"
                            size={20}
                            color={
                              touched.email && errors.email
                                ? COLORS.error
                                : COLORS.darkBlue
                            }
                          />
                        }
                      />
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Button
                    title="Send Reset Link"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    variant="primary"
                    size="large"
                    style={styles.submitButton}
                  />
                </>
              )}
            </Formik>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        title={errorMessage !== "" ? errorMessage : "Email Sent!"}
        visible={showModal}
        onClose={() => {
          if (errorMessage === "") {
            navigation.navigate("Login");
          }
        }}
        showCloseButton={true}
        size="medium"
      >
        <Text style={styles.message}>
          Password reset instructions have been sent to your email.
        </Text>
      </Modal>
    </GradientBackground>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  inputLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
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
    marginBottom: SPACING.md,
    marginTop: 160,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
  },
  loginLink: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    fontWeight: "600",
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
