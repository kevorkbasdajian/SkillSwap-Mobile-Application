import { GradientBackground } from "@/src/components/common/GradientBackground";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { ProfileCompletionParamList } from "@/src/navigation/types";
import { profileInfoSchema } from "@/src/utils/validationSchemas";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Formik } from "formik";
import { useState } from "react";
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
import { Input } from "@/src/components/common/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "@/src/components/common/Button";
import { Modal } from "@/src/components/common/Modal";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Header } from "../../components/navigation/NavHeader";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { ErrorToast } from "@/src/components/common/ErrorToast";

//Type for the navigation prop
type ProfileInfoNavigationProp = NativeStackNavigationProp<
  ProfileCompletionParamList,
  "ProfileInfo"
>;

//Interface to define the type for the values Formik will use
interface ProfileInfoFormValues {
  nick_name: string;
  date_of_birth: Date;
  gender: string;
  biography: string;
  education_level: string;
}

//Const defining the different values for the education level
const educationLevels = [
  "Elementary",
  "High school",
  "Bachelor's degree",
  "Master's degree or higher",
];

export default function ProfileInfoScreen() {
  //---------------Constants-----------

  //For navigation
  const navigation = useNavigation<ProfileInfoNavigationProp>();

  //Const storing the profileImage
  const [profileImage, setProfileImage] = useState<string | null>(null);
  //Const to handle the display of date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  //Const to handle the display of the image options
  const [showImageOptions, SetShowImageOptions] = useState(false);
  //For Error handling (specially Profile Image)
  const toast = useErrorToast();

  //The initial values of the Formik
  const initialValues: ProfileInfoFormValues = {
    nick_name: "",
    date_of_birth: new Date(2000, 0, 1),
    gender: "",
    biography: "",
    education_level: "",
  };

  //---------------Functions-----------

  //Function for the image picking
  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      SetShowImageOptions(false);
      setProfileImage(result.assets[0].uri);
    }
  };

  //Function for taking a photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions");
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      SetShowImageOptions(false);

      setProfileImage(result.assets[0].uri);
    }
  };

  // Function to go to the next page of the profile completion
  const handleNext = (values: ProfileInfoFormValues) => {
    if (!profileImage) {
      toast.showError("Profile Image is needed");
      return;
    }
    navigation.navigate("SkillsTeach", {
      profileData: {
        ...values,
        date_of_birth: values.date_of_birth.toISOString().split("T")[0],
        profile_image_url: profileImage || undefined,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <Header title="Complete Profile" showBackButton={false}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>
        </Header>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Formik
            initialValues={initialValues}
            validationSchema={profileInfoSchema}
            onSubmit={handleNext}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <>
                {/* Profile Image */}
                <View style={styles.imageSection}>
                  <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={() => SetShowImageOptions(true)}
                  >
                    {profileImage ? (
                      <View style={styles.placeholderImageContainer}>
                        <Image
                          source={{ uri: profileImage }}
                          style={styles.profileImage}
                        />
                      </View>
                    ) : (
                      <View style={styles.placeholderImageContainer}>
                        <Image
                          source={require("../../assets/images/Avatar.png")}
                          style={styles.placeholderImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    {}
                    <View
                      style={[
                        styles.cameraButton,
                        profileImage && styles.pencilButton,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={profileImage ? "pencil" : "camera"}
                        size={20}
                        color={COLORS.white}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Nickname */}
                <View style={styles.inputGroup}>
                  <Input
                    value={values.nick_name}
                    label="Nickname"
                    labelStyle={styles.label}
                    onChangeText={handleChange("nick_name")}
                    onBlur={handleBlur("nick_name")}
                    placeholder="The Beast"
                    textStyle={{ color: COLORS.darkBlue }}
                    error={
                      touched.nick_name && errors.nick_name
                        ? errors.nick_name
                        : undefined
                    }
                    rightIcon={
                      <MaterialCommunityIcons
                        name="account-edit"
                        size={20}
                        color={COLORS.darkBlue}
                      />
                    }
                  />
                </View>

                {/* Age/Date of Birth */}
                <View style={{ marginBottom: SPACING.xxl }}>
                  <Text style={styles.label}>Age</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {values.date_of_birth.toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </Text>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={20}
                      color={COLORS.darkBlue}
                    />
                  </TouchableOpacity>
                  {touched.date_of_birth && errors.date_of_birth && (
                    <Text style={styles.errorText}>
                      {errors.date_of_birth as string}
                    </Text>
                  )}
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={values.date_of_birth}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setFieldValue("date_of_birth", selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}

                {/* Gender */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { marginBottom: SPACING.lg }]}>
                    Gender
                  </Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        values.gender === "male" && styles.genderButtonActive,
                      ]}
                      onPress={() => setFieldValue("gender", "male")}
                    >
                      <MaterialCommunityIcons
                        name="human-male"
                        size={40}
                        color={
                          values.gender === "male"
                            ? COLORS.white
                            : COLORS.midBlue
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          values.gender === "male" && styles.genderTextActive,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        styles.genderButtonFemale,
                        values.gender === "female" &&
                          styles.genderButtonFemaleActive,
                      ]}
                      onPress={() => setFieldValue("gender", "female")}
                    >
                      <MaterialCommunityIcons
                        name="human-female"
                        size={40}
                        color={
                          values.gender === "female"
                            ? COLORS.white
                            : COLORS.darkPink
                        }
                      />
                      <Text
                        style={[
                          styles.genderText,
                          styles.genderTextFemale,
                          values.gender === "female" && styles.genderTextActive,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {touched.gender && errors.gender && (
                    <Text style={styles.errorText}>{errors.gender}</Text>
                  )}
                </View>

                {/* Bio */}
                <View style={styles.inputGroup}>
                  <Input
                    label="Bio"
                    labelStyle={styles.label}
                    value={values.biography}
                    onChangeText={handleChange("biography")}
                    onBlur={handleBlur("biography")}
                    textStyle={{ color: COLORS.darkBlue }}
                    placeholder="I'm a professional software developer"
                    maxLength={120}
                    error={
                      touched.biography && errors.biography
                        ? errors.biography
                        : undefined
                    }
                    ismultiline={true}
                    multiline
                    numberOfLines={3}
                  />
                  <Text style={styles.charCount}>
                    {values.biography.length}/120
                  </Text>
                </View>

                {/* Education Level */}
                <View style={{ marginBottom: SPACING.sm }}>
                  <Text style={[styles.label, { marginBottom: 10 }]}>
                    Level of Education
                  </Text>
                  <View style={styles.educationGrid}>
                    {educationLevels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.educationChip,
                          values.education_level === level &&
                            styles.educationChipActive,
                        ]}
                        onPress={() => setFieldValue("education_level", level)}
                      >
                        <Text
                          style={[
                            styles.educationText,
                            values.education_level === level &&
                              styles.educationTextActive,
                          ]}
                        >
                          {level}
                        </Text>
                        {values.education_level === level && (
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={18}
                            color={COLORS.white}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  {touched.education_level && errors.education_level && (
                    <Text style={styles.errorText}>
                      {errors.education_level}
                    </Text>
                  )}
                </View>

                {/* Next Button */}
                <Button
                  title="Next"
                  onPress={handleSubmit}
                  variant="primary"
                  size="large"
                  style={styles.nextButton}
                />
              </>
            )}
          </Formik>
          {showImageOptions && (
            <Modal
              visible={showImageOptions}
              title="Profile Picture Options"
              showCloseButton={true}
              size="large"
              onClose={() => SetShowImageOptions(false)}
            >
              <View style={styles.modalOptionsContainer}>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={takePhoto}
                >
                  <Text style={styles.optionText}>1- Take Photo</Text>
                  <MaterialCommunityIcons
                    name="camera"
                    size={15}
                    color={COLORS.darkBlue}
                    style={{ marginBottom: 10 }}
                  />
                  <View style={styles.optionBorder} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={pickImage}
                >
                  <Text style={styles.optionText}>2- Choose from library</Text>
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={15}
                    color={COLORS.darkBlue}
                    style={{ marginBottom: 10 }}
                  />
                  <View style={styles.optionBorder} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => SetShowImageOptions(false)}
                >
                  <Text style={styles.optionText}>3- Cancel</Text>
                  <MaterialCommunityIcons
                    name="cancel"
                    size={15}
                    color={COLORS.darkBlue}
                    style={{ marginBottom: 10 }}
                  />
                </TouchableOpacity>
              </View>
            </Modal>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <ErrorToast
        visible={toast.visible}
        message={toast.message}
        onDismiss={toast.hideToast}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  progressDot: {
    width: 40,
    height: 6,
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressDotActive: {
    backgroundColor: COLORS.lightOrange,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: {
    borderRadius: BORDER_RADIUS.round,
    width: "100%",
    height: "100%",
    borderColor: COLORS.darkBlue,
    borderWidth: 2,
  },
  placeholderImageContainer: {
    width: 180,
    height: 180,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
  },
  cameraButton: {
    position: "absolute",
    bottom: 17,
    right: 28,
    backgroundColor: COLORS.lightOrange,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  pencilButton: {
    right: 17,
    bottom: 0,
    width: 36,
    height: 36,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.md,
    color: COLORS.lightOrange,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  dateText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
  },
  errorText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  genderContainer: {
    width: "80%",
    marginInline: "auto",
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xxxl,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.lightBlue,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    gap: SPACING.xs,
  },
  genderButtonActive: {
    backgroundColor: COLORS.midBlue,
  },
  genderText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlue,
  },
  genderTextActive: {
    color: COLORS.white,
  },
  genderButtonFemale: {
    backgroundColor: COLORS.lightPink,
    borderColor: COLORS.darkPink,
  },
  genderButtonFemaleActive: {
    backgroundColor: COLORS.darkPink,
  },
  genderTextFemale: {
    color: COLORS.darkPink,
  },
  charCount: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    textAlign: "right",
    marginTop: SPACING.xs,
    position: "absolute",
    bottom: 22,
    right: 15,
  },
  educationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    borderWidth: 0.5,
    padding: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 15,
    borderColor: COLORS.darkBlue,
  },
  educationChip: {
    flexDirection: "row",
    backgroundColor: COLORS.dimBlue,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: "center",
  },
  educationChipActive: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  educationText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  educationTextActive: {
    color: COLORS.white,
  },
  nextButton: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  modalOptionsContainer: {
    justifyContent: "flex-start",
    gap: 10,
    padding: 10,
    paddingInline: 20,
    alignItems: "flex-start",
    backgroundColor: "rgba(247, 247, 247, 0.27)",
    borderRadius: BORDER_RADIUS.lg,
  },
  modalOption: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 10,
  },
  optionText: {
    fontFamily: FONT_USAGE.body,
    color: COLORS.darkBlue,
    fontSize: FONT_SIZES.md,
    marginBottom: 10,
  },
  optionBorder: {
    position: "absolute",
    bottom: 0,
    height: 1,
    width: "100%",
    backgroundColor: COLORS.lightBlack,
    left: "50%",
    transform: [{ translateX: "-50%" }],
  },
});
