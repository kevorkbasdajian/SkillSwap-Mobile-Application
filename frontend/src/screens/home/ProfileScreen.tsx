import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { RootStackParamList, TabParamList } from "@/src/navigation/types";
import { friendAPI, userAPI } from "@/src/services/api";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal } from "@/src/components/common/Modal";
import * as ImagePicker from "expo-image-picker";
import { Input } from "@/src/components/common/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "@/src/components/common/Button";

// Type for navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Interface for the profile
interface Profile {
  id: number;
  full_name: string;
  email: string;
  nick_name: string;
  biography?: string;
  profile_image_url?: string;
  education_level: string;
  date_of_birth: Date;
  teachingCount?: number;
  learningCount?: number;
  friendsCount?: number;
  created_at: Date;
  gender?: string;
}

interface friend {
  friendship_id: string;
  friend: Object;
  since: Date;
}

const BIOGRAPHY_PLACEHOLDER = "This is a sample biography \n please change it";

const EDUCATION_OPTIONS = [
  "Elementary",
  "High school",
  "Bachelor's degree",
  "Master's degree or higher",
];

const GENDER_OPTIONS = ["male", "female"];

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [profile, setProfile] = useState<Profile>();
  const [originalProfile, setOriginalProfile] = useState<Profile>();

  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openEducationDropdown, setOpenEducationDropdown] = useState(false);
  const [openGenderDropdown, setOpenGenderDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friends, setFriends] = useState<friend[]>([]);
  const [deletingfriend, setDeletingFriend] = useState(false);

  const toast = useErrorToast();

  const hasChanges = useMemo(() => {
    if (!profile || !originalProfile) return false;
    return (
      profile.biography !== originalProfile.biography ||
      profile.profile_image_url !== originalProfile.profile_image_url ||
      profile.education_level !== originalProfile.education_level ||
      profile.gender !== originalProfile.gender ||
      String(profile.date_of_birth) !== String(originalProfile.date_of_birth)
    );
  }, [profile, originalProfile]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.fetchOwnProfile();
      if (response.success) {
        const normalised: Profile = {
          ...response.data,
          biography:
            response.data.biography === "" || !response.data.biography
              ? BIOGRAPHY_PLACEHOLDER
              : response.data.biography,
        };
        setProfile(normalised);
        setOriginalProfile(normalised);

        const response2 = await friendAPI.getAllFriends();
        if (response2.success) {
          console.log("Friends returned data is", response2.data);
          setFriends(response2.data);
        }
      }
    } catch {
      toast.showError("Error while loading the profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      if (selectedImage) {
        const filename = selectedImage.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("profile_image", {
          uri: selectedImage,
          name: filename,
          type,
        } as any);
      }
      if (profile?.biography) formData.append("biography", profile.biography);
      if (profile?.date_of_birth)
        formData.append(
          "date_of_birth",
          new Date(profile.date_of_birth).toISOString(),
        );

      if (profile?.gender) formData.append("gender", profile.gender);

      if (profile?.education_level)
        formData.append("education_level", profile.education_level);

      const response = await userAPI.updateUserProfile(formData);
      console.log("Response is", response);
      if (response.success) {
        const normalised = {
          ...response.data,
          biography:
            response.data.biography === "" || !response.data.biography
              ? BIOGRAPHY_PLACEHOLDER
              : response.data.biography,
        };
        setProfile(normalised);
        setOriginalProfile(normalised);
        setIsEditing(false);

        setSelectedImage(null);
      }
    } catch {
      toast.showError("Error while updating profile");
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    setDeletingFriend(true);
    try {
      const response = await friendAPI.removeFriend(friendshipId);
      if (response.success) {
        setFriends(
          friends.filter(
            (friend: friend) => friend.friendship_id !== friendshipId,
          ),
        );
      }
    } catch (error: any) {
      toast.showError("Error while removing friend");
    } finally {
      setDeletingFriend(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setShowImageOptions(false);
      setSelectedImage(result.assets[0].uri);
      setProfile((prev) =>
        prev ? { ...prev, profile_image_url: result.assets[0].uri } : prev,
      );
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant photo library permissions",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setShowImageOptions(false);
      setSelectedImage(result.assets[0].uri);
      setProfile((prev) =>
        prev ? { ...prev, profile_image_url: result.assets[0].uri } : prev,
      );
    }
  };

  const renderFriendItem = (friend: any, index: number) => {
    if (!profile) return null;
    const isFriend = true;

    return (
      <TouchableOpacity
        key={`friend-${friend.id}-${index}`}
        style={styles.friendItem}
        onPress={() => {
          navigation.push("UserProfile", { userId: friend.friend.id });
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={
              friend.friend.profile_image_url
                ? { uri: friend.friend.profile_image_url }
                : require("../../assets/images/Avatar.png")
            }
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.friend.full_name}</Text>
            <Text style={styles.friendBio}>{friend.friend.nick_name}</Text>
          </View>
          <TouchableOpacity
            style={{
              marginRight: "auto",
            }}
            onPress={() => removeFriend(friend.friendship_id)}
            disabled={deletingfriend}
          >
            <Text
              style={{
                color: COLORS.error,
                fontSize: FONT_SIZES.xs,
                fontFamily: FONT_USAGE.button,
                fontWeight: "700",
              }}
            >
              Remove Friend
            </Text>
          </TouchableOpacity>
        </View>
        {index != friends.length - 1 && (
          <View
            style={{
              marginTop: 10,
              borderColor: COLORS.midBlack,
              borderWidth: 1,
              borderBottomWidth: 0.5,
              width: "75%",
              marginInline: "auto",
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.midBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Settings Icon */}
          <TouchableOpacity
            style={styles.settingIconContainer}
            onPress={() => navigation.navigate("Settings")}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={30}
              color={COLORS.white}
            />
          </TouchableOpacity>

          {/* Profile Image */}
          <View
            style={{
              alignSelf: "center",
              position: "relative",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Image
              source={
                profile?.profile_image_url
                  ? { uri: profile.profile_image_url }
                  : require("../../assets/images/Avatar.png")
              }
              style={styles.image}
            />
            <TouchableOpacity
              style={styles.editContainer}
              onPress={() => setShowImageOptions(true)}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={24}
                color={COLORS.lightOrange}
              />
            </TouchableOpacity>
          </View>

          {/* Profile Description */}
          <View style={styles.profileDescription}>
            <Text style={styles.full_name}>{profile?.full_name}</Text>
            <Text style={styles.nick_name}>{profile?.nick_name}</Text>
            <View style={styles.countContainer}>
              <View style={styles.countSection}>
                <Text style={styles.countLabel}>Teaching</Text>
                <Text style={styles.count}>{profile?.teachingCount}</Text>
              </View>
              <View style={styles.seperatingLine} />
              <View style={styles.countSection}>
                <Text style={styles.countLabel}>Learning</Text>
                <Text style={styles.count}>{profile?.learningCount}</Text>
              </View>
              <View style={styles.seperatingLine} />
              <TouchableOpacity
                style={styles.countSection}
                onPress={() => setShowFriendsModal(true)}
              >
                <Text style={styles.countLabel}>Friends</Text>
                <Text style={styles.count}>{profile?.friendsCount}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rest of Profile Details */}
          <View style={styles.restProfileContainer}>
            <View style={styles.biography}>
              <Text style={styles.label}>Bio </Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={[
                  styles.editButtonContainer,
                  {
                    backgroundColor: isEditing
                      ? COLORS.darkBlue
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={{
                    color: !isEditing ? COLORS.lightOrange : COLORS.success,
                    fontWeight: "700",
                    fontSize: FONT_SIZES.md,
                  }}
                >
                  {isEditing ? "Done" : "Edit"}
                </Text>
                <MaterialCommunityIcons
                  name={isEditing ? "check-circle-outline" : "invoice-edit"}
                  size={18}
                  color={!isEditing ? COLORS.lightOrange : COLORS.success}
                />
              </TouchableOpacity>
            </View>

            {!isEditing ? (
              <>
                <View
                  style={[
                    styles.biographyContainer,
                    { backgroundColor: COLORS.skinToneOrange },
                  ]}
                >
                  {profile?.biography?.split("\n").map((line, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.biographyText,
                        { color: COLORS.midBlue, fontWeight: "700" },
                      ]}
                    >
                      o {line}
                    </Text>
                  ))}
                </View>
                <View
                  style={{ flexDirection: "column", justifyContent: "center" }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      gap: 5,
                    }}
                  >
                    <View style={styles.dateOfBirth}>
                      <Text style={styles.bioLabel}>Date of Birth</Text>
                      <Text
                        style={{
                          color: COLORS.midBlue,
                          fontFamily: FONT_USAGE.body,
                          fontSize: FONT_SIZES.sm,
                          fontWeight: "700",
                        }}
                      >
                        {profile?.date_of_birth
                          ? new Date(profile.date_of_birth).toLocaleDateString(
                              "en-Us",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : ""}
                      </Text>
                    </View>
                    <View style={styles.dateOfBirth}>
                      <Text style={styles.bioLabel}>Gender</Text>
                      <Text
                        style={{
                          color: COLORS.midBlue,
                          fontFamily: FONT_USAGE.body,
                          fontSize: FONT_SIZES.sm,
                          fontWeight: "700",
                        }}
                      >
                        {profile?.gender}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.dateOfBirth}>
                    <Text style={styles.bioLabel}>Education Level</Text>
                    <Text
                      style={{
                        color: COLORS.midBlue,
                        fontFamily: FONT_USAGE.body,
                        fontSize: FONT_SIZES.sm,
                        fontWeight: "700",
                      }}
                    >
                      {profile?.education_level}
                    </Text>
                  </View>
                  <View style={styles.dateOfBirth}>
                    <Text style={styles.bioLabel}>Active Since</Text>
                    <Text
                      style={{
                        color: COLORS.midBlue,
                        fontFamily: FONT_USAGE.body,
                        fontSize: FONT_SIZES.sm,
                        fontWeight: "700",
                      }}
                    >
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            "en-Us",
                            { year: "numeric", month: "short" },
                          )
                        : ""}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.editbio}>* Edit Enabled </Text>
                <Input
                  value={profile?.biography}
                  multiline={true}
                  inputStyle={styles.biographyInput}
                  textStyle={styles.biographyText}
                  onChangeText={(text) =>
                    setProfile((prev) =>
                      prev ? { ...prev, biography: text } : prev,
                    )
                  }
                />
                <View
                  style={{
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <View
                    style={[styles.dateOfBirthEdit, { alignSelf: "center" }]}
                  >
                    <Text
                      style={{
                        color: COLORS.lightOrange,
                        fontFamily: FONT_USAGE.elegantHeading,
                        fontSize: FONT_SIZES.sm,
                      }}
                    >
                      Date of Birth
                    </Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <MaterialCommunityIcons
                        name="calendar-week-outline"
                        size={24}
                        color={COLORS.midBlue}
                      />
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      gap: 10,
                      height: 100,
                    }}
                  >
                    <View style={[styles.dateOfBirthEdit, { flex: 1.4 }]}>
                      <Text
                        style={{
                          color: COLORS.lightOrange,
                          fontFamily: FONT_USAGE.elegantHeading,
                          fontSize: FONT_SIZES.xs,
                        }}
                      >
                        Education Level
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setOpenEducationDropdown(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {profile?.education_level || "Select Education Level"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dateOfBirthEdit}>
                      <Text
                        style={{
                          color: COLORS.lightOrange,
                          fontFamily: FONT_USAGE.elegantHeading,
                          fontSize: FONT_SIZES.sm,
                        }}
                      >
                        Gender
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setOpenGenderDropdown(true)}
                      >
                        <Text style={styles.dropdownText}>
                          {profile?.gender || "Select Gender"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={
                      profile?.date_of_birth
                        ? new Date(profile.date_of_birth)
                        : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setProfile((prev) =>
                          prev
                            ? { ...prev, date_of_birth: selectedDate }
                            : prev,
                        );
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}

            {/* Update button — disabled until something changes */}
            <Button
              title="Update Profile"
              size="large"
              onPress={updateProfile}
              disabled={!hasChanges}
              style={{
                marginTop: 10,
                backgroundColor: hasChanges
                  ? COLORS.darkBlue
                  : COLORS.lightBlack3,
                opacity: hasChanges ? 1 : 0.5,
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal — Profile Image Options */}
      {showImageOptions && (
        <Modal
          visible={showImageOptions}
          title="Profile Picture Options"
          showCloseButton={true}
          size="large"
          onClose={() => setShowImageOptions(false)}
        >
          <View style={styles.modalOptionsContainer}>
            <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
              <Text style={styles.optionText}>1- Take Photo</Text>
              <MaterialCommunityIcons
                name="camera"
                size={15}
                color={COLORS.darkBlue}
                style={{ marginBottom: 10 }}
              />
              <View style={styles.optionBorder} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
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
              onPress={() => setShowImageOptions(false)}
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

      {/* Modal — Education / Gender Dropdowns */}
      <Modal
        visible={openEducationDropdown || openGenderDropdown}
        onClose={() => {
          openGenderDropdown
            ? setOpenGenderDropdown(false)
            : setOpenEducationDropdown(false);
        }}
        title={
          openEducationDropdown ? "Select Education Level" : "Select Gender"
        }
      >
        <View style={styles.dropdownContainer}>
          {(openEducationDropdown ? EDUCATION_OPTIONS : GENDER_OPTIONS).map(
            (option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setProfile((prev) =>
                    prev
                      ? openEducationDropdown
                        ? { ...prev, education_level: option }
                        : { ...prev, gender: option }
                      : prev,
                  );
                  openEducationDropdown
                    ? setOpenEducationDropdown(false)
                    : setOpenGenderDropdown(false);
                }}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </Modal>

      {/* Friends Modal */}
      {showFriendsModal && (
        <Modal
          visible={showFriendsModal}
          title="Friends"
          showCloseButton={true}
          size="large"
          onClose={() => {
            setShowFriendsModal(false);
            if (profile?.friendsCount != friends.length) {
              loadProfile();
            }
          }}
        >
          <ScrollView
            style={styles.friendsModalScroll}
            showsVerticalScrollIndicator={false}
          >
            {friends.map(renderFriendItem)}
          </ScrollView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  settingIconContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingInline: SPACING.xxl,
    paddingTop: SPACING.xxl,
  },
  image: {
    height: 200,
    width: 200,
    borderRadius: BORDER_RADIUS.round,
    borderColor: COLORS.midBlue,
    borderWidth: 1,
    marginInline: "auto",
  },
  editContainer: {
    position: "absolute",
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.round,
    bottom: 0,
    right: 10,
    padding: 10,
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
  full_name: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.huge,
    color: COLORS.lightGray,
  },
  nick_name: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlack3,
  },
  profileDescription: {
    marginTop: 10,
    flexDirection: "column",
    alignItems: "center",
  },
  countContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.lg,
  },
  countSection: {
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    padding: 8,
  },
  countLabel: {
    color: COLORS.white,
    fontFamily: FONT_USAGE.elegantHeading,
    fontSize: FONT_SIZES.sm,
  },
  count: {
    color: COLORS.darkBlue,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
  },
  seperatingLine: {
    height: "100%",
    borderColor: COLORS.white,
    borderLeftWidth: 1,
    opacity: 0.5,
  },
  restProfileContainer: {
    marginBlock: SPACING.huge,
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xl,
    marginInline: "auto",
    width: "85%",
    paddingBlock: SPACING.md,
    paddingInline: SPACING.huge,
  },
  label: {
    fontFamily: FONT_USAGE.elegantHeading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.darkBlue,
  },
  biography: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  biographyContainer: {
    paddingInline: SPACING.lg,
    paddingBlock: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
  },
  biographyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
  },
  biographyInput: {
    borderColor: COLORS.lightOrange,
    padding: 0,
  },
  editbio: {
    textAlign: "left",
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightOrange,
    fontFamily: FONT_USAGE.label,
    marginLeft: 10,
  },
  dateOfBirth: {
    marginTop: 10,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.skinToneOrange,
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  dateOfBirthEdit: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightOrange,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    color: COLORS.darkBlue,
  },
  editButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingInline: 10,
    paddingBlock: 5,
    borderRadius: BORDER_RADIUS.xxxl,
  },
  bioLabel: {
    color: COLORS.darkBlue,
    fontFamily: FONT_USAGE.elegantHeading,
    fontSize: 15,
  },
  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  dropdownText: {
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  friendsModalScroll: {
    maxHeight: 400,
  },
  friendItem: {
    padding: SPACING.sm,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  friendBio: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
});
