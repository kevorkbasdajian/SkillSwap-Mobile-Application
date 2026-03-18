import { GradientBackground } from "../../components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Formik } from "formik";
import { signUpSchema } from "../../utils/validationSchemas";
import { Input } from "../../components/common/Input";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../../components/common/Button";
import { authAPI } from "../../services/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useEffect, useState } from "react";

//This interface is for the initialvalues of the form used in Formik
interface SignUpFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}
//This type is for navigation
type SignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "SignUp"
>;

export default function SignUpScreen() {
  //---------------Constants-----------
  //This is used to store the token and user info received from the signup backend service.
  const { signIn } = useAuth();

  // Navigation constant
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  //Initial Values of Formik's form
  const initialValues: SignUpFormValues = {
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  };
  //These constants indicate the error message, and whether if we have an error or not.
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //---------------Functions-----------
  //1-handleSignUp: Calls authAPI's register function by giving the appropriate data. If successfull, calls authContext's signIn method
  // and navigates to the Homepage in the tabsNavigator.
  const handleSignUp = async (
    values: SignUpFormValues,
    { setSubmitting }: any,
  ) => {
    try {
      //Calling backend
      const response = await authAPI.register({
        fullName: values.fullName,
        email: values.email.toLowerCase(),
        password: values.password,
      });

      if (response.success) {
        //Storing the user and token
        await signIn(response.data.token, response.data.user);
        //To remove error not to see previous errors in case of returning to the page later in the session.
        setError(true);
      }
    } catch (error: any) {
      setError(true);
      const errorMessage =
        error.response?.data?.error || "Sign up failed. Please try again.";
      setErrorMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  //2-handleSignInNavigation: This function is called when the user navigates back to the SignIn page.
  const handleSignInNavigation = () => {
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
          {/* Top Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require("../../assets/images/SignUpIllustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>
              <Text style={styles.titleOrange}>Create your </Text>
              <Text style={styles.titleBlue}>Account</Text>
            </Text>

            <Formik
              initialValues={initialValues}
              validationSchema={signUpSchema}
              onSubmit={handleSignUp}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <>
                  {/* Full Name Input */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.fullName && { color: COLORS.darkBlue },
                      ]}
                    >
                      FullName
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.fullName}
                        onChangeText={handleChange("fullName")}
                        onBlur={handleBlur("fullName")}
                        placeholder="John Doe"
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.fullName
                            ? COLORS.error
                            : COLORS.darkBlue,
                        }}
                        isPassword={false}
                        error={
                          touched.fullName && errors.fullName
                            ? errors.fullName
                            : undefined
                        }
                        rightIcon={
                          <MaterialCommunityIcons
                            name="account-outline"
                            size={20}
                            color={
                              touched.fullName && errors.fullName
                                ? COLORS.error
                                : COLORS.darkBlue
                            }
                          />
                        }
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        (errors.email ||
                          !errorMessage.includes("Sign up failed")) && {
                          color: COLORS.darkBlue,
                        },
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
                          color:
                            errors.email ||
                            !errorMessage.includes("Sign up failed")
                              ? COLORS.error
                              : COLORS.darkBlue,
                        }}
                        isPassword={false}
                        error={
                          touched.email && errors.email
                            ? errors.email
                            : error && !errorMessage.includes("Sign up failed")
                              ? errorMessage
                              : undefined
                        }
                        rightIcon={
                          <MaterialCommunityIcons
                            name="email-outline"
                            size={20}
                            color={
                              (touched.email && errors.email) ||
                              !errorMessage.includes("Sign up failed")
                                ? COLORS.error
                                : COLORS.darkBlue
                            }
                          />
                        }
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.password && { color: COLORS.darkBlue },
                      ]}
                    >
                      Password
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        placeholder="********"
                        isPassword={true}
                        error={
                          touched.password && errors.password
                            ? errors.password
                            : undefined
                        }
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.password
                            ? COLORS.error
                            : COLORS.darkBlue,
                        }}
                      />
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.confirmPassword && { color: COLORS.darkBlue },
                      ]}
                    >
                      Confirm Password
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.confirmPassword}
                        onChangeText={handleChange("confirmPassword")}
                        onBlur={handleBlur("confirmPassword")}
                        placeholder="********"
                        isPassword={true}
                        error={
                          touched.confirmPassword && errors.confirmPassword
                            ? errors.confirmPassword
                            : undefined
                        }
                        inputStyle={styles.input}
                        textStyle={{
                          color: errors.confirmPassword
                            ? COLORS.error
                            : COLORS.darkBlue,
                        }}
                      />
                    </View>
                  </View>

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setFieldValue("agreeTerms", !values.agreeTerms)
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        values.agreeTerms && styles.checkboxChecked,
                        touched.agreeTerms &&
                          errors.agreeTerms &&
                          styles.checkboxError,
                      ]}
                    >
                      {values.agreeTerms && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={COLORS.white}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>
                      I understand the terms & Policy
                    </Text>
                  </TouchableOpacity>
                  {touched.agreeTerms && errors.agreeTerms && (
                    <Text
                      style={[styles.errorText, { marginTop: -SPACING.sm }]}
                    >
                      {errors.agreeTerms}
                    </Text>
                  )}

                  {/* Sign Up Button */}
                  <Button
                    title="Sign Up"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    variant={!error ? "primary" : "outline"}
                    size="large"
                    style={!error ? styles.signUpButton : styles.errorButton}
                    textStyle={
                      error ? { color: "rgba(214, 9, 9, 0.84)" } : undefined
                    }
                  />
                  {errorMessage && (
                    <Text
                      style={{
                        textAlign: "center",
                        color: "rgba(214, 9, 9, 0.84)",
                        marginBottom: SPACING.md,
                      }}
                    >
                      {errorMessage}
                    </Text>
                  )}
                </>
              )}
            </Formik>

            {/* Sign In Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Have an account? </Text>
              <TouchableOpacity onPress={handleSignInNavigation}>
                <Text style={styles.signupLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: SPACING.massive,
  },
  illustrationContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  illustration: {
    width: "90%",
    height: "100%",
  },
  card: {
    backgroundColor: COLORS.darkGray,
    borderTopEndRadius: BORDER_RADIUS.xxxl,
    borderTopStartRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    paddingTop: SPACING.xl,
    flex: 1,
    bottom: 0,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  titleBlue: {
    color: "#567B99",
  },
  titleOrange: {
    color: COLORS.lightOrange,
  },
  inputContainer: {},
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.darkBlue,
    borderRadius: 4,
    marginRight: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.lightOrange,
    borderColor: COLORS.lightOrange,
  },
  checkboxText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightOrange,
    flex: 1,
  },
  checkboxError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  errorMessage: {
    fontFamily: FONT_USAGE.body,
    fontSize: 13,
    color: "rgba(214, 9, 9, 0.84)",
    marginTop: -10,
    marginLeft: SPACING.md,
  },
  signUpButton: {
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: 18,
  },
  errorButton: {
    marginBottom: SPACING.xs,
    marginTop: SPACING.xl,
    borderRadius: 18,
    borderColor: COLORS.error,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
  },
  signupLink: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    fontWeight: "600",
  },
});
