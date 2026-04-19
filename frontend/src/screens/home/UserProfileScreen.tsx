import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useAuth } from "@/src/context/AuthContext";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { RootStackParamList } from "@/src/navigation/types";
import { friendAPI, userAPI } from "@/src/services/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/navigation/NavHeader";
import { Button } from "@/src/components/common/Button";
import { Modal } from "@/src/components/common/Modal";
import { ErrorToast } from "@/src/components/common/ErrorToast";

type UserProfileRouteProp = RouteProp<RootStackParamList, "UserProfile">;
type UserProfileNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserProfile"
>;

//interface for UserSkill
interface UserSkill {
  id: number;
  role: "teacher" | "learner";
  proficiency_level: number;
  skills: {
    id: number;
    name: string;
    icon_url: string;
  };
}

//interface for Friend
interface Friend {
  id: string;
  full_name: string;
  nick_name?: string;
  profile_image_url?: string;
}

//Interface for the UserProfile
interface UserProfile {
  id: string;
  full_name: string;
  nick_name?: string;
  profile_image_url?: string;
  biography?: string;
  status: {
    teaching: number;
    learning: number;
    friends: number;
  };
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "friends";
  friendshipId: string;
  skills: {
    teaching: UserSkill[];
    learning: UserSkill[];
    hidden: boolean;
  };
  friends: Friend[];
}

