import React, { useEffect } from "react";

import {
  Notification,
  useNotifications,
} from "@/src/context/NotificationContext";
import { useState } from "react";
import { friendAPI, groupsAPI, notificationsAPI } from "@/src/services/api";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  Touchable,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface NotificationPanelProps {
  onClose: () => void;
  autoAcceptGroupInvites?: boolean;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  onClose,
  autoAcceptGroupInvites = false,
}) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // runs once when panel opens
  useEffect(() => {
    if (!autoAcceptGroupInvites) return;
    notifications.forEach((notification) => {
      const isGroupInvite =
        notification.notifications.related_entity_type === "group" &&
        notification.notifications.title === "Group Invitation";
      if (isGroupInvite && !notification.is_read) {
        handleGroupInviteAction(notification, "accept");
      }
    });
  }, [autoAcceptGroupInvites, notifications]);

  const handleAcceptFriend = async (notification: Notification) => {
    setActionLoading(notification.id);
    try {
      await friendAPI.acceptFriendRequest(
        notification.notifications.related_entity_id,
      );
      await markAsRead(notification.id);
      await notificationsAPI.deleteNotification(notification.id);

      removeNotification(notification.id);
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectFriend = async (notification: Notification) => {
    setActionLoading(notification.id);
    try {
      await friendAPI.rejectFriendRequest(
        notification.notifications.related_entity_id,
      );
      await markAsRead(notification.id);
      await notificationsAPI.deleteNotification(notification.id);

      removeNotification(notification.id);
    } catch (error) {
      console.error("Failed to reject friend request:", error);
    } finally {
      setActionLoading(null);
    }
  };
  const handleGroupJoinAction = async (
    notification: Notification,
    action: "approve" | "reject",
  ) => {
    if (actionLoading === notification.id) return;
    setActionLoading(notification.id);
    try {
      //Fetch group details to find the pending member's id
      const res = await groupsAPI.getGroupDetails(
        notification.notifications.related_entity_id,
      );
      if (!res.success) throw new Error("Failed to load group");
      console.log(notification.notifications);
      console.log("Response pending are", res.data.pending);
      //Find the pending member whose user_id matches the sender
      const pendingMember = res.data.pending?.find(
        (m: any) => m.user?.id === notification.notifications.sender.id,
      );
      console.log("Pending member are", pendingMember);

      if (!pendingMember) {
        await markAsRead(notification.id);
        removeNotification(notification.id);
        await notificationsAPI.deleteNotification(notification.id);

        return;
      }
      console.log("Will enter approve");

      if (action === "approve") {
        console.log("Entered approve");

        await groupsAPI.approveMember(
          notification.notifications.related_entity_id,
          pendingMember.id,
        );
      } else {
        await groupsAPI.rejectMember(
          notification.notifications.related_entity_id,
          pendingMember.id,
        );
      }
      await markAsRead(notification.id);
      removeNotification(notification.id);
      await notificationsAPI.deleteNotification(notification.id);
      console.log("Reached here");
    } catch (error: any) {
      console.error("Group action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGroupInviteAction = async (
    notification: Notification,
    action: "accept" | "decline",
  ) => {
    setActionLoading(notification.id);
    try {
      if (action === "accept") {
        await groupsAPI.acceptGroupInvite(
          notification.notifications.related_entity_id,
        );
      } else {
        await groupsAPI.declineGroupInvite(
          notification.notifications.related_entity_id,
        );
      }
      await markAsRead(notification.id);
      await notificationsAPI.deleteNotification(notification.id);
      removeNotification(notification.id);
    } catch (error: any) {
      console.error("Invite action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderNotification = (notification: Notification) => {
    const isFriendRequest =
      notification.notifications.related_entity_type === "friendship" &&
      notification.notifications.title === "New Friend Request";

    const isGroupJoinRequest =
      notification.notifications.related_entity_type === "group" &&
      notification.notifications.title === "New Join Request";
    const isGroupInvite =
      notification.notifications.related_entity_type === "group" &&
      notification.notifications.title === "Group Invitation";

    const isLoading = actionLoading === notification.id;

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationItem,
          !notification.is_read && styles.unreadItem,
        ]}
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.8}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={
              notification.notifications.related_entity_type === "friendship"
                ? "account-plus"
                : notification.notifications.related_entity_type === "group"
                  ? "account-group"
                  : "bell"
            }
            size={24}
            color={COLORS.midBlue}
          />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>
            {notification.notifications.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.notifications.message}
          </Text>

          {/* Accept / Reject for friend requests */}
          {isFriendRequest && (
            <View style={styles.actionButtons}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.midBlue} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptFriend(notification)}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectFriend(notification)}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Approve / Reject for group join requests */}
          {isGroupJoinRequest && (
            <View style={styles.actionButtons}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.midBlue} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() =>
                      handleGroupJoinAction(notification, "approve")
                    }
                  >
                    <Text style={styles.acceptText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() =>
                      handleGroupJoinAction(notification, "reject")
                    }
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Accept / Decline for group invitations */}
          {isGroupInvite && (
            <View style={styles.actionButtons}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.midBlue} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() =>
                      handleGroupInviteAction(notification, "accept")
                    }
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() =>
                      handleGroupInviteAction(notification, "decline")
                    }
                  >
                    <Text style={styles.rejectText}>Decline</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          <Text style={styles.timestamp}>
            {new Date(notification.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          {/* Undread dot */}
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.panel}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {notifications.some((n) => !n.is_read) && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={22}
              color={COLORS.midDarkBlue}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={50}
              color={COLORS.lightBlack}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map(renderNotification)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 90,
    right: SPACING.lg,
    width: 320,
    maxHeight: 480,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.midDarkBlue,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dimBlue,
  },
  panelTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.midDarkBlue,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  markAllBtn: {
    paddingHorizontal: SPACING.sm,
  },
  markAllText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
  },
  scrollContent: {
    // paddingVertical: SPACING.sm,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  unreadItem: {
    backgroundColor: COLORS.skinToneOrange2,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  notificationMessage: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    marginBottom: SPACING.xs,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  acceptButton: {
    backgroundColor: COLORS.midBlue,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  acceptText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  rejectButton: {
    backgroundColor: "transparent",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  rejectText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
  },
  timestamp: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightOrange,
    marginTop: SPACING.xs,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.massive,
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.lightBlack,
  },
});
