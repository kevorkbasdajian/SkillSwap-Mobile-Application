import { GradientBackground } from "../../components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  FONT_WEIGHTS,
  SPACING,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
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
import { loginSchema } from "../../utils/validationSchemas";
import { Input } from "../../components/common/Input";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../../components/common/Button";
import { authAPI } from "../../services/api";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

//Type constant for the navigation
type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;
// Interface needed to state the type of the initial values used in Formik
interface LoginFormValues {
  email: string;
  password: string;
}
export default function LoginScreen() {
  //---------------Constants-----------

  //Navigation Constant
  const navigation = useNavigation<LoginScreenNavigationProp>();

  //Using the signIn function provided by the AuthContext
  const { signIn } = useAuth();

  //Initial values of the form used in Formik
  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };
  //Store the error message, and check if we have an error message
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);

  //---------------Functions-----------
  //1-handleLogin: This function takes as values the LoginForm values and the indicator setSubmitting from Formik, calls the login function
  //from the authAPI, if successfull, calls the login function from the authContext.
  const handleLogin = async (
    values: LoginFormValues,
    { setSubmitting }: any,
  ) => {
    try {
      const response = await authAPI.login(
        values.email.toLowerCase(),
        values.password,
      );
      if (response.success) {
        await signIn(response.data.token, response.data.user);
      }
      //To remove errors and not see them when coming back to the page later on in the session.
      setError(true);
      //Navigate to profile completion or home based on first-use of the app or not (Can be known by checking if the response from the backend
      //About the user's info includes a nick_name (mandatory to be put)).
      if (!response.data.user.nick_name) {
        navigation.navigate("Splash");
      } else {
        navigation.navigate("Splash");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Login failed. Please try again";
      setError(true);
      setErrorMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };
  //2-handleForgotPassword: This function is called when the "Forgot Password text" is clicked by the user. Navigates to the forgot password
  //page.
  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };
  //3-handleSignUpNaviation: This function is called when the user wants to signup. Navigates to the SignUp page.
  const handleSignUpNavigation = () => {
    navigation.navigate("SignUp");
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
              source={require("../../assets/images/loginIllustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            {/* Title */}
            <Text style={styles.title}>
              <Text style={styles.titleBlue}>Dive</Text>{" "}
              <Text style={styles.titleOrange}>Right In</Text>
            </Text>

            <Formik
              initialValues={initialValues}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
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
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.email &&
                          touched.email && { color: COLORS.darkBlue },
                      ]}
                    >
                      Email
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Input
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={(e) => {
                          handleBlur("email")(e);
                          // handleInputFocus();
                        }}
                        placeholder="JohnDoe@gmail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        inputStyle={styles.input}
                        textStyle={{ color: COLORS.darkBlue }}
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

                  {/* Password Input */}
                  <View style={[styles.inputContainer, { marginBottom: 0 }]}>
                    <Text
                      style={[
                        styles.inputLabel,
                        errors.password &&
                          touched.password && { color: COLORS.darkBlue },
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
                        textStyle={{ color: COLORS.darkBlue }}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPassword}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>

                  {/* Sign In Button */}
                  <Button
                    title="Sign In"
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    variant={!error ? "primary" : "outline"}
                    size="large"
                    style={!error ? styles.signInButton : styles.errorButton}
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
            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUpNavigation}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  illustrationContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
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
    fontSize: FONT_SIZES.huge,
    textAlign: "center",
    marginBottom: SPACING.xxxl,
    fontWeight: FONT_WEIGHTS.extraBold as 800,
  },
  titleBlue: {
    color: COLORS.darkBlue,
  },
  titleOrange: {
    color: COLORS.lightOrange,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightOrange,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.md,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.darkBlue,
  },
  forgotPassword: { alignSelf: "flex-end", marginBottom: SPACING.lg },
  forgotPasswordText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
    marginBottom: SPACING.massive,
  },
  signInButton: {
    marginTop: 50,
    marginBottom: SPACING.md,
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
    color: "#567B99",
    fontWeight: "600",
  },
});