export default function UserProfileScreen() {
  //---------------Constants-----------
  //Navigation constants (one for navigation, and the other for using the passed User Id)
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();

  //Current User info
  const { user: currentUser } = useAuth();

  //For Error Handling
  const toast = useErrorToast();

  //Retrieve Target User's id
  const targetUserId = route.params?.userId;

  //Target User's profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  //Store the active skills tab
  const [activeTab, setActiveTab] = useState<"learned" | "taught">("learned");

  //Show/Hide friends modal of the target User
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  //For loading state
  const [isLoading, setIsLoading] = useState(true);
  //For the button of friendship
  const [isActionLoading, setIsActionLoading] = useState(false);

  //---------------Hooks-----------
  //Load the target User's profile on load
  useEffect(() => {
    if (targetUserId) {
      loadProfile();
    }
  }, [targetUserId]);

  //---------------Functions-----------
  //1-loadProfile: Load a Public User's profile on mount
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getPublicProfile(targetUserId);
      console.log(response.data);
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error: any) {
      toast.showError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  //2-handleFriendAction: For the button indicating friendship status with the user
  const handleFriendAction = async () => {
    if (!profile) return;
    setIsActionLoading(true);
    try {
      switch (profile.friendshipStatus) {
        case "none":
          await friendAPI.sendFriendRequest(targetUserId);
          toast.showSuccess("Friend request sent!");
          break;
        case "pending_received":
          await friendAPI.acceptFriendRequest(profile.friendshipId);
          toast.showSuccess("Friend request accepted!");
          break;
        case "friends":
          break;
      }
      //Reload profile to update button state
      await loadProfile();
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  //3-getFriendButtonConfig: For the friend button text
  const getFriendButtonConfig = () => {
    const style = {
      marginBlock: SPACING.xl,
      paddingInline: SPACING.xl,
      marginBottom: SPACING.lg,
    };
    if (!profile)
      return {
        text: "loading...",
        variant: "primary" as const,
        disabled: true,
      };
    switch (profile.friendshipStatus) {
      case "none":
        return {
          text: "Send Friend Request",
          variant: "primary" as const,
          disabled: false,
          style: { ...style },
        };
      case "pending_sent":
        return {
          text: "Request Sent",
          variant: "outline" as const,
          disabled: true,
          style: { ...style, borderColor: COLORS.skinToneOrange },
          textStyle: {
            color: COLORS.skinToneOrange,
          },
        };
      case "pending_received":
        return {
          text: "Accept Request",
          variant: "secondary" as const,
          disabled: false,
          style: { ...style },
        };
      case "friends":
        return {
          text: "Friend",
          variant: "outline" as const,
          disabled: true,
          style: {
            borderColor: COLORS.skinToneOrange,
            ...style,
          },
          textStyle: {
            color: COLORS.skinToneOrange,
          },
        };
      default:
        return {
          text: "Send Friend Request",
          variant: "primary" as const,
          disabled: false,
          style: { ...style },
        };
    }
  };

  //4-getDifficultyLabel: To translate the number into difficulty
  const getDifficultyLabel = (proficiencyLevel: number): string => {
    const percentage = (proficiencyLevel / 5) * 100;
    if (percentage <= 33) return "Easy";
    if (percentage <= 66) return "Intermediate";
    return "Difficult";
  };

  //5-getDifficultyColor: To translate the number of proficiency into color
  const getDifficultyColor = (proficiencyLevel: number): string => {
    const percentage = (proficiencyLevel / 5) * 100;
    if (percentage <= 33) return COLORS.success;
    if (percentage <= 66) return COLORS.lightOrange;
    return COLORS.error;
  };

  const renderSkillCard = (skill: UserSkill, index: number) => {
    const progressPercentage = (skill.proficiency_level / 5) * 100;
    const difficultyLabel = getDifficultyLabel(skill.proficiency_level);
    const difficultyColor = getDifficultyColor(skill.proficiency_level);

    return (
      <View key={skill.id} style={[styles.skillCard]}>
        <View style={styles.skillHeader}>
          <Text style={styles.skillIndex}>{index + 1}.</Text>
          <View style={styles.skillIconContainer}>
            <MaterialCommunityIcons
              name={skill.skills.icon_url as any}
              size={40}
              color={COLORS.lightBlue}
            />
          </View>
          <View style={styles.skillContentHolder}>
            <Text style={styles.skillName}>{skill.skills.name}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: COLORS.skinToneOrange,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {difficultyLabel}
              </Text>
            </View>
          </View>
        </View>
        {index != displayedSkills.length - 1 && (
          <View
            style={{
              borderColor: COLORS.midBlack,
              borderWidth: 1,
              borderBottomWidth: 0.5,
              marginHorizontal: -(SPACING.md + SPACING.xl),
            }}
          />
        )}
      </View>
    );
  };

  const renderFriendItem = (friend: Friend, index: number) => {
    if (!profile) return null;
    const isFriend = true;

    return (
      <TouchableOpacity
        key={`friend-${friend.id}-${index}`}
        style={styles.friendItem}
        onPress={() => {
          setShowFriendsModal(false);
          navigation.push("UserProfile", { userId: friend.id });
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={
              friend.profile_image_url
                ? { uri: friend.profile_image_url }
                : require("../../assets/images/Avatar.png")
            }
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.full_name}</Text>
            <Text style={styles.friendBio}>{friend.nick_name}</Text>
          </View>
        </View>
        {index != profile.friends.length - 1 && (
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.midBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return null;
  }
  const displayName = profile.nick_name || profile.full_name;
  const buttonConfig = getFriendButtonConfig();
  const displayedSkills =
    activeTab === "learned" ? profile.skills.learning : profile.skills.teaching;

  //Get preiew friends (first 3)
  const previewFriends = profile.friends?.slice(0, 3);
  const remainingFriendsCOunt = Math.max(0, profile.friends?.length - 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header
        title={displayName}
        handleOnPress={() => navigation.goBack()}
        showBackButton={true}
        style={{
          paddingTop: SPACING.xxl,
          paddingBottom: SPACING.sm,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={
                profile.profile_image_url
                  ? { uri: profile.profile_image_url }
                  : require("../../assets/images/Avatar.png")
              }
              style={styles.profileImage}
            />
            {/* Badge */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{profile.nick_name}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.status.teaching}</Text>
                <Text style={styles.statLabel}>teaching</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.status.learning}</Text>
                <Text style={styles.statLabel}>learning</Text>
              </View>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setShowFriendsModal(true)}
                disabled={profile.status.friends === 0}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profile.status.friends}
                  </Text>
                  <Text style={styles.statLabel}>friends</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: SPACING.xl, width: "70%" }}>
          {profile.biography && (
            <View style={styles.bioContainer}>
              {profile.biography.split("\n").map((line, i) => (
                <Text key={i} style={styles.bioText}>
                  o {line}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Friends Preview */}
        {previewFriends?.length > 0 && (
          <View style={styles.friendsPreview}>
            <View style={styles.friendsAvatars}>
              {previewFriends.map((friend, index) => (
                <Image
                  key={`preview-${friend.id}-${index}`}
                  source={
                    friend.profile_image_url
                      ? { uri: friend.profile_image_url }
                      : require("../../assets/images/Avatar.png")
                  }
                  style={[
                    styles.friendPreviewAvatar,
                    { marginLeft: index > 0 ? -12 : 0 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.friendsPreviewText}>
              Friends with{" "}
              {previewFriends
                .map((f) => f.nick_name || f.full_name.split(" ")[0])
                .join(", ")}
              {remainingFriendsCOunt > 0 && ` & ${remainingFriendsCOunt} more`}
            </Text>
          </View>
        )}

        {/* Friend Request Button */}
        <View style={{ paddingHorizontal: SPACING.xl }}>
          <Button
            title={buttonConfig.text}
            onPress={handleFriendAction}
            variant={buttonConfig.variant}
            size="large"
            disabled={buttonConfig.disabled || isActionLoading}
            loading={isActionLoading}
            style={buttonConfig.style}
            textStyle={buttonConfig.textStyle}
            icon={
              profile.friendshipStatus === "none" ? (
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={COLORS.white}
                />
              ) : undefined
            }
          />
        </View>

        <View style={styles.skillSection}>
          {/* Skills Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,

                activeTab === "learned" && {
                  backgroundColor: COLORS.lightBlue,
                },
              ]}
              onPress={() => setActiveTab("learned")}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: COLORS.darkBlue },
                  activeTab === "learned" && styles.tabTextActive,
                ]}
              >
                Skills Learned
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,

                activeTab === "taught" && {
                  backgroundColor: COLORS.skinToneOrange,
                },
              ]}
              onPress={() => setActiveTab("taught")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "taught" && styles.tabTextActive,
                ]}
              >
                Skills Taught
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skills List */}
          <View style={styles.skillsList}>
            {displayedSkills.length > 0 ? (
              displayedSkills.map((skill, index) =>
                renderSkillCard(skill, index),
              )
            ) : profile.skills.hidden ? (
              <View style={styles.emptySkills}>
                <MaterialCommunityIcons
                  name="eye-off-outline"
                  size={60}
                  color={COLORS.error}
                />
                <Text style={styles.emptyText}>
                  This user has hidden their skills
                </Text>
              </View>
            ) : (
              <View style={styles.emptySkills}>
                <MaterialCommunityIcons
                  name="school-outline"
                  size={60}
                  color={COLORS.error}
                />
                <Text style={styles.emptyText}>
                  No {activeTab === "learned" ? "learning" : "teaching"} skills
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Friends Modal */}
      {showFriendsModal && (
        <Modal
          visible={showFriendsModal}
          title="Friends"
          showCloseButton={true}
          size="large"
          onClose={() => setShowFriendsModal(false)}
        >
          <ScrollView
            style={styles.friendsModalScroll}
            contentContainerStyle={styles.friendsModalContent}
            showsVerticalScrollIndicator={false}
          >
            {profile.friends.map(renderFriendItem)}
          </ScrollView>
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
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.xxl,
  },
  imageContainer: {
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: "#EAEAEA",
    paddingBottom: SPACING.sm,
  },
  statsContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",

    flex: 1,
    paddingTop: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  statNumber: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.skinToneOrange,
  },
  statLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    opacity: 0.8,
    color: COLORS.skinToneOrange,
  },

  badgeContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  badgeText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.lg,
    color: COLORS.lightBlack3,
  },
  bioContainer: {
    flex: 1,
    width: "100%",
    marginBottom: SPACING.lg,
  },
  bioText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.skinToneOrange,
    marginBottom: SPACING.xs,
  },
  friendsPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginTop: SPACING.lg,
    marginLeft: SPACING.massive,
  },
  friendsAvatars: {
    flexDirection: "row",
    marginBottom: SPACING.xs,
  },
  friendPreviewAvatar: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.round,
  },
  friendsPreviewText: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.skinToneOrange,
    marginRight: SPACING.xl,
    paddingTop: SPACING.md,
  },
  friendButton: {
    marginBlock: SPACING.xl,
    paddingInline: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  skillSection: {
    backgroundColor: COLORS.darkGray,
    borderRadius: BORDER_RADIUS.lg,
    marginInline: SPACING.xl,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.lg,
  },
  tabText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightOrange,
  },
  tabTextActive: {
    color: COLORS.darkBlue,
  },
  skillsList: {
    paddingHorizontal: SPACING.xl,
  },
  skillCard: {
    paddingInline: SPACING.md,
    marginBottom: SPACING.sm,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  skillIndex: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginRight: SPACING.sm,
  },
  skillIconContainer: {
    width: 65,
    height: 65,
    backgroundColor: COLORS.skinToneOrange,
    borderRadius: BORDER_RADIUS.round,
    borderColor: COLORS.lightBlue,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  skillContentHolder: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: SPACING.md,
    paddingBlock: SPACING.md,
    flex: 1,
  },
  skillName: {
    flex: 1,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlue,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    minWidth: 70,
    textAlign: "right",
  },
  emptySkills: {
    alignItems: "center",
    paddingVertical: SPACING.massive,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    marginTop: SPACING.md,
  },
  friendsModalScroll: {
    maxHeight: 400,
  },
  friendsModalContent: {
    // gap: SPACING.sm,
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
