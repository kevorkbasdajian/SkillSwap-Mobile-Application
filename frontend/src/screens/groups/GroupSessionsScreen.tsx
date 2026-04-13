import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Touchable,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "../../constants";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { GroupStackParamList, GroupTabParamList } from "@/src/navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { useGroupContext } from "@/src/context/GroupContext";
import { useEffect, useState } from "react";
import { sessionsAPI } from "@/src/services/api";
import * as DocumentPicker from "expo-document-picker";
import { Badge } from "@/src/components/common/Badge";
import { Modal } from "@/src/components/common/Modal";
import { Input } from "@/src/components/common/Input";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "@/src/components/common/Button";
import { Header } from "@/src/components/navigation/NavHeader";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { GradientBackground } from "@/src/components/common/GradientBackground";
import LottieView from "lottie-react-native";

// type for navigation
type GroupSessionsNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<GroupTabParamList, "GroupSessions">,
  NativeStackNavigationProp<GroupStackParamList>
>;

// interface for a session
interface Session {
  id: string;
  title: string;
  description: string;
  session_type: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  attendance_summary: { present: number; total: number };
}

// interface for a selected file
interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

const SESSION_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "review", label: "Review" },
  { value: "practice", label: "Practice" },
  { value: "problem_solving", label: "Problem Solving" },
] as const;

const getStatusConfig = (status: string) => {
  switch (status) {
    case "scheduled":
      return { label: "Pending", variant: "info" as const };
    case "completed":
      return { label: "Completed", variant: "success" as const };
    case "cancelled":
      return { label: "Cancelled", variant: "error" as const };
    default:
      return { label: status, variant: "default" as const };
  }
};

const calcDuration = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? `${mins} min` : "N/A";
};

