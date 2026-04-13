import {
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
  BORDER_RADIUS,
} from "../../constants";
import { useGroupContext } from "@/src/context/GroupContext";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { GroupStackParamList } from "@/src/navigation/types";
import { groupsAPI } from "@/src/services/api";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { Badge } from "@/src/components/common/Badge";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { Modal } from "@/src/components/common/Modal";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { GradientBackground } from "@/src/components/common/GradientBackground";
import { useAuth } from "@/src/context/AuthContext";

type GroupHomeNavProp = NativeStackNavigationProp<GroupStackParamList>;

interface Member {
  id: number;
  user: {
    id: string;
    full_name: string;
    nick_name?: string;
    profile_image_url?: string;
  };
}

interface FriendWithInterest {
  id: number;
  user: {
    id: string;
    full_name: string;
    nick_name?: string;
    profile_image_url?: string;
  };
  proficiency_level: number;
}

export default function GroupHomeScreen() {
  //---------------Constants-----------
  const navigation = useNavigation<GroupHomeNavProp>();
  const toast = useErrorToast();
  const {
    groupId,
    groupName,
    skillName,
    skillIconUrl,
    coverImageUrl,
    maxParticipants,
    difficulty,
    visibility,
    currentParticipants,
    creatorId,
  } = useGroupContext();
  const { user } = useAuth();

  //participants modal
  const [showParticipants, setShowParticipants] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  //invite section inside the modal
  const [friendsWithInterest, setFriendsWithInterest] = useState<
    FriendWithInterest[]
  >([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithInterest[]>(
    [],
  );
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const isTeacher = user?.id === creatorId;

  //---------------Hooks-----------
  useEffect(() => {
    if (friendSearchQuery.trim() === "") {
      setFilteredFriends(friendsWithInterest);
    } else {
      const q = friendSearchQuery.toLowerCase();
      setFilteredFriends(
        friendsWithInterest.filter((f) => {
          const name = f.user.full_name?.toLowerCase() ?? "";
          const nick = f.user.nick_name?.toLowerCase() ?? "";
          return name.includes(q) || nick.includes(q);
        }),
      );
    }
  }, [friendSearchQuery, friendsWithInterest]);

  //---------------Functions-----------
  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await groupsAPI.getGroupMembers(groupId);
      if (response.success) {
        setMembers(Array.isArray(response.data) ? response.data : []);
      }
    } catch {
      toast.showError("Failed to load participants");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const loadFriendsWithInterest = async () => {
    setIsLoadingFriends(true);
    try {
      const response = await groupsAPI.getFriendsWithInterest(groupId);
      if (response.success) {
        const data = Array.isArray(response.data) ? response.data : [];
        setFriendsWithInterest(data);
        setFilteredFriends(data);
      }
    } catch {
      toast.showError("Failed to load friends");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleOpenParticipants = () => {
    setShowParticipants(true);
    loadMembers();
    loadFriendsWithInterest();
  };

  const handleRemoveMember = async (memberId: number) => {
    setRemovingId(memberId);
    try {
      await groupsAPI.removeGroupMember(groupId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.showSuccess("Member removed");
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const toggleFriendSelection = (userId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleInviteSelected = async () => {
    if (selectedFriendIds.length === 0) {
      toast.showError("Please select at least one friend");
      return;
    }
    setIsInviting(true);
    let successCount = 0;
    let failCount = 0;
    for (const userId of selectedFriendIds) {
      try {
        await groupsAPI.inviteMember(groupId, userId);
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (successCount > 0)
      toast.showSuccess(`${successCount} invitation(s) sent!`);
    if (failCount > 0) toast.showError(`${failCount} invitation(s) failed`);

    setSelectedFriendIds([]);
    loadFriendsWithInterest();
    setIsInviting(false);
  };
  const getDifficultyVariant = (d: string): "success" | "warning" | "error" =>
    d === "beginner" ? "success" : d === "intermediate" ? "warning" : "error";

  //Render group member Item
  const renderMemberItem = ({ item }: { item: Member }) => (
    <View style={styles.memberRow}>
      <Image
        source={
          item.user.profile_image_url
            ? { uri: item.user.profile_image_url }
            : require("../../assets/images/Avatar.png")
        }
        style={styles.memberAvatar}
      />
      <Text style={styles.memberName}>
        {item.user.nick_name ?? item.user.full_name}
      </Text>
      {isTeacher && (
        <TouchableOpacity
          onPress={() => handleRemoveMember(item.id)}
          disabled={removingId === item.id}
        >
          {removingId === item.id ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Text style={styles.removeText}>remove</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFriendItem = ({ item }: { item: FriendWithInterest }) => {
    const isSelected = selectedFriendIds.includes(item.user.id);
    return (
      <TouchableOpacity
        style={[styles.friendRow, isSelected && styles.friendRowSelected]}
        onPress={() => toggleFriendSelection(item.user.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.friendCheckbox,
            isSelected && styles.friendCheckboxSelected,
          ]}
        >
          {isSelected && (
            <MaterialCommunityIcons
              name="check"
              size={14}
              color={COLORS.white}
            />
          )}
        </View>
        <Image
          source={
            item.user.profile_image_url
              ? { uri: item.user.profile_image_url }
              : require("../../assets/images/Avatar.png")
          }
          style={styles.memberAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.memberName}>
            {item.user.nick_name ?? item.user.full_name}
          </Text>
          <Text style={styles.friendSubtitle}>Friend</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={skillName}
        showBackButton
        handleOnPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── top cards grid ── */}
        <View style={styles.topGrid}>
          {/* Participants card */}
          <GradientBackground
            variant="whiteToBlue"
            style={{ borderRadius: BORDER_RADIUS.xl }}
          >
            <TouchableOpacity
              style={[styles.card, styles.cardBlue]}
              onPress={handleOpenParticipants}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Participants</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={25}
                color={COLORS.darkBlue}
              />
            </TouchableOpacity>
          </GradientBackground>

          {/* Right column */}
          <View style={styles.rightColumn}>
            {/* Chat card */}
            <GradientBackground
              variant="lightOrangeToDark"
              style={{ borderRadius: BORDER_RADIUS.xl }}
            >
              <TouchableOpacity
                style={[styles.card, styles.cardOrange]}
                onPress={() => navigation.getParent()?.navigate("GroupChat")}
                activeOpacity={0.8}
              >
                <Text style={styles.cardTitle}>Chat</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={COLORS.darkBlue}
                />
              </TouchableOpacity>
            </GradientBackground>

            {/* Notifications card */}
            <GradientBackground
              variant="darkOrangeToLight"
              style={{ borderRadius: BORDER_RADIUS.xl }}
            >
              <TouchableOpacity
                style={[styles.card, styles.cardOrangeDim]}
                onPress={() => navigation.navigate("GroupNotificationHistory")}
                activeOpacity={0.8}
              >
                <Text style={styles.cardTitle}>Notifications</Text>
                <MaterialCommunityIcons
                  name="bell-ring"
                  size={28}
                  color={COLORS.darkBlue}
                  style={{ alignSelf: "flex-end" }}
                />
              </TouchableOpacity>
            </GradientBackground>
          </View>
        </View>

        {/* ── group info card ── */}
        <GradientBackground
          variant="midBlueToLightOrange"
          style={styles.groupInfoCard}
        >
          <Text style={styles.groupInfoName}>{groupName}</Text>

          {/* Cover image / icon */}
          <View style={styles.groupInfoLeft}>
            <View style={styles.sectionLeft}>
              {coverImageUrl ? (
                <Image
                  source={{ uri: coverImageUrl }}
                  style={styles.groupCoverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.groupCoverPlaceholder}>
                  <MaterialCommunityIcons
                    name={skillIconUrl as any}
                    size={50}
                    color={COLORS.skinToneOrange2}
                  />
                </View>
              )}
              {/* Info */}
              <View style={styles.groupInfoRight}>
                <Text style={styles.groupInfoParticipants}>
                  {currentParticipants}/{maxParticipants} participants
                </Text>
                <View style={styles.groupInfoRow}>
                  <Badge
                    label={visibility}
                    variant={visibility === "public" ? "info" : "default"}
                    size="small"
                  />
                  <Badge
                    label={difficulty}
                    variant={getDifficultyVariant(difficulty)}
                    size="small"
                  />
                </View>
              </View>
            </View>

            {/* Session placeholder */}
            <View style={styles.sessionPlaceholder}>
              <Text style={styles.sessionPlaceholderText}>Start Session 3</Text>
              <MaterialCommunityIcons
                name="arrow-right-circle"
                size={24}
                color={COLORS.darkBlue}
                style={{ alignSelf: "flex-end" }}
              />
            </View>
          </View>

          {/* Edit button */}
          {isTeacher && (
            <TouchableOpacity style={styles.editButton}>
              <MaterialCommunityIcons
                name="pencil"
                size={18}
                color={COLORS.white}
              />
            </TouchableOpacity>
          )}
        </GradientBackground>
      </ScrollView>

      {/* ── Participants Modal ── */}
      <Modal
        visible={showParticipants}
        title="Participants"
        showCloseButton
        size="large"
        onClose={() => {
          setShowParticipants(false);
          setSelectedFriendIds([]);
          setFriendSearchQuery("");
        }}
      >
        {isLoadingMembers ? (
          <ActivityIndicator
            size="large"
            color={COLORS.midBlue}
            style={{ marginVertical: SPACING.xl }}
          />
        ) : (
          <>
            {/* Current members */}
            {members.length === 0 ? (
              <Text style={styles.noMembersText}>No participants yet</Text>
            ) : (
              <FlatList
                data={members}
                renderItem={renderMemberItem}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}

            {isTeacher && (
              <>
                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Users & Friends</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Friend search */}
                <Input
                  value={friendSearchQuery}
                  onChangeText={setFriendSearchQuery}
                  placeholder="Search friends..."
                  textStyle={{ color: COLORS.darkBlue }}
                  leftIcon={
                    <MaterialCommunityIcons
                      name="magnify"
                      size={18}
                      color={COLORS.midBlack}
                    />
                  }
                />

                {/* Friends list */}
                {isLoadingFriends ? (
                  <ActivityIndicator size="small" color={COLORS.midBlue} />
                ) : filteredFriends.length === 0 ? (
                  <Text style={styles.noMembersText}>
                    No friends with interest found
                  </Text>
                ) : (
                  <FlatList
                    data={filteredFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => item.user.id}
                    scrollEnabled={false}
                    style={{ maxHeight: 180 }}
                  />
                )}

                {/* Invite button */}
                {selectedFriendIds.length > 0 && (
                  <Button
                    title={`Add New Participants (${selectedFriendIds.length})`}
                    variant="primary"
                    size="large"
                    fullWidth
                    loading={isInviting}
                    disabled={isInviting}
                    onPress={handleInviteSelected}
                    style={{ marginTop: SPACING.md }}
                    icon={
                      <MaterialCommunityIcons
                        name="account-plus"
                        size={18}
                        color={COLORS.white}
                      />
                    }
                  />
                )}
              </>
            )}
          </>
        )}
      </Modal>

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
  container: { flex: 1, backgroundColor: COLORS.midDarkBlue },
  scrollContent: { padding: SPACING.lg, gap: SPACING.lg },
  // top grid
  topGrid: {
    flexDirection: "row",
    gap: SPACING.md,
    height: 250,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardBlue: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  rightColumn: {
    flex: 1,
    gap: SPACING.md,
  },
  cardOrange: {
    flex: 2,
  },
  cardOrangeDim: {
    flex: 1,
    alignItems: "flex-start",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.darkBlue,
  },

  // group info card
  groupInfoCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "column",
    gap: SPACING.md,
    position: "relative",
  },
  groupInfoLeft: { flexDirection: "row", gap: SPACING.xxxl },
  groupCoverImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: COLORS.darkBlue,
  },
  groupCoverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.darkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  groupInfoRight: {
    flex: 1,
    gap: SPACING.xs,
    alignItems: "center",
    width: "100%",
  },
  groupInfoName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: "#eaeaea",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    marginBottom: SPACING.xxl,
  },
  groupInfoRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    flexWrap: "wrap",
  },
  groupInfoParticipants: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.skinToneOrange,
    backgroundColor: COLORS.darkBlue,
    paddingBlock: 5,
    paddingInline: 3,
    borderRadius: 20,
  },
  sessionPlaceholder: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-around",
    backgroundColor: "#81C3D780",
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: "60%",
  },
  sessionPlaceholderText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.lg,
    color: COLORS.lightGray,
  },
  editButton: {
    position: "absolute",
    bottom: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.lightOrange,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },

  // modal - members
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberName: {
    flex: 1,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
  },
  removeText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.dimBlue,
  },
  noMembersText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
    textAlign: "center",
    paddingVertical: SPACING.md,
  },

  // modal - divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dimBlue,
    borderStyle: "dashed",
  },
  dividerText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },

  // modal - friends
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
  },
  friendRowSelected: {
    backgroundColor: COLORS.dimBlue,
  },
  friendCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  friendCheckboxSelected: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  friendSubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  sectionLeft: {
    gap: SPACING.sm,
    alignItems: "center",
  },
});
