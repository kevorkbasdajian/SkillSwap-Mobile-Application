import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { RootStackParamList } from "@/src/navigation/types";
import { groupsAPI } from "@/src/services/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Badge } from "@/src/components/common/Badge";
import { Modal } from "@/src/components/common/Modal";
import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { Header } from "@/src/components/navigation/NavHeader";

//Types for the navigation
type SKillDetailNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "SkillDetail"
>;
type SkillDetailRouteProp = RouteProp<RootStackParamList, "SkillDetail">;

interface Group {
  id: number;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  visibility: "public" | "private";
  cover_image_url: string | null;
  max_participants: number;
  current_participants: number;
  skill?: { id: string; name: string; icon_url: string };
  status?: string;
  has_joined?: boolean;
  creator_id: string;
}

interface GroupDetails extends Group {
  is_full: boolean;
  pending_requests?: number;
  creator?: {
    id: string;
    full_name: string;
    nick_name?: string;
    profile_image_url?: string;
  };
  user_membership?: {
    is_member: boolean;
    has_joined?: boolean;
    role?: string;
  };
}

//For creating a group
interface CreateForm {
  name: string;
  description: string;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  visibility: "public" | "private";
  max_participants: string;
  coverImage: string | null;
}

//For the difficulty label
const getProficiencyLabel = (level: number) =>
  ["", "Beginner", "Beginner", "Intermediate", "Difficult", "Difficult"][
    level
  ] ?? "";

//To change from string to number
const getProficiencyDifficulty = (
  level: number,
): "beginner" | "intermediate" | "advanced" => {
  if (level <= 2) return "beginner";
  if (level === 3) return "intermediate";
  return "advanced";
};
//For difficulty color
const getDifficultyColor = (d: string) => {
  if (d === "beginner") return COLORS.success;
  if (d === "intermediate") return COLORS.lightOrange;
  return COLORS.error;
};

const getDifficultyVariant = (d: string): "success" | "warning" | "error" =>
  d === "beginner" ? "success" : d === "intermediate" ? "warning" : "error";

