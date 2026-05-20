import { Badge } from "@/src/components/common/Badge";
import { Header } from "@/src/components/navigation/NavHeader";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { GroupStackParamList } from "@/src/navigation/types";
import { sessionsAPI } from "@/src/services/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/common/Button";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingScreen } from "@/src/components/common/LoadingScreen";
import * as DocumentPicker from "expo-document-picker";

//Type for navigation
type SessionDetailNavProp = NativeStackNavigationProp<
  GroupStackParamList,
  "SessionDetail"
>;
//Type for the route prop
type SessionDetailRouteProp = RouteProp<GroupStackParamList, "SessionDetail">;
//interface for the session
interface SessionDetail {
  id: string;
  title: string;
  description: string;
  session_type: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "completed" | "cancelled";
  created_at: string;
  is_creator: boolean;
  group: {
    id: string;
    name: string;
    creator_id: string;
    skill: { id: string; name: string; icon_url: string };
  };
  session_participants: Array<{
    id: string;
    attendance_status: "present" | "absent";
    user: {
      id: string;
      full_name: string;
      nick_name?: string;
      profile_image_url?: string;
    };
  }>;
  attendance_summary: { present: number; absent: number; total: number };
}

//interface for the artifact
interface Artifact {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  created_at: string;
  uploaded_by: {
    id: string;
    full_name: string;
    nick_name?: string;
  };
}

const formatDateDisplay = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatTimeDisplay = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const calcDuration = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? `${mins} min` : "N/A";
};

const getSessionTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    meeting: "Meeting",
    review: "Review",
    practice: "Practice",
    problem_solving: "Problem Solving",
  };
  return labels[type] || type;
};

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

const getFileIcon = (mimeType: string, fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || mimeType.includes("pdf"))
    return { name: "file-pdf-box", color: "#D94F21" };
  if (["doc", "docx"].includes(ext) || mimeType.includes("word"))
    return { name: "file-word-box", color: "#2B579A" };
  if (["xls", "xlsx"].includes(ext) || mimeType.includes("excel"))
    return { name: "file-excel-box", color: "#217346" };
  if (["ppt", "pptx"].includes(ext) || mimeType.includes("powerpoint"))
    return { name: "file-powerpoint-box", color: "#D24726" };
  if (mimeType.includes("image"))
    return { name: "file-image", color: COLORS.midBlue };
  return { name: "file-document", color: COLORS.midBlack };
};

