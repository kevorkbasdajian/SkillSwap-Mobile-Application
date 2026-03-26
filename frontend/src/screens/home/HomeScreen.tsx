import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  COLORS,
  FONT_USAGE,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/Button";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { groupsAPI, skillsAPI } from "@/src/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/navigation/NavHeader";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Input } from "@/src/components/common/Input";
import { Modal } from "@/src/components/common/Modal";
import { ErrorToast } from "@/src/components/common/ErrorToast";

//Type for User role
type UserRole = "teacher" | "learner";

//Interface for User Skill
interface UserSkill {
  id: number;
  role: "teacher" | "learner";
  proficiency_level: number;
  is_favorite: boolean;
  skills: {
    id: number;
    name: string;
    icon_url: string;
  };
  group_count?: number;
  is_actively_learning?: boolean;
}

export default function HomeScreen() {
  //---------------Constants-----------
  const { user } = useAuth();
  const toast = useErrorToast();

  //To store the role of the user
  const [userRole, setUserRole] = useState<UserRole>("learner");
  //To show/hide menu
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  //Store User skills
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  //Store filtered skills
  const [filteredSkills, setFilteredSkills] = useState<UserSkill[]>([]);
  //Store User groups
  const [userGroups, setUserGroups] = useState<Number[]>([]);
  //To store the search query
  const [searchQuery, setSearchQuery] = useState("");
  //For loading
  const [isLoading, setIsLoading] = useState(true);
  //For the + button in the bottom tabs section
  const [showCreateModal, setShowCreateModal] = useState(false);

  //---------------Hooks-----------

  //Load user role from AsyncStorage on mount
  useEffect(() => {
    // AsyncStorage.clear();
    loadUserRole();
  }, []);

  //Load skills when role changes or screen focuses (based on screen coming or going from focues in a navigator stack)
  useFocusEffect(
    //useCallback used for optimization (cache the function and don't rerender it ) or in case of changes rerender.
    useCallback(() => {
      loadUserSkills();
      loadUserGroups();
    }, [userRole]),
  );

  //Filter skills when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSkills(userSkills);
    } else {
      const filtered = userSkills.filter((skill) =>
        skill.skills.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredSkills(filtered);
    }
  }, [searchQuery, userSkills]);

  //---------------Functions-----------
  //1-Load the user role used initially
  const loadUserRole = async () => {
    try {
      const savedRole = await AsyncStorage.getItem("userRole");
      if (savedRole === "teacher" || savedRole === "learner") {
        setUserRole(savedRole);
      }
    } catch (error) {
      console.error("Failed to load user role:", error);
    }
  };

  //2-loadUserSkills: Function to load the user skills
  const loadUserSkills = async () => {
    setIsLoading(true);
    try {
      const response = await skillsAPI.getUserSkillsByRole(userRole);
      if (response.success) {
        setUserSkills(response.data);
        setFilteredSkills(response.data);
      }
    } catch (error: any) {
      toast.showError("Failed to load skills");
    }
  };

  //3-loadUserGroups: Function to load the user groups
  const loadUserGroups = async () => {
    setIsLoading(true);
    try {
      const response = await groupsAPI.getUserGroupsByRole(userRole);
      const userGroupsSkillId = response.data.map((s: any) => s.skill.id);
      console.log("Id array", userGroupsSkillId);
      if (response.success) {
        setUserGroups(userGroupsSkillId);
      }
    } catch (error: any) {
      toast.showError("Failed to load user groups");
    } finally {
      setIsLoading(false);
    }
  };

  //4- handleRoleChange: Handle the changing of roles
  const handleRoleChange = async (role: UserRole) => {
    setUserRole(role);
    setShowRoleMenu(false);
    setSearchQuery("");

    //Save to AsyncStorage
    try {
      await AsyncStorage.setItem("userRole", role);
    } catch (error) {
      console.error("Failed to save user role:", error);
    }
  };

  //5-handleCardPress: When pressing the card
  const handleCardPress = (skill: UserSkill) => {
    //TODO
    console.log("Card pressed:", skill.skills.name, "Role:", userRole);
  };

  //6-handleFavorite: Toggle favorite On/Off
  const handleFavorite = async (Skill: UserSkill) => {
    try {
      setUserSkills((prev) =>
        prev.map((skill) =>
          skill.id === Skill.id
            ? { ...skill, is_favorite: !skill.is_favorite }
            : skill,
        ),
      );
      setFilteredSkills((prev) =>
        prev.map((skill) =>
          skill.id === Skill.id
            ? { ...skill, is_favorite: !skill.is_favorite }
            : skill,
        ),
      );
      await skillsAPI.setSkillFavorite(Skill.id);
    } catch (error: any) {
      toast.showError("Could not set skill as favorite");
      console.log(error);
    }
  };

  //7-renderSkillCard: UI for the individual cards
  const renderSkillCard = (skill: UserSkill) => {
    const progressPercentage = (skill.proficiency_level / 5) * 100;
    let difficulty;
    let status;
    status = userGroups.includes(skill.skills.id);

    if (progressPercentage <= 33) {
      difficulty = "Easy";
    } else if (progressPercentage <= 66) {
      difficulty = "Intermediate";
    } else {
      difficulty = "Difficult";
    }

    return (
      <TouchableOpacity
        key={skill.id}
        style={styles.skillCard}
        onPress={() => handleCardPress(skill)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.skillInfo}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={skill.skills.icon_url as any}
                size={50}
                color={COLORS.skinToneOrange2}
              />
            </View>
            <Text style={styles.skillName}>{skill.skills.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              handleFavorite(skill);
            }}
          >
            <MaterialCommunityIcons
              name={skill.is_favorite ? "heart" : "heart-outline"}
              size={24}
              color={skill.is_favorite ? COLORS.lightOrange : COLORS.midBlack}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <View style={{}}>
            <Text style={styles.progressText}>{difficulty}</Text>
          </View>
        </View>

        {/* Footer Status */}
        <View style={styles.cardFooter}>
          {userRole === "teacher" ? (
            <>
              <Text style={styles.footerText}>
                {status ? "Active Groups" : " Create a Group"}
              </Text>
              <MaterialCommunityIcons
                name={status ? "account-group" : "plus-circle"}
                size={20}
                color={status ? COLORS.darkBlue : COLORS.lightOrange}
              />
            </>
          ) : (
            <>
              <Text style={styles.footerText}>
                {status ? "Actively learning" : "Join a Group"}
              </Text>
              <MaterialCommunityIcons
                name={status ? "school" : "plus-circle"}
                size={20}
                color={status ? COLORS.midBlue : COLORS.lightOrange}
              />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: COLORS.darkGray }}
      >
        {/* Header */}
        <Header title="Homeage" showBackButton={false} style={styles.header}>
          {/* Role Toggle Button */}
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => setShowRoleMenu(true)}
          >
            <Image
              source={
                user?.profile_image_url
                  ? { uri: user.profile_image_url }
                  : require("../../assets/images/Avatar.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.roleText}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </Header>

        <ScrollView
          // contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Welcome Image */}
          <View style={styles.welcomeImageContainer}>
            <Image
              source={require("../../assets/images/homeScreenIllustration.png")}
              style={styles.welcomeImage}
            />
            <View style={styles.welcomeTextOverlay}>
              <Text style={styles.welcomeText}>DIVE</Text>
              <Text style={styles.welcomeText}>RIGHT</Text>
              <Text style={styles.welcomeText}>IN</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* Search Bar */}
            <Input
              value={searchQuery}
              inputStyle={styles.searchInput}
              placeholder="Search"
              placeholderTextColor={COLORS.midBlack}
              textStyle={{ color: COLORS.darkBlue }}
              leftIcon={
                <MaterialCommunityIcons
                  name="magnify"
                  size={24}
                  color={COLORS.midBlack}
                  style={styles.searchIcon}
                />
              }
              onChangeText={setSearchQuery}
            />

            {/* Skills Count */}
            <Text style={styles.skillsCountText}>
              {filteredSkills.length} Skills
            </Text>

            {/* Skills List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.midBlue} />
              </View>
            ) : filteredSkills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="clipboard-text-off-outline"
                  size={80}
                  color={COLORS.midBlue}
                />
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? "No skills found"
                    : `No ${userRole} skills added yet`}
                </Text>
              </View>
            ) : (
              <View>{filteredSkills.map(renderSkillCard)}</View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Role Selection Modal */}
      {showRoleMenu && (
        <Modal
          visible={showRoleMenu}
          title="Select Role"
          showCloseButton={true}
          size="medium"
          onClose={() => setShowRoleMenu(false)}
        >
          <View style={styles.roleMenuContent}>
            <TouchableOpacity
              style={[
                styles.roleMenuItem,
                userRole === "learner" && styles.roleMenuItemActive,
              ]}
              onPress={() => handleRoleChange("learner")}
            >
              <MaterialCommunityIcons
                name="school"
                size={28}
                color={userRole === "learner" ? COLORS.white : COLORS.midBlue}
              />
              <Text
                style={[
                  styles.roleMenuText,
                  userRole === "learner" && styles.roleMenuTextActive,
                ]}
              >
                Learner
              </Text>
              {userRole === "learner" && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={COLORS.white}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleMenuItem,
                userRole === "teacher" && styles.roleMenuItemActive,
              ]}
              onPress={() => handleRoleChange("teacher")}
            >
              <MaterialCommunityIcons
                name="human-male-board"
                size={28}
                color={
                  userRole === "teacher" ? COLORS.white : COLORS.lightOrange
                }
              />
              <Text
                style={[
                  styles.roleMenuText,
                  userRole === "teacher" && styles.roleMenuTextActive,
                ]}
              >
                Teacher
              </Text>
              {userRole === "teacher" && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={COLORS.white}
                />
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      <ErrorToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  roleText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  welcomeImageContainer: {
    height: 160,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    margin: 10,
  },
  welcomeImage: {
    width: 180,
    height: 150,
    borderRadius: BORDER_RADIUS.xxxl,
    flex: 2,
  },
  welcomeTextOverlay: {
    flex: 1,
  },
  welcomeText: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.huge,
    color: COLORS.midBlue,
    fontWeight: "700",
    lineHeight: 32,
    textShadowColor: COLORS.darkBlue,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.darkBlue,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.round,
    marginTop: 10,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
    margin: 10,
    borderRadius: BORDER_RADIUS.xxl,
    paddingInline: 10,
  },

  skillsCountText: {
    marginLeft: "auto",
    right: 10,
    marginTop: -10,
    marginBottom: 10,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlue,
    marginTop: SPACING.md,
    textAlign: "center",
  },
  skillCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  skillInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  skillName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.darkBlue,
    flex: 1,
  },
  progressContainer: {
    flexDirection: "column",
    gap: 5,
    marginBottom: SPACING.md,
    width: "80%",
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.skinToneOrange2,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.skinToneOrange2,
    minWidth: 40,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  roleMenuContent: {
    gap: SPACING.md,
  },
  roleMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
  },
  roleMenuItemActive: {
    backgroundColor: COLORS.midBlue,
  },
  roleMenuText: {
    flex: 1,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
  },
  roleMenuTextActive: {
    color: COLORS.white,
  },
});