export default function SkillDetailScreen() {
  //---------------Constants-----------
  const navigation = useNavigation<SKillDetailNavProp>();
  const route = useRoute<SkillDetailRouteProp>();
  const {
    role,
    skillName,
    skillIconUrl,
    proficiencyLevel,
    skillId,
    userSkillId,
  } = route.params;
  const toast = useErrorToast();

  //--Shared-------------
  const [isLoading, setIsLoading] = useState(true);

  //--learner------------
  const [myGroupsForSkill, setMyGroupsForSkill] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupDetails, setSelectedGroupDetails] =
    useState<GroupDetails | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  //--teacher-----------
  const [teacherGroups, setTeacherGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "",
    description: "",
    difficulty_level: "beginner",
    visibility: "public",
    max_participants: "10",
    coverImage: null,
  });

  //---------------Effects-----------
  useEffect(() => {
    if (role === "learner") loadLearnerData();
    else loadTeacherData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredGroups(availableGroups);
    } else {
      const q = searchQuery.toLocaleLowerCase();
      setFilteredGroups(
        availableGroups.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q),
        ),
      );
    }
  }, [searchQuery, availableGroups]);

  //---------------Functions-----------
  const loadLearnerData = async () => {
    setIsLoading(true);
    try {
      const [myRes, availRes] = await Promise.all([
        groupsAPI.getUserGroupsByRole("learner"),
        groupsAPI.getAvailableGroupsForLearner(userSkillId),
      ]);
      if (myRes.success) {
        const forSkill = myRes.data.filter(
          (g: any) =>
            String(g.skill?.id) === String(skillId) && g.has_joined === true,
        );
        setMyGroupsForSkill(forSkill);
      }
      if (availRes.success) {
        console.log("Hello", availRes.data);
        setAvailableGroups(availRes.data);
        setFilteredGroups(availRes.data);
      }
    } catch {
      toast.showError("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeacherData = async () => {
    setIsLoading(true);
    try {
      const response = await groupsAPI.getTeacherGroups(skillId);
      if (response.success) setTeacherGroups(response.data);
    } catch {
      toast.showError("Failed to load your groups");
    } finally {
      setIsLoading(false);
    }
  };

  //When a learner clicks on a group
  const handleGroupPress = async (group: Group) => {
    setIsLoadingDetails(true);
    setShowJoinModal(true);
    try {
      const res = await groupsAPI.getGroupDetails(String(group.id));
      if (res.success) setSelectedGroupDetails(res.data);
    } catch {
      toast.showError("Failed to load group details");
      setShowJoinModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!selectedGroupDetails) return;
    setIsJoining(true);
    try {
      await groupsAPI.joinGroup(selectedGroupDetails.id);
      toast.showSuccess("join request sent! Waiting for approval.");
      setShowJoinModal(false);
      setSelectedGroupDetails(null);
      loadLearnerData();
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to join group");
    } finally {
      setIsJoining(false);
    }
  };

  const pickCoverImage = async () => {
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
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setCreateForm((prev) => ({ ...prev, coverImage: result.assets[0].uri }));
    }
  };

  const handleCreateGroup = async () => {
    if (createForm.name.trim().length < 3) {
      toast.showError("Group name must be at least 3 characters");
      return;
    }
    if (createForm.description.trim().length < 10) {
      toast.showError("Description must be at least 10 characters");
      return;
    }
    const maxP = parseInt(createForm.max_participants);
    if (maxP < 2 || maxP > 50) {
      toast.showError("Max participants must be between 2 and 50");
      return;
    }
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", createForm.name.trim());
      formData.append("description", createForm.description.trim());
      formData.append("skill_id", skillId);
      formData.append(
        "difficulty_level",
        getProficiencyDifficulty(proficiencyLevel),
      );
      formData.append("visibility", createForm.visibility);
      formData.append("max_participants", String(maxP));

      if (createForm.coverImage) {
        const compressed = await ImageManipulator.manipulateAsync(
          createForm.coverImage,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        const filename = compressed.uri.split("/").pop() || "cover.jpg";
        formData.append("cover_image", {
          uri: compressed.uri,
          name: filename,
          type: "image/jpeg",
        } as any);
      }
      const res = await groupsAPI.createGroup(formData);
      if (res.success) {
        toast.showSuccess("Group created successfully!");
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          description: "",
          difficulty_level: "beginner",
          visibility: "public",
          max_participants: "10",
          coverImage: null,
        });
        console.log("TODO: Navigate to group page:", res.data.id);
        loadTeacherData();
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  //Teacher Right Panel
  const renderTeacherRightPanel = () => (
    <View style={styles.rightPanel}>
      <View style={styles.rightPanelTopRow}>
        <Text style={styles.rightPanelTitle}>Skill Mastery</Text>
        <MaterialCommunityIcons
          name="heart"
          size={18}
          color={COLORS.lightOrange}
        />
      </View>
      <View style={styles.proficiencyDots}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[
              styles.proficiencyDots,
              i <= proficiencyLevel
                ? styles.proficiencyDotActive
                : styles.proficiencyDotInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.proficiencyLabel}>
        {getProficiencyLabel(proficiencyLevel)}
      </Text>
      <Text style={styles.teachingTip}>
        {proficiencyLevel >= 4
          ? "Share your expertise with learners"
          : proficiencyLevel >= 3
            ? "Guide others with your knowledge"
            : "Teach what you know, grow as you go"}
      </Text>
    </View>
  );

  //Learner Right Panel
  const renderLearnerRightPanel = () => {
    if (myGroupsForSkill.length === 0) {
      return (
        <View style={styles.rightPanel}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={36}
            color={COLORS.dimBlue}
          />
          <Text style={styles.rightPanelTitle}>No group yet</Text>
          <Text style={styles.rightPanelSubtitle}>
            Search below to join one
          </Text>
        </View>
      );
    }
    const firstGroup = myGroupsForSkill[0];
    const extraCount = myGroupsForSkill.length - 1;
    return (
      <TouchableOpacity
        style={styles.rightPanel}
        onPress={() => {
          console.log("PRESSED");
          navigation.navigate("GroupMain", {
            groupId: firstGroup.id,
            groupName: firstGroup.name,
            skillName: skillName,
            skillIconUrl: skillIconUrl,
            coverImageUrl: firstGroup.cover_image_url,
            maxParticipants: firstGroup.max_participants,
            difficulty: firstGroup.difficulty,
            visibility: firstGroup.visibility,
            currentParticipants: firstGroup.current_participants,
            userRole: "learner",
            creatorId: firstGroup.creator_id,
            description: firstGroup.description,
          });
        }}
        activeOpacity={0.8}
      >
        {firstGroup.cover_image_url ? (
          <Image
            source={{ uri: firstGroup.cover_image_url }}
            style={styles.groupCoverSmall}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.groupCoverSmallPlaceholder}>
            <MaterialCommunityIcons
              name={skillIconUrl as any}
              size={28}
              color={COLORS.midBlue}
            />
          </View>
        )}
        <Text style={styles.groupNameSmall} numberOfLines={1}>
          {firstGroup.name}
        </Text>
        <Text style={styles.groupParticipantsSmall}>
          {firstGroup.current_participants}/{firstGroup.max_participants}
        </Text>
        {extraCount > 0 && (
          <Text style={styles.extraGroups}>+{extraCount} more</Text>
        )}
        <Text style={styles.tapToExplore}>Tap to explore more</Text>
      </TouchableOpacity>
    );
  };

  //Learner Group Card
  const renderGroupCard = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupCard}
      onPress={() => handleGroupPress(group)}
      activeOpacity={0.8}
    >
      <View style={styles.groupCardImageContainer}>
        {group.cover_image_url ? (
          <Image
            source={{ uri: group.cover_image_url }}
            style={styles.groupCardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.groupCardImagePlaceholder}>
            <MaterialCommunityIcons
              name={skillIconUrl as any}
              size={28}
              color={COLORS.midBlue}
            />
          </View>
        )}
      </View>
      <View style={styles.groupCardContent}>
        <View style={styles.groupCardHeader}>
          <Text style={styles.groupCardName} numberOfLines={1}>
            {group.name}
          </Text>
          <Badge
            label={group.visibility}
            variant={group.visibility === "public" ? "info" : "default"}
            size="small"
          />
        </View>
        <Text style={styles.groupCardDescription} numberOfLines={2}>
          {group.description}
        </Text>
        <View style={styles.groupCardFooter}>
          <Badge
            label={group.difficulty}
            variant={getDifficultyVariant(group.difficulty)}
            size="small"
          />
          <View style={styles.participantRow}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={14}
              color={COLORS.midBlack}
            />
            <Text style={styles.participantText}>
              {group.current_participants}/{group.max_participants}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  //Teacher group card
  const renderTeacherGroupCard = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.teacherGroupCard}
      onPress={() =>
        navigation.navigate("GroupMain", {
          groupId: group.id,
          groupName: group.name,
          skillName: skillName,
          skillIconUrl: skillIconUrl,
          coverImageUrl: group.cover_image_url,
          maxParticipants: group.max_participants,
          difficulty: group.difficulty,
          visibility: group.visibility,
          currentParticipants: group.current_participants,
          userRole: "teacher",
          creatorId: group.creator_id,
          description: group.description,
        })
      }
      activeOpacity={0.8}
    >
      {group.cover_image_url?.startsWith("https") ? (
        <Image
          source={{ uri: group.cover_image_url }}
          style={styles.teacherGroupImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.teacherGroupImagePlaceholder}>
          <MaterialCommunityIcons
            name={skillIconUrl as any}
            size={40}
            color={COLORS.skinToneOrange2}
          />
        </View>
      )}
      <View style={styles.teacherGroupContent}>
        <View style={styles.teacherGroupHeader}>
          <Text style={styles.teacherGroupName} numberOfLines={1}>
            {group.name}
          </Text>
          <Badge
            label={group.visibility}
            variant={group.visibility === "public" ? "info" : "default"}
            size="small"
          />
        </View>
        <Text style={styles.teacherGroupParticipants}>
          {group.current_participants}/{group.max_participants} participants
        </Text>
        <Badge
          label={group.difficulty}
          variant={getDifficultyVariant(group.difficulty)}
          size="small"
        />
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={COLORS.midBlack}
        style={{ alignSelf: "center" }}
      />
    </TouchableOpacity>
  );

  //Join a Group Modal
  const renderJoinModal = () => (
    <Modal
      visible={showJoinModal}
      title={selectedGroupDetails?.name ?? "Group Details"}
      showCloseButton={true}
      size="large"
      onClose={() => {
        setShowJoinModal(false);
        setSelectedGroupDetails(null);
      }}
    >
      {isLoadingDetails ? (
        <View style={styles.modalLoading}>
          <ActivityIndicator size="large" color={COLORS.midBlue} />
        </View>
      ) : selectedGroupDetails ? (
        <View style={styles.joinModalContent}>
          {selectedGroupDetails.cover_image_url ? (
            <Image
              source={{ uri: selectedGroupDetails.cover_image_url }}
              style={styles.joinModalCover}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.joinModalCoverPlaceholder}>
              <MaterialCommunityIcons
                name={skillIconUrl as any}
                size={50}
                color={COLORS.midBlue}
              />
            </View>
          )}
          <View style={styles.badgeRow}>
            <Badge
              label={selectedGroupDetails.difficulty}
              variant={getDifficultyVariant(selectedGroupDetails.difficulty)}
            />
            <Badge
              label={selectedGroupDetails.visibility}
              variant={
                selectedGroupDetails.visibility === "public"
                  ? "info"
                  : "default"
              }
            />
            {selectedGroupDetails.is_full && (
              <Badge label="Full" variant="error" />
            )}
          </View>
          <Text style={styles.joinModalDescription}>
            {selectedGroupDetails.description}
          </Text>
          <View style={styles.joinModalStats}>
            <View style={styles.joinModalStat}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={18}
                color={COLORS.midBlue}
              />
              <Text style={styles.joinModalStatText}>
                {selectedGroupDetails.current_participants}/
                {selectedGroupDetails.max_participants} members
              </Text>
            </View>
            {selectedGroupDetails.creator && (
              <View style={styles.joinModalStat}>
                <Image
                  source={
                    selectedGroupDetails.creator.profile_image_url
                      ? { uri: selectedGroupDetails.creator.profile_image_url }
                      : require("../../assets/images/Avatar.png")
                  }
                  style={styles.creatorAvatar}
                />
                <Text style={styles.joinModalStatText}>
                  By{" "}
                  {selectedGroupDetails.creator.nick_name ??
                    selectedGroupDetails.creator.full_name}
                </Text>
              </View>
            )}
          </View>
          {selectedGroupDetails.is_full ? (
            <Text style={styles.fullGroupText}>This group is full</Text>
          ) : selectedGroupDetails.user_membership?.is_member ? (
            <Text style={styles.alreadyMemberText}>
              {selectedGroupDetails.user_membership.has_joined
                ? "You are already a member"
                : "Your request is pending approval"}
            </Text>
          ) : (
            <View style={styles.joinModalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                size="large"
                style={{ flex: 1 }}
                onPress={() => {
                  setShowJoinModal(false);
                  setSelectedGroupDetails(null);
                }}
              />
              <Button
                title="Join"
                variant="primary"
                size="large"
                style={{ flex: 1 }}
                loading={isJoining}
                disabled={isJoining}
                onPress={handleJoinGroup}
              />
            </View>
          )}
        </View>
      ) : null}
    </Modal>
  );

  //Create Group Modal
  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      title="Create a Group"
      showCloseButton={true}
      size="large"
      onClose={() => setShowCreateModal(false)}
    >
      <View style={styles.createModalContent}>
        {/* Cover Image */}
        <TouchableOpacity
          style={styles.coverImagePicker}
          onPress={pickCoverImage}
        >
          {createForm.coverImage ? (
            <>
              <Image
                source={{ uri: createForm.coverImage }}
                style={styles.coverImagePreview}
                resizeMode="cover"
              />
              <View style={styles.coverImageEditBadge}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={14}
                  color={COLORS.white}
                />
              </View>
            </>
          ) : (
            <View style={styles.coverImagePlaceholder}>
              <MaterialCommunityIcons
                name="image-plus"
                size={32}
                color={COLORS.midBlue}
              />
              <Text style={styles.coverImagePlaceholderText}>
                Add Cover Image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <Input
          label="Group Name"
          value={createForm.name}
          onChangeText={(t) => setCreateForm((p) => ({ ...p, name: t }))}
          placeholder="e.g., Music Beginners"
          textStyle={{ color: COLORS.darkBlue }}
          labelStyle={{ color: COLORS.darkBlue }}
        />

        {/* Description */}
        <Input
          label="Description"
          value={createForm.description}
          onChangeText={(t) => setCreateForm((p) => ({ ...p, description: t }))}
          placeholder="What will learners achieve in this group?"
          textStyle={{ color: COLORS.darkBlue }}
          labelStyle={{ color: COLORS.darkBlue }}
          ismultiline
          multiline
          numberOfLines={3}
        />

        {/* Difficulty */}
        {/* <Text style={styles.createLabel}>Difficulty Level</Text>
        <View style={styles.threeSelector}>
          {(["beginner", "intermediate", "advanced"] as const).map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.threeSelectorBtn,
                createForm.difficulty_level === d && {
                  backgroundColor: getDifficultyColor(d),
                  borderColor: getDifficultyColor(d),
                },
              ]}
              onPress={() =>
                setCreateForm((p) => ({ ...p, difficulty_level: d }))
              }
            >
              <Text
                style={[
                  styles.threeSelectorText,
                  createForm.difficulty_level === d && { color: COLORS.white },
                ]}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View> */}

        {/* Visibility */}
        <Text style={styles.createLabel}>Visibility</Text>
        <View style={styles.twoSelector}>
          {(["public", "private"] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[
                styles.twoSelectorBtn,
                createForm.visibility === v && {
                  backgroundColor: COLORS.midBlue,
                  borderColor: COLORS.darkBlue,
                },
              ]}
              onPress={() => setCreateForm((p) => ({ ...p, visibility: v }))}
            >
              <MaterialCommunityIcons
                name={v === "public" ? "earth" : "lock"}
                size={16}
                color={
                  createForm.visibility === v ? COLORS.white : COLORS.midBlue
                }
              />
              <Text
                style={[
                  styles.twoSelectorText,
                  createForm.visibility === v && { color: COLORS.white },
                ]}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Max participants */}
      <Input
        label="Max participants (2-50)"
        value={createForm.max_participants}
        onChangeText={(t) =>
          setCreateForm((p) => ({ ...p, max_participants: t }))
        }
        placeholder="10"
        keyboardType="numeric"
        textStyle={{ color: COLORS.darkBlue }}
        labelStyle={{ color: COLORS.darkBlue }}
      />

      <Button
        title="Create Group"
        variant="primary"
        size="large"
        loading={isCreating}
        disabled={isCreating}
        onPress={handleCreateGroup}
        style={styles.createSubmitBtn}
      />
    </Modal>
  );
  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={skillName}
        showBackButton={true}
        handleOnPress={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top section */}
        <View style={styles.topSection}>
          <View style={styles.skillIconContainer}>
            <MaterialCommunityIcons
              name={skillIconUrl as any}
              size={65}
              color={COLORS.skinToneOrange2}
            />
          </View>
          {role === "teacher"
            ? renderTeacherRightPanel()
            : renderLearnerRightPanel()}
        </View>

        {/* Proficiency bar */}
        <View style={styles.proficiencySection}>
          <View style={styles.proficiencyBarBg}>
            <View
              style={[
                styles.proficiencyBarFill,
                { width: `${(proficiencyLevel / 5) * 100}%` as any },
              ]}
            />
          </View>
          <Text
            style={[
              styles.proficiencyBarLabel,
              {
                color: getDifficultyColor(
                  getProficiencyDifficulty(proficiencyLevel),
                ),
              },
            ]}
          >
            {getProficiencyLabel(proficiencyLevel)}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {role === "learner" ? (
            <>
              <Text style={styles.sectionTitle}>Search for Groups</Text>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search groups..."
                textStyle={{ color: COLORS.darkBlue }}
                inputStyle={styles.searchInput}
                leftIcon={
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color={COLORS.midBlack}
                  />
                }
              />
              {filteredGroups.length > 0 && (
                <Text style={styles.groupCount}>
                  {filteredGroups.length} Groups
                </Text>
              )}
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.lightBlue}
                  style={{ marginTop: SPACING.xl }}
                />
              ) : filteredGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={60}
                    color={COLORS.dimBlue}
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No groups match your search"
                      : "No available groups for this skill"}
                  </Text>
                </View>
              ) : (
                filteredGroups.map(renderGroupCard)
              )}
            </>
          ) : (
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your Groups</Text>
                {teacherGroups.length > 0 && (
                  <Badge
                    label={`${teacherGroups.length}`}
                    variant="info"
                    size="small"
                  />
                )}
              </View>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color={COLORS.lightBlue}
                  style={{ marginTop: SPACING.xl }}
                />
              ) : teacherGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={60}
                    color={COLORS.dimBlue}
                  />
                  <Text style={styles.emptyText}>No groups created yet</Text>
                </View>
              ) : (
                teacherGroups.map(renderTeacherGroupCard)
              )}
              <Button
                title="Create Group"
                variant="secondary"
                size="large"
                fullWidth
                style={styles.createGroupBtn}
                onPress={() => setShowCreateModal(true)}
                icon={
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={22}
                    color={COLORS.white}
                  />
                }
              />
            </>
          )}
        </View>
      </ScrollView>
      {role === "learner" && renderJoinModal()}
      {role === "teacher" && renderCreateModal()}
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
  //main
  container: { flex: 1, backgroundColor: COLORS.darkGray },
  scrollContent: {
    paddingBottom: SPACING.massive,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  skillIconContainer: {
    width: 110,
    height: 110,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.darkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  proficiencySection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  proficiencyBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.dimBlue,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  proficiencyBarFill: {
    height: "100%",
    backgroundColor: COLORS.lightOrange,
    borderRadius: BORDER_RADIUS.sm,
  },
  proficiencyBarLabel: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    minWidth: 80,
    textAlign: "right",
  },
  mainContent: {
    backgroundColor: COLORS.darkBlue,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.lightOrange,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.round,
    borderColor: COLORS.dimBlue,
  },
  groupCount: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    opacity: 0.6,
    textAlign: "right",
    marginBottom: SPACING.sm,
    marginTop: -SPACING.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.massive,
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlue,
    textAlign: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  createGroupBtn: { marginTop: SPACING.xl },

  //Right Panel
  rightPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.dimBlue,
  },
  rightPanelTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  rightPanelTitle: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  proficiencyDots: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  proficiencyDotActive: {
    backgroundColor: COLORS.lightOrange,
  },
  proficiencyDotInactive: {
    backgroundColor: COLORS.dimBlue,
  },
  proficiencyLabel: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
  },
  teachingTip: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    textAlign: "center",
    lineHeight: 15,
  },
  rightPanelSubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    textAlign: "center",
  },
  groupCoverSmall: {
    width: "100%",
    height: 100,
    borderRadius: BORDER_RADIUS.md,
  },
  groupCoverSmallPlaceholder: {
    width: "100%",
    height: 55,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  groupNameSmall: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkBlue,
    textAlign: "center",
  },
  groupParticipantsSmall: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  extraGroups: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightOrange,
  },
  tapToExplore: {
    fontFamily: FONT_USAGE.body,
    fontSize: 10,
    color: COLORS.midBlack,
    opacity: 0.6,
  },

  //Learner Group Card
  groupCard: {
    flexDirection: "row",
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    marginBottom: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  groupCardImageContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  groupCardImage: {
    width: 75,
    height: 75,
    borderRadius: BORDER_RADIUS.round,
  },
  groupCardImagePlaceholder: {
    width: 75,
    height: 75,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  groupCardContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: "space-between",
  },
  groupCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  groupCardName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    flex: 1,
    marginRight: SPACING.xs,
  },
  groupCardDescription: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    marginBottom: SPACING.xs,
  },
  groupCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  participantText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },

  //Teacher group card
  teacherGroupCard: {
    flexDirection: "row",
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    marginBottom: SPACING.md,
    alignItems: "center",
    paddingRight: SPACING.md,
    paddingLeft: SPACING.sm,
  },
  teacherGroupImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  },
  teacherGroupImagePlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 37.5,

    backgroundColor: COLORS.midDarkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  teacherGroupContent: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  teacherGroupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teacherGroupName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    flex: 1,
    marginRight: SPACING.xs,
  },
  teacherGroupParticipants: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  //Join Modal
  modalLoading: {
    paddingVertical: SPACING.massive,
    alignItems: "center",
  },
  joinModalContent: {
    gap: SPACING.md,
  },
  joinModalCover: {
    width: "100%",
    height: 150,
    borderRadius: BORDER_RADIUS.lg,
  },
  joinModalCoverPlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  joinModalDescription: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
    lineHeight: 20,
  },
  joinModalStats: {
    gap: SPACING.sm,
  },
  joinModalStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  joinModalStatText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  fullGroupText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
  alreadyMemberText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.success,
    textAlign: "center",
    marginTop: SPACING.lg,
  },
  joinModalButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  //Create a Group Modal
  createModalContent: {
    gap: SPACING.xs,
  },
  coverImagePicker: {
    width: "100%",
    height: 130,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    marginBottom: SPACING.md,
    position: "relative",
  },
  coverImagePreview: {
    width: "100%",
    height: "100%",
  },
  coverImageEditBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.lightOrange,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImagePlaceholderText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  coverImagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    borderStyle: "dashed",
    gap: SPACING.xs,
  },
  createLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
  },
  threeSelector: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  threeSelectorBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.midBlue,
    alignItems: "center",
  },
  threeSelectorText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
  },
  twoSelector: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  twoSelectorBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.midBlue,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  twoSelectorText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  createSubmitBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
});