const formatTimeHHMM = (date: Date) =>
  `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

const formatDateDisplay = (date: Date) =>
  date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTimeDisplay = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1 - 24)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string, fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType.includes("pdf"))
    return { name: "file-pdf-box", color: "#D94F21" };
  if (["doc", "docx"].includes(ext) || mimeType.includes("word"))
    return { name: "file-word-box", color: "#2B579A" };
  if (["xls", "xlsx"].includes(ext) || mimeType.includes("excel"))
    return { name: "file-excel-boxe", color: "#217346" };
  if (["ppt", "pptx"].includes(ext) || mimeType.includes("powerpoint"))
    return { name: "file-powerpoint-box", color: "#D24726" };
  if (mimeType.includes("image"))
    return { name: "file-image", color: COLORS.midBlue };
  return { name: "file-document", color: COLORS.midBlack };
};
export default function GroupSessionsScreen() {
  //---------------Constants-----------
  //For navigation
  const navigation = useNavigation<GroupSessionsNavProp>();
  //For error handling
  const toast = useErrorToast();
  //Extracting the group Id from the context
  const { groupId, userRole } = useGroupContext();

  //Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  //For loading state
  const [isLoading, setIsLoading] = useState(true);

  //Create a session modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  //New session attributes
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sessionType, setSessionType] = useState<
    "meeting" | "review" | "practice" | "problem_solving"
  >("meeting");
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [shwoDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  //---------------Hooks-----------
  useEffect(() => {
    loadSessions();
  }, []);

  //---------------Functions-----------
  //Load the sessions of a group
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await sessionsAPI.getGroupSessions(String(groupId));
      if (response.success) setSessions(response.data);
    } catch {
      toast.showError("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  };
  //For handling the file choosing functionality
  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType || "application/octet-stream",
          size: a.size || 0,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch {
      toast.showError("Failed to pick files");
    }
  };

  //Remove a file
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  //Reset the form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSessionType("meeting");
    setScheduledDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setSelectedFiles([]);
  };

  //handle session creation
  const handleCreateSession = async () => {
    if (title.trim().length < 3) {
      toast.showError("Title must be at least 3 characters");
      return;
    }
    if (description.trim().length < 10) {
      toast.showError("Description must be at least 10 characters");
      return;
    }
    const startMins = startTime.getHours() * 60 + startTime.getMinutes();
    const endMins = endTime.getHours() * 60 + endTime.getMinutes();
    if (endMins <= startMins) {
      toast.showError("End time must be after start time");
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("session_type", sessionType);
      formData.append(
        "scheduled_date",
        scheduledDate.toISOString().split("T")[0],
      );
      formData.append("start_time", formatTimeHHMM(startTime));
      formData.append("end_time", formatTimeHHMM(endTime));

      for (const file of selectedFiles) {
        formData.append("artifacts", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      }
      const response = await sessionsAPI.createSession(
        String(groupId),
        formData,
      );
      if (response.success) {
        toast.showSuccess("Session created!");
        setShowCreateModal(false);
        resetForm();
        loadSessions();
      }
    } catch (error: any) {
      toast.showError(
        error.response?.data?.error || "Failed to create session",
      );
    } finally {
      setIsCreating(false);
    }
  };

  //Render Helpers
  const renderSessionCard = (session: Session, index: number) => {
    const status = getStatusConfig(session.status);
    const duration = calcDuration(session.start_time, session.end_time);

    return (
      <View key={session.id}>
        <GradientBackground
          variant="darkBlueToMidLightBlue"
          style={styles.sessionCard}
        >
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("SessionDetail", { sessionId: session.id })
            }
            activeOpacity={0.8}
            style={styles.sessionCardContainer}
          >
            <View style={styles.header}>
              <View style={styles.sessionCardLeft}>
                <View style={styles.numberContainer}>
                  <Text style={styles.sessionNumber}>{index + 1}.</Text>
                </View>
                <Text style={styles.sessionTitle}>{session.title}</Text>
              </View>
              <MaterialCommunityIcons
                name="arrow-right-circle"
                size={28}
                color={COLORS.white}
              />
            </View>

            <View style={styles.sessionCardBottom}>
              <View style={styles.durationRow}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={35}
                  color={COLORS.lightBlue}
                />
                <Text style={styles.durationText}>{duration}</Text>
              </View>
              <Badge
                label={status.label}
                variant={status.variant}
                size="small"
                style={{ alignSelf: "flex-end" }}
              />
            </View>
          </TouchableOpacity>
        </GradientBackground>

        {/* Dashed connector */}
        {index < sessions.length - 1 && <View style={styles.dashConnector} />}
      </View>
    );
  };

  const renderCreateModal = () => {
    return (
      <Modal
        visible={showCreateModal}
        title="Create Session"
        showCloseButton
        size="large"
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContent}>
          {/* Title */}
          <Input
            label="Title"
            labelStyle={{ color: COLORS.darkBlue }}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Session 2"
            textStyle={{ color: COLORS.darkBlue }}
          />
          {/* Description */}
          <Input
            label="Description"
            labelStyle={{ color: COLORS.darkBlue }}
            onChangeText={setDescription}
            placeholder="What will learners achieve in this session"
            textStyle={{ color: COLORS.darkBlue }}
            ismultiline
            multiline
            numberOfLines={3}
            maxLength={280}
          />
          <Text style={styles.charCount}>{description.length}/280</Text>

          {/* Session Type */}
          <Text style={styles.formLabel}>Session Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScroll}
          >
            {SESSION_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeBtn,
                  sessionType === t.value && styles.typeBtnActive,
                ]}
                onPress={() => setSessionType(t.value)}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    sessionType === t.value && styles.typeBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Scheduled Date */}
          <Text style={styles.formLabel}>Scheduled Date</Text>
          <TouchableOpacity
            style={styles.dateTimeRow}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={COLORS.darkBlue}
            />
            <Text style={styles.dateTimeText}>
              {formatDateDisplay(scheduledDate)}
            </Text>
          </TouchableOpacity>
          {shwoDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (date) setScheduledDate(date);
              }}
            />
          )}

          {/* Start + End Time */}
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Start Time</Text>
              <TouchableOpacity
                style={styles.dateTimeRow}
                onPress={() => setShowStartPicker(true)}
              >
                <MaterialCommunityIcons
                  name="clock-start"
                  size={20}
                  color={COLORS.darkBlue}
                />
                <Text style={styles.dateTimeText}>
                  {formatTimeDisplay(formatTimeHHMM(startTime))}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>End Time</Text>
              <TouchableOpacity
                style={styles.dateTimeRow}
                onPress={() => setShowEndPicker(true)}
              >
                <MaterialCommunityIcons
                  name="clock-end"
                  size={20}
                  color={COLORS.darkBlue}
                />
                <Text style={styles.dateTimeText}>
                  {formatTimeDisplay(formatTimeHHMM(endTime))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowStartPicker(Platform.OS === "ios");
                if (date) setStartTime(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, date) => {
                setShowEndPicker(Platform.OS === "ios");
                if (date) setEndTime(date);
              }}
            />
          )}
          {/* Uppload */}
          <Text style={styles.formLabel}>Upload Material</Text>
          <TouchableOpacity
            style={styles.uploadArea}
            onPress={handlePickFiles}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cloud-upload"
              size={40}
              color={COLORS.midBlue}
            />
            <Text style={styles.uploadText}>Upload Material</Text>
            <Text style={styles.uploadSubtext}>
              PDF, Word, Excel, PowerPoint
            </Text>
          </TouchableOpacity>

          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <View style={styles.filesList}>
              {selectedFiles.map((file, i) => {
                const icon = getFileIcon(file.mimeType, file.name);
                return (
                  <View key={i} style={styles.fileItem}>
                    <MaterialCommunityIcons
                      name={icon.name as any}
                      size={24}
                      color={icon.color}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFile(i)}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={20}
                        color={COLORS.error}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
          <Button
            title="Create Session"
            variant="secondary"
            size="large"
            fullWidth
            loading={isCreating}
            disabled={isCreating}
            onPress={handleCreateSession}
            style={{ marginTop: SPACING.md }}
            icon={
              <MaterialCommunityIcons
                name="plus-circle"
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Sessions"
        showBackButton={false}
        style={{ backgroundColor: COLORS.darkGray }}
      />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.lightBlue} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Session cards */}
          {sessions.map((session, index) => renderSessionCard(session, index))}

          {/* Create Session card */}
          {/* <TouchableOpacity
            style={styles.createCard}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.createCardLeft}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={40}
                color={COLORS.skinToneOrange}
              />
            </View>
            <Text style={styles.createCardTitle}>Create Session</Text>
            <View style={styles.createCardRight}>
              <MaterialCommunityIcons
                name="laptop-account"
                size={50}
                color={COLORS.skinToneOrange2}
              />
            </View>
            <View style={styles.createCardPlus}>
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.white}
              />
            </View>
          </TouchableOpacity> */}

          {userRole === "teacher" && (
            <View style={{ marginTop: SPACING.massive }}>
              <GradientBackground
                variant="darkBlueToMidLightBlue"
                style={styles.sessionCard}
              >
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.8}
                  style={styles.sessionCardContainer}
                >
                  <View style={styles.header}>
                    <Text
                      style={[styles.sessionTitle, { fontSize: FONT_SIZES.lg }]}
                    >
                      Create Session
                    </Text>
                    <MaterialCommunityIcons
                      name="plus"
                      size={28}
                      color={COLORS.white}
                    />
                  </View>

                  <View style={styles.sessionCardBottom}>
                    <View style={styles.durationRow}>
                      <MaterialCommunityIcons
                        name="timer-sand"
                        size={40}
                        color={COLORS.lightBlue}
                      />
                    </View>
                  </View>
                  <LottieView
                    source={require("../../assets/animations/createSessionAnimation.json")}
                    autoPlay
                    loop
                    style={styles.animation}
                  />
                </TouchableOpacity>
              </GradientBackground>
            </View>
          )}
        </ScrollView>
      )}
      {userRole === "teacher" && renderCreateModal()}
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
  // Main
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.massive,
  },
  createCard: {
    backgroundColor: COLORS.midDarkBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    overflow: "hidden",
    position: "relative",
  },
  createCardLeft: {},
  createCardTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.lightOrange,
    flex: 1,
  },
  createCardRight: {
    opacity: 0.5,
  },
  createCardPlus: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightOrange,
    justifyContent: "center",
    alignItems: "center",
  },

  // Session Card
  sessionCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    flex: 1,
    minHeight: 160,
  },
  sessionCardContainer: {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  numberContainer: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionNumber: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.lightBlue,
  },
  sessionTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    flex: 1,
  },
  sessionCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    width: "100%",
    paddingHorizontal: SPACING.sm,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,

    flex: 1,
  },
  durationText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlue,
  },
  dashConnector: {
    width: 2,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.skinToneOrange,
    borderStyle: "dashed",
    alignSelf: "center",
    marginVertical: 4,
  },
  animation: {
    height: 90,
    width: 90,
    position: "absolute",
    bottom: 0,
    right: -10,
  },

  // Modal
  modalContent: { gap: SPACING.sm },
  charCount: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    textAlign: "right",
    marginTop: -SPACING.md,
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  typeScroll: { marginBottom: SPACING.sm },
  typeBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.midBlue,
    marginRight: SPACING.sm,
  },
  typeBtnActive: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  typeBtnText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  typeBtnTextActive: { color: COLORS.white },
  formLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  dateTimeText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
  },
  timeRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.dimBlue,
    marginBottom: SPACING.sm,
  },
  uploadText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlue,
  },
  uploadSubtext: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  filesList: {
    gap: SPACING.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.lightGray,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  fileName: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  fileSize: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
});