export default function SessionDetailScreen() {
  //---------------Constants-----------
  //For navigation
  const navigation = useNavigation<SessionDetailNavProp>();
  //For extracting route prop
  const route = useRoute<SessionDetailRouteProp>();
  const { sessionId } = route.params;
  //For error handling
  const toast = useErrorToast();
  //For holding session info + artifacts
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  //For loading state
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "complete" | "cancel" | null
  >(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { user } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<
    Array<{
      uri: string;
      name: string;
      mimeType: string;
      size: number;
    }>
  >([]);
  const [showUploadSection, setShowUploadSection] = useState(false);

  //---------------Hooks-----------
  useEffect(() => {
    loadAll();
  }, []);

  //---------------Functions-----------
  //Load session details + artifacts
  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [sessionRes, artifactsRes] = await Promise.all([
        sessionsAPI.getSessionDetails(sessionId),
        sessionsAPI.getSessionArtifacts(sessionId),
      ]);
      if (sessionRes.success) setSession(sessionRes.data);
      if (artifactsRes.success) setArtifacts(artifactsRes.data);
    } catch {
      toast.showError("Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };
  //Check-in
  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await sessionsAPI.checkInToSession(sessionId);
      toast.showSuccess("Checked in successfully!");
      await loadAll();
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to check in");
    } finally {
      setIsCheckingIn(false);
    }
  };
  //Change session status to complete
  const handleMarkComplete = () => {
    Alert.alert(
      "Mark as Completed",
      "Are you sure you want to mark this session as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setActionLoading("complete");
            try {
              await sessionsAPI.markSessionCompleted(sessionId);
              toast.showSuccess("Session marked as completed!");
              loadAll();
            } catch (error: any) {
              toast.showError(error.response?.data?.error || "Failed");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  //Change session status to cancelled
  const handleCancelSession = () => {
    Alert.alert(
      "Cancel Session",
      "Are you sure you want to cancel this session? Members will be notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Session",
          style: "destructive",
          onPress: async () => {
            setActionLoading("cancel");
            try {
              await sessionsAPI.cancelSession(sessionId);
              toast.showSuccess("Session cancelled");
              loadAll();
            } catch (error: any) {
              toast.showError(error.response?.data?.error || "Failed");
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

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
        setUploadFiles((prev) => [...prev, ...newFiles]);
      }
    } catch {
      toast.showError("Failed to pick files");
    }
  };

  const handleUploadArtifacts = async () => {
    if (uploadFiles.length === 0) {
      toast.showError("Please select at least one file");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append("artifacts", {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      }
      const response = await sessionsAPI.uploadArtifacts(sessionId, formData);
      if (response.success) {
        toast.showSuccess("Files uploaded successfully!");
        setUploadFiles([]);
        setShowUploadSection(false);
        // Refresh artifacts
        const artifactsRes = await sessionsAPI.getSessionArtifacts(sessionId);
        if (artifactsRes.success) setArtifacts(artifactsRes.data);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const hanldeOpenArtifact = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.showError("Could not open file");
    }
  };

  if (isLoading) return <LoadingScreen />;

  if (!session) {
    console.log("sjsks");
    return null;
  }

  const statusConfig = getStatusConfig(session.status);
  const duration = calcDuration(session.start_time, session.end_time);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title={session.title}
        showBackButton
        handleOnPress={() => navigation.goBack()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main info card */}
        <View style={styles.mainCard}>
          {/* Badged row */}
          <View style={styles.badgeRow}>
            <Badge label={statusConfig.label} variant={statusConfig.variant} />
            <Badge
              label={getSessionTypeLabel(session.session_type)}
              variant="default"
            />
          </View>

          {/* Description + hourglass */}
          <View style={styles.descRow}>
            <View style={styles.descSection}>
              <View style={styles.descLabelRow}>
                <Text style={styles.sectionLabel}>Description</Text>
                <MaterialCommunityIcons
                  name="text-box"
                  size={16}
                  color={COLORS.lightOrange}
                />
              </View>
              <Text style={styles.descText}>{session.description}</Text>
            </View>
            <View style={styles.hourglassContainer}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={50}
                color={COLORS.skinToneOrange}
              />
              <Text style={styles.durationBig}>{duration}</Text>
            </View>
          </View>

          {/* Date + Times */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="calendar"
                size={18}
                color={COLORS.lightBlue}
              />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {formatDateDisplay(session.scheduled_date)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="clock-start"
                size={18}
                color={COLORS.lightBlue}
              />
              <Text style={styles.infoLabel}>Start</Text>
              <Text style={styles.infoValue}>
                {formatTimeDisplay(session.start_time)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons
                name="clock-end"
                size={18}
                color={COLORS.lightBlue}
              />
              <Text style={styles.infoLabel}>End</Text>
              <Text style={styles.infoValue}>
                {formatTimeDisplay(session.end_time)}
              </Text>
            </View>
          </View>
        </View>

        {/* Attendance Card */}
        <View style={styles.attendanceCard}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceStat}>
              <Text
                style={[styles.attendanceNumber, { color: COLORS.success }]}
              >
                {session.attendance_summary.present}
              </Text>
              <Text style={styles.attendanceLabel}>Present</Text>
            </View>
            <View style={styles.attendanceDivider} />
            <View style={styles.attendanceStat}>
              <Text style={[styles.attendanceNumber, { color: COLORS.error }]}>
                {session.attendance_summary.absent}
              </Text>
              <Text style={styles.attendanceLabel}>Absent</Text>
            </View>
            <View style={styles.attendanceDivider} />
            <View style={styles.attendanceStat}>
              <Text
                style={[styles.attendanceNumber, { color: COLORS.lightBlue }]}
              >
                {session.attendance_summary.total}
              </Text>
              <Text style={styles.attendanceLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Uploaded material card */}
        <View style={styles.artifactsCard}>
          <Text style={styles.artifactsTitle}>Uploaded Material</Text>
          {artifacts.length === 0 ? (
            <View style={styles.noArtifacts}>
              <MaterialCommunityIcons
                name="file-upload-outline"
                size={40}
                color={COLORS.midBlack}
              />
              <Text style={styles.noArtifactsText}>No files uploaded yet</Text>
            </View>
          ) : (
            <View style={styles.artifactsList}>
              {artifacts.map((artifact, i) => {
                const icon = getFileIcon(
                  artifact.file_type,
                  artifact.file_name,
                );
                return (
                  <View key={artifact.id}>
                    <View style={styles.artifactItem}>
                      <View style={styles.artifactIconBg}>
                        <MaterialCommunityIcons
                          name={icon.name as any}
                          size={32}
                          color={icon.color}
                        />
                      </View>
                      <View style={styles.artifactInfo}>
                        <Text style={styles.artifactName} numberOfLines={1}>
                          {artifact.file_name}
                        </Text>
                        <Text style={styles.artifactType}>
                          {artifact.file_type.split("/")[1]?.toUpperCase() ||
                            "File"}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.downloadBtn}
                        onPress={() => hanldeOpenArtifact(artifact.file_url)}
                      >
                        <MaterialCommunityIcons
                          name="download"
                          size={22}
                          color={COLORS.midBlue}
                        />
                      </TouchableOpacity>
                    </View>
                    {i < artifacts.length - 1 && (
                      <View style={styles.artifactDivider} />
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Upload section — teacher only */}
          {session?.is_creator && session.status !== "completed" && (
            <View style={uploadStyles.uploadSection}>
              <TouchableOpacity
                style={uploadStyles.uploadToggle}
                onPress={() => {
                  setShowUploadSection(!showUploadSection);
                  setUploadFiles([]);
                }}
              >
                <MaterialCommunityIcons
                  name={showUploadSection ? "close" : "upload"}
                  size={18}
                  color={COLORS.midBlue}
                />
                <Text style={uploadStyles.uploadToggleText}>
                  {showUploadSection ? "Cancel" : "Upload New Material"}
                </Text>
              </TouchableOpacity>

              {showUploadSection && (
                <View style={uploadStyles.uploadBody}>
                  {/* File picker area */}
                  <TouchableOpacity
                    style={uploadStyles.pickArea}
                    onPress={handlePickFiles}
                  >
                    <MaterialCommunityIcons
                      name="cloud-upload-outline"
                      size={28}
                      color={COLORS.midBlue}
                    />
                    <Text style={uploadStyles.pickAreaText}>
                      Tap to select files
                    </Text>
                    <Text style={uploadStyles.pickAreaSub}>
                      PDF, Word, Excel, PowerPoint
                    </Text>
                  </TouchableOpacity>

                  {/* Selected files */}
                  {uploadFiles.length > 0 && (
                    <View style={uploadStyles.filesList}>
                      {uploadFiles.map((file, i) => {
                        const icon = getFileIcon(file.mimeType, file.name);
                        return (
                          <View key={i} style={uploadStyles.fileItem}>
                            <MaterialCommunityIcons
                              name={icon.name as any}
                              size={22}
                              color={icon.color}
                            />
                            <Text
                              style={uploadStyles.fileName}
                              numberOfLines={1}
                            >
                              {file.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                setUploadFiles((prev) =>
                                  prev.filter((_, idx) => idx !== i),
                                )
                              }
                            >
                              <MaterialCommunityIcons
                                name="close-circle"
                                size={18}
                                color={COLORS.error}
                              />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Upload button */}
                  {uploadFiles.length > 0 && (
                    <Button
                      title={`Upload ${uploadFiles.length} File${uploadFiles.length > 1 ? "s" : ""}`}
                      variant="primary"
                      size="medium"
                      fullWidth
                      loading={isUploading}
                      disabled={isUploading}
                      onPress={handleUploadArtifacts}
                      style={{ marginTop: SPACING.sm }}
                      icon={
                        <MaterialCommunityIcons
                          name="upload"
                          size={18}
                          color={COLORS.white}
                        />
                      }
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
        {/* teacher actions */}
        {session.is_creator && session.status === "scheduled" && (
          <View style={styles.actionsContainer}>
            <Button
              title="Mark Completed"
              variant="primary"
              size="large"
              fullWidth
              loading={actionLoading === "complete"}
              disabled={actionLoading !== null}
              onPress={handleMarkComplete}
              icon={
                <MaterialCommunityIcons
                  name="check-circle"
                  size={20}
                  color={COLORS.white}
                />
              }
            />
            <Button
              title="Cancel Session"
              variant="outline"
              size="large"
              fullWidth
              loading={actionLoading === "cancel"}
              disabled={actionLoading !== null}
              onPress={handleCancelSession}
              style={{ borderColor: COLORS.error }}
              textStyle={{ color: COLORS.error }}
              icon={
                <MaterialCommunityIcons
                  name="cancel"
                  size={20}
                  color={COLORS.error}
                />
              }
            />
          </View>
        )}
        {(() => {
          const myParticipant = session.session_participants.find(
            (p) => p.user.id === /* your current user id */ user?.id,
          );
          const alreadyCheckedIn =
            myParticipant?.attendance_status === "present";

          if (!session.is_creator && session.status === "scheduled") {
            return (
              <View style={styles.actionsContainer}>
                <Button
                  title={alreadyCheckedIn ? "Attending ✓" : "Mark as Attending"}
                  variant={alreadyCheckedIn ? "outline" : "primary"}
                  size="large"
                  fullWidth
                  loading={isCheckingIn}
                  disabled={alreadyCheckedIn || isCheckingIn}
                  onPress={handleCheckIn}
                  style={
                    alreadyCheckedIn ? { borderColor: COLORS.success } : {}
                  }
                  textStyle={alreadyCheckedIn ? { color: COLORS.success } : {}}
                  icon={
                    <MaterialCommunityIcons
                      name={alreadyCheckedIn ? "check-circle" : "account-check"}
                      size={20}
                      color={alreadyCheckedIn ? COLORS.success : COLORS.white}
                    />
                  }
                />
              </View>
            );
          }
          return null;
        })()}
      </ScrollView>
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
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.massive,
  },
  mainCard: {
    backgroundColor: COLORS.midDarkBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  descRow: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "flex-start",
  },
  descSection: {
    flex: 1,
  },
  descLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  sectionLabel: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightOrange,
  },
  descText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightBlack3,
    lineHeight: 20,
  },
  hourglassContainer: {
    alignItems: "center",
    gap: SPACING.xs,
  },
  durationBig: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.skinToneOrange,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.darkBlue,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  infoItem: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  infoLabel: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  infoValue: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    textAlign: "center",
  },
  attendanceCard: {
    backgroundColor: COLORS.midDarkBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  attendanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  attendanceStat: {
    alignItems: "center",
    gap: 4,
  },
  attendanceNumber: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
  },
  attendanceLabel: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightBlack3,
  },
  attendanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.darkBlue,
  },
  artifactsCard: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  artifactsTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.darkBlue,
  },
  noArtifacts: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  noArtifactsText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlack,
  },
  artifactsList: {
    gap: SPACING.xs,
  },
  artifactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  artifactIconBg: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  artifactInfo: {
    flex: 1,
  },
  artifactName: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  artifactType: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  downloadBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.round,
  },
  artifactDivider: {
    height: 1,
    backgroundColor: COLORS.dimBlue,
    marginVertical: 2,
  },
  actionsContainer: {
    gap: SPACING.md,
  },
});

const uploadStyles = StyleSheet.create({
  uploadSection: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dimBlue,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    width: "100%",
  },
  uploadToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginInline: "auto",
    backgroundColor: COLORS.dimBlue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  uploadToggleText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  uploadBody: { gap: SPACING.md },
  pickArea: {
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: "rgba(50,146,175,0.06)",
  },
  pickAreaText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  pickAreaSub: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  filesList: { gap: SPACING.sm },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  fileName: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkBlue,
  },
});
