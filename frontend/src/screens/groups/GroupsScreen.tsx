import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  COLORS,
  FONT_USAGE,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
} from "../../constants";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/src/navigation/types";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { groupsAPI, sessionsAPI } from "@/src/services/api";
import LottieView from "lottie-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/src/components/navigation/NavHeader";
import { StatusBar } from "expo-status-bar";
import { LoadingScreen } from "@/src/components/common/LoadingScreen";

type GroupsNavProp = NativeStackNavigationProp<RootStackParamList>;

type UserRole = "teacher" | "learner";
type FilterType = "all" | "active" | "pending";

interface GroupItem {
  membership_id: number;
  id: number;
  name: string;
  description: string;
  difficulty: string;
  visibility: string;
  cover_image_url: string | null;
  max_participants: number;
  current_participants: number;
  creator_id: string;
  has_joined: boolean;
  status: string;
  skill: { id: string; name: string; icon_url: string };
  upcomingSession?: {
    id: string;
    title: string;
    scheduled_date: string;
    status: string;
  } | null;
}

const getDifficultyColor = (d: string) => {
  if (d === "beginner") return COLORS.midBlue;
  if (d === "intermediate") return COLORS.lightOrange;
  return COLORS.error;
};

const getDifficultyVariant = (d: string) =>
  d === "beginner"
    ? COLORS.success
    : d === "intermediate"
      ? COLORS.lightOrange
      : COLORS.error;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export default function GroupsScreen() {
  //---------------Constants-----------

  const navigation = useNavigation<GroupsNavProp>();
  const toast = useErrorToast();

  const [userRole, setUserRole] = useState<UserRole>("learner");
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);

  //---------------Hooks-----------
  useFocusEffect(
    useCallback(() => {
      loadRole();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoading || groups.length > 0) {
        loadGroups();
      }
    }, [userRole]),
  );

  useEffect(() => {
    applyFilter(filter);
  }, [filter, groups]);

  //---------------Functons-----------
  const loadRole = async () => {
    try {
      const saved = await AsyncStorage.getItem("userRole");
      if (saved === "teacher" || saved === "learner") {
        setUserRole(saved);
      }
      await loadGroups((saved as UserRole) || "learner");
    } catch {
      await loadGroups("learner");
    }
  };

  const loadGroups = async (role?: UserRole) => {
    const activeRole = role || userRole;
    setIsLoading(true);
    try {
      const response = await groupsAPI.getUserGroupsByRole(activeRole);
      if (response.success) {
        const rawGroups: GroupItem[] = response.data;

        // Batch fetch upcoming sessions for all groups
        const withSessions = await Promise.all(
          rawGroups.map(async (group) => {
            try {
              const sessionRes = await sessionsAPI.getUpcomingSession(group.id);
              const sessionData = sessionRes?.data;
              const upcoming =
                Array.isArray(sessionData) && sessionData.length > 0
                  ? sessionData[0]
                  : null;
              return { ...group, upcomingSession: upcoming };
            } catch {
              return { ...group, upcomingSession: null };
            }
          }),
        );
        setGroups(withSessions);
        setFilteredGroups(withSessions);
      }
    } catch {
      toast.showError("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (f: FilterType) => {
    if (f === "all") {
      setFilteredGroups(groups);
    } else if (f === "active") {
      setFilteredGroups(groups.filter((g) => g.has_joined === true));
    } else {
      setFilteredGroups(groups.filter((g) => g.has_joined === false));
    }
  };

  const handleGroupPress = (group: GroupItem) => {
    navigation.navigate("GroupMain", {
      groupId: group.id,
      groupName: group.name,
      skillName: group.skill.name,
      skillIconUrl: group.skill.icon_url,
      coverImageUrl: group.cover_image_url,
      maxParticipants: group.max_participants,
      difficulty: group.difficulty,
      visibility: group.visibility,
      currentParticipants: group.current_participants,
      userRole: userRole,
      creatorId: group.creator_id,
      description: group.description,
    });
  };

  const renderBanner = () => {
    const count = groups.length;
    const isPending = groups.filter((g) => !g.has_joined).length;

    return (
      <View style={styles.bannerCard}>
        <View style={styles.bannerTextSection}>
          <Text style={styles.bannerCount}>
            {count}{" "}
            {userRole === "teacher"
              ? count === 1
                ? "Group Created"
                : "Groups Created"
              : count === 1
                ? "Group Joined"
                : "Groups Joined"}
          </Text>
          {userRole === "learner" && isPending > 0 && (
            <View style={styles.pendingPill}>
              <Text style={styles.pendingPillText}>{isPending} pending</Text>
            </View>
          )}
          <Text style={styles.bannerSubtitle}>
            {userRole === "teacher"
              ? "Manage your groups and sessions"
              : "Continue your learning journey"}
          </Text>
        </View>

        {/* Lottie illustration */}
        <View style={styles.bannerLottie}>
          {userRole == "teacher" ? (
            <LottieView
              source={require("../../assets/animations/teach.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          ) : (
            <LottieView
              source={require("../../assets/animations/learn.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          )}
        </View>
      </View>
    );
  };

  const renderFilterChips = () => {
    if (userRole === "teacher") return null;
    const chips: { key: FilterType; label: string }[] = [
      { key: "all", label: "All" },
      { key: "active", label: "Active" },
      { key: "pending", label: "Pending" },
    ];
    return (
      <View style={styles.filterRow}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[
              styles.filterChip,
              filter === chip.key && styles.filterChipActive,
            ]}
            onPress={() => setFilter(chip.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === chip.key && styles.filterChipTextActive,
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGroupCard = ({ item }: { item: GroupItem }) => {
    const isPending = !item.has_joined;
    const participantPct = item.current_participants / item.max_participants;

    return (
      <TouchableOpacity
        style={[styles.card, isPending && styles.cardPending]}
        onPress={() => !isPending && handleGroupPress(item)}
        activeOpacity={isPending ? 1 : 0.8}
      >
        {/* Pending overlay badge */}
        {isPending && (
          <View style={styles.pendingBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color={COLORS.white}
            />
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>
        )}

        {/* Card header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardGroupName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.visibilityBadge,
              item.visibility === "public"
                ? styles.visibilityPublic
                : styles.visibilityPrivate,
            ]}
          >
            <Text style={styles.visibilityText}>{item.visibility}</Text>
          </View>
        </View>

        <Text style={styles.cardSkillName}>{item.skill.name}</Text>

        {/* Card body */}
        <View style={styles.cardBody}>
          {/* Left: cover image or skill icon */}
          <View style={styles.cardImageContainer}>
            {item.cover_image_url ? (
              <Image
                source={{ uri: item.cover_image_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <MaterialCommunityIcons
                  name={item.skill.icon_url as any}
                  size={36}
                  color={COLORS.skinToneOrange2}
                />
              </View>
            )}
          </View>

          {/* Right: session + progress */}
          <View style={styles.cardRight}>
            {/* Upcoming session */}
            {item.upcomingSession ? (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => handleGroupPress(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.sessionTitle} numberOfLines={1}>
                  {item.upcomingSession.title}
                </Text>
                <Text style={styles.sessionDate}>
                  {formatDate(item.upcomingSession.scheduled_date)}
                </Text>
                <View style={styles.sessionClickRow}>
                  <Text style={styles.sessionClick}>Click to View More</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={12}
                    color={COLORS.lightOrange}
                  />
                </View>

                {/* Session progress dots */}
                <View style={styles.sessionDots}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === 0 && styles.dotActive]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noSessionCard}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={22}
                  color={COLORS.midBlack}
                />
                <Text style={styles.noSessionText}>No upcoming session</Text>
              </View>
            )}
          </View>
        </View>

        {/* Card footer */}
        <View style={styles.cardFooter}>
          <View style={styles.participantSection}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={14}
              color={COLORS.midBlack}
            />
            <Text style={styles.participantText}>
              {item.current_participants}/{item.max_participants} participants
            </Text>
          </View>

          {/* Participant progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(participantPct * 100, 100)}%` as any },
              ]}
            />
          </View>

          <Text
            style={[
              styles.difficultyLabel,
              { color: getDifficultyColor(item.difficulty) },
            ]}
          >
            {item.difficulty}
          </Text>
        </View>

        {/* Pending dim overlay */}
        {isPending && <View style={styles.pendingOverlay} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name={
          userRole === "teacher" ? "account-group-outline" : "school-outline"
        }
        size={70}
        color={COLORS.darkBlue}
      />
      <Text style={styles.emptyTitle}>
        {userRole === "teacher"
          ? "No groups created yet"
          : "No groups joined yet"}
      </Text>
    </View>
  );
  if (isLoading) {
    return <LoadingScreen />;
  }
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Groups"
        showBackButton={false}
        style={{ marginBottom: SPACING.md }}
      />

      <FlatList
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {renderBanner()}
            {renderFilterChips()}
          </>
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
      />

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
    backgroundColor: COLORS.midBlue,
  },

  // header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.lightOrange,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.massive,
  },

  // banner
  bannerCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
    overflow: "hidden",
    minHeight: 130,
  },
  bannerTextSection: {
    flex: 1,
    gap: SPACING.sm,
  },
  bannerCount: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.darkBlue,
  },
  bannerSubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    lineHeight: 18,
  },
  pendingPill: {
    backgroundColor: COLORS.lightOrange,
    alignSelf: "flex-start",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
  },
  pendingPillText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  bannerLottie: {
    width: 120,
    height: 120,
    position: "relative",
  },
  lottie: {
    width: 120,
    height: 120,
  },
  liveBadge: {
    position: "absolute",
    top: 8,
    right: 0,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    gap: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  liveText: {
    fontFamily: FONT_USAGE.label,
    fontSize: 9,
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // filter chips
  filterRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  filterChipActive: {
    backgroundColor: COLORS.lightOrange,
    borderColor: COLORS.lightOrange,
  },
  filterChipText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.7)",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },

  // group card
  card: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    position: "relative",
    overflow: "hidden",
  },
  cardPending: {
    backgroundColor: COLORS.lightBlue,
    opacity: 0.75,
  },
  pendingBadge: {
    position: "absolute",
    top: 40,
    right: SPACING.md,
    backgroundColor: COLORS.lightOrange,
    borderRadius: BORDER_RADIUS.round,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
    zIndex: 2,
  },
  pendingBadgeText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  pendingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: BORDER_RADIUS.xxl,
    pointerEvents: "none",
  },

  // card header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardGroupName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.darkBlue,
    flex: 1,
    marginRight: SPACING.sm,
  },
  visibilityBadge: {
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
  },
  visibilityPublic: { backgroundColor: COLORS.midBlue },
  visibilityPrivate: { backgroundColor: COLORS.error },
  visibilityText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  cardSkillName: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
    marginTop: -SPACING.xs,
  },

  // card body
  cardBody: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "stretch",
  },
  cardImageContainer: {},
  cardImage: {
    width: 110,
    height: 110,
    borderRadius: BORDER_RADIUS.lg,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 90,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.darkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  cardRight: {
    flex: 1,
  },

  // session card inside group card
  sessionCard: {
    backgroundColor: COLORS.skinToneOrange,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: 3,
    flex: 1,
  },
  sessionTitle: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  sessionDate: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  sessionClickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sessionClick: {
    fontFamily: FONT_USAGE.label,
    fontSize: 10,
    color: COLORS.lightOrange,
  },
  sessionDots: {
    flexDirection: "row",
    gap: 5,
    marginTop: SPACING.xs,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.dimBlue,
  },
  dotActive: {
    backgroundColor: COLORS.darkBlue,
    width: 10,
    height: 10,
  },
  noSessionCard: {
    flex: 1,
    backgroundColor: COLORS.dimBlue,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.xs,
    minHeight: 90,
  },
  noSessionText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    textAlign: "center",
  },

  // card footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  participantSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  participantText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.dimBlue,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.midBlue,
    borderRadius: BORDER_RADIUS.sm,
  },
  difficultyLabel: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    minWidth: 60,
    textAlign: "right",
  },

  // empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.massive,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.lightGray,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
