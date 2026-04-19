import { Header } from "@/src/components/navigation/NavHeader";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useGroupContext } from "@/src/context/GroupContext";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { groupsAPI, notificationsAPI } from "@/src/services/api";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/common/Button";
import { Modal } from "@/src/components/common/Modal";
import { Input } from "@/src/components/common/Input";
import { getSocket } from "@/src/services/socketService";

interface HistoryNotification {
  id: number;
  title: string;
  message: string;
  created_at: string;
}

export default function GroupNotificationHistoryScreen() {
  //---------------Constants-----------
  //Navigation
  const navigation = useNavigation();
  //Error handling
  const toast = useErrorToast();
  const { groupId, userRole } = useGroupContext();

  //Store the notifications here
  const [notifications, setNotifications] = useState<HistoryNotification[]>([]);
  //For loading state
  const [isLoading, setIsLoading] = useState(true);
  //For sending a new notification
  const [showSendModal, setShowSendModal] = useState(false);
  //New notification values
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  //---------------Hooks-----------

  useEffect(() => {
    loadHistory();
    setupSocketListener();

    return () => {
      const socket = getSocket();
      socket?.off("notification");
    };
  }, []);

  //---------------Functions-----------
  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await notificationsAPI.getNotificationHistory(groupId);
      console.log("Response is", response.data);
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
    } catch (error: any) {
      toast.showError("Failed to load notification history");
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocketListener = () => {
    const socket = getSocket();
    if (!socket) return;
    socket.on("notification", (payload: any) => {
      const raw = payload.data;

      const formatted: HistoryNotification = {
        id: raw.notifications.id,
        title: raw.notifications.title,
        message: raw.notifications.message,
        created_at: raw.notifications.created_at,
      };

      setNotifications((prev) => [...prev, formatted]);
    });
  };

  const handleSend = async () => {
    if (title.trim().length < 3) {
      toast.showError("Title must be at least 3 characters");
      return;
    }
    if (message.trim().length < 3) {
      toast.showError("Message must be at least 3 characters");
      return;
    }
    setIsSending(true);
    try {
      await groupsAPI.sendNotificationToMembers(groupId, {
        title: title.trim(),
        message: message.trim(),
      });
      toast.showSuccess("Notification sent!");
      setShowSendModal(false);
      setTitle("");
      setMessage("");
      loadHistory();
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to send");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notification History"
        showBackButton
        handleOnPress={() => navigation.goBack()}
        style={{ backgroundColor: COLORS.darkGray }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.lightBlue}
            style={{ marginTop: SPACING.massive }}
          />
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={70}
              color={COLORS.lightBlack}
            />
            <Text style={styles.emptyText}>No notifications sent yet</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <View key={notif.id} style={styles.notifCard}>
              <View style={styles.notifCardInner}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifMessage}>{notif.message}</Text>
                <Text style={styles.notifDate}>
                  {new Date(notif.created_at).toLocaleDateString("en-Us", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <View style={styles.notifDot} />
            </View>
          ))
        )}
      </ScrollView>

      {/* Send button */}
      {userRole === "teacher" && (
        <View style={styles.sendButtonContainer}>
          <Button
            title="New Notification"
            variant="secondary"
            size="large"
            fullWidth
            onPress={() => setShowSendModal(true)}
            icon={
              <MaterialCommunityIcons
                name="email-arrow-right"
                size={20}
                color={COLORS.white}
              />
            }
          />
        </View>
      )}

      {/* Send Modal */}
      {userRole === "teacher" && (
        <Modal
          visible={showSendModal}
          title="Send a Message"
          showCloseButton
          size="large"
          onClose={() => {
            setShowSendModal(false);
            setTitle("");
            setMessage("");
          }}
        >
          <View style={styles.modalContent}>
            <Input
              label="Title"
              labelStyle={{ color: COLORS.darkBlue }}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Important Reminder"
              textStyle={{ color: COLORS.darkBlue }}
            />
            <Input
              label="Description"
              labelStyle={{ color: COLORS.darkBlue }}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your message here..."
              textStyle={{ color: COLORS.darkBlue }}
              ismultiline
              multiline
              numberOfLines={4}
            />
            <Button
              title="Send Message"
              variant="secondary"
              size="large"
              fullWidth
              loading={isSending}
              disabled={isSending}
              onPress={handleSend}
              icon={
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color={COLORS.white}
                />
              }
            />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.darkBlue },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: SPACING.massive,
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlack3,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  notifCardInner: {
    flex: 1,
    backgroundColor: COLORS.midDarkBlue,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  notifTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  notifMessage: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightBlack3,
    lineHeight: 20,
  },
  notifDate: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.skinToneOrange,
    textAlign: "right",
    marginTop: SPACING.xs,
  },
  notifDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.lightOrange,
  },
  sendButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.xl,
    backgroundColor: COLORS.darkBlue,
    borderTopWidth: 1,
    borderTopColor: COLORS.midDarkBlue,
  },
  modalContent: { gap: SPACING.md },
});
