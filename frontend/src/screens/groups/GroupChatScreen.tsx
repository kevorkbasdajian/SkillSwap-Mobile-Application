import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "../../constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/src/components/common/Input";
import { Button } from "@/src/components/common/Button";
import { useAuth } from "@/src/context/AuthContext";
import { useGroupContext } from "@/src/context/GroupContext";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { getSocket } from "@/src/services/socketService";
import { chatAPI } from "@/src/services/api";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LoadingScreen } from "@/src/components/common/LoadingScreen";

//Types
interface Sender {
  id: string;
  full_name: string;
  nick_name?: string;
  profile_image_url?: string;
}

interface ReplyTo {
  id: string;
  content: string;
  sender: Pick<Sender, "id" | "full_name" | "nick_name">;
}

interface ChatMessage {
  id: string;
  content?: string;
  message_type: "text" | "poll";
  poll_id?: string;
  reply_to_message_id?: string;
  is_pinned: boolean;
  created_at: string;
  sender: Sender;
  reply_to?: ReplyTo;
}

interface PollOption {
  id: string;
  option_text: string;
  display_order: number;
  vote_count: number;
}
interface PollDetail {
  id: string;
  question: string;
  allow_multiple_answers: boolean;
  is_closed: boolean;
  expires_at?: string;
  user_voted: string[];
  is_teacher: boolean;
  total_votes: number;
  options: PollOption[];
}

//Helpers
const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
const getInitials = (name: String) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

//Poll Bubble
const PollBubble: React.FC<{
  pollId: string;
  pollsMap: Record<string, PollDetail>;
  isTeacher: boolean;
  onVote: (pollId: string, optionId: string) => void;
  onClose: (pollId: string) => void;
}> = ({ pollId, pollsMap, isTeacher, onVote, onClose }) => {
  const poll = pollsMap[pollId];
  if (!poll) {
    return (
      <View style={pollStyles.loading}>
        <ActivityIndicator size="small" color={COLORS.midBlue} />
      </View>
    );
  }

  const totalVotes = poll.total_votes || 0;
  return (
    <View style={pollStyles.container}>
      <Text style={pollStyles.question}>{poll.question}</Text>

      {/* Options */}
      {poll.options.map((option) => {
        const voted = poll.user_voted.includes(option.id);
        const pct =
          totalVotes > 0
            ? Math.round((option.vote_count / totalVotes) * 100)
            : 0;
        const canVote = !poll.is_closed && !isTeacher;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              pollStyles.option,
              voted && pollStyles.optionVoted,
              (poll.is_closed || isTeacher) && pollStyles.optionDisabled,
            ]}
            onPress={() => canVote && onVote(pollId, option.id)}
            activeOpacity={canVote ? 0.7 : 1}
          >
            {/* Progress fill */}
            <View
              style={[
                pollStyles.optionFill,
                { width: `${pct}%` as any },
                voted && pollStyles.optionFillVoted,
              ]}
            />
            <View style={pollStyles.optionContent}>
              <View style={pollStyles.optionLeft}>
                <View
                  style={[
                    pollStyles.optionCheckbox,
                    voted && pollStyles.optionCheckboxVoted,
                  ]}
                >
                  {voted && (
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color={COLORS.white}
                    />
                  )}
                </View>
                <Text
                  style={[
                    pollStyles.optionText,
                    voted && pollStyles.optionTextVoted,
                  ]}
                >
                  {option.option_text}
                </Text>
              </View>
              <Text style={pollStyles.optionPct}>{pct}%</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Footer */}
      <View style={pollStyles.footer}>
        <Text style={pollStyles.voteCount}>{totalVotes} votes</Text>
        {isTeacher && !poll.is_closed && (
          <TouchableOpacity onPress={() => onClose(pollId)}>
            <Text style={pollStyles.closeBtn}>Close Poll</Text>
          </TouchableOpacity>
        )}
        {/* Poll closed badge */}
        {poll.is_closed && (
          <View style={pollStyles.closedBadge}>
            <Text style={pollStyles.closedText}>Closed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const pollStyles = StyleSheet.create({
  loading: {
    padding: SPACING.md,
    alignItems: "center",
  },
  container: {
    gap: SPACING.sm,
    minWidth: 220,
  },
  closedBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
  },
  closedText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  question: {
    fontFamily: FONT_USAGE.subheading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    marginBottom: SPACING.xs,
  },
  option: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.dimBlue,
    backgroundColor: COLORS.white,
    overflow: "hidden",
    position: "relative",
  },
  optionVoted: {
    borderColor: COLORS.midBlue,
  },
  optionDisabled: {
    opacity: 0.9,
  },
  optionFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.dimBlue,
    borderRadius: BORDER_RADIUS.md,
  },
  optionFillVoted: {
    backgroundColor: "rgba(50,146,175,0.2)",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  optionCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  optionCheckboxVoted: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  optionText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
    flex: 1,
  },
  optionTextVoted: {
    fontFamily: FONT_USAGE.button,
    color: COLORS.darkBlue,
  },
  optionPct: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    minWidth: 32,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  voteCount: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
  closeBtn: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
  },
});

interface ContextMenuProps {
  visible: boolean;
  ctxMessage: ChatMessage | null;
  isTeacher: boolean;
  isSender: boolean;
  isPinned: boolean;
  onReply: () => void;
  onPin: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  ctxMessage,
  isTeacher,
  isSender,
  isPinned,
  onReply,
  onPin,
  onDelete,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
    }
  }, [visible]);
  if (!visible) return null;

  const items = [
    { icon: "reply", label: "Reply", action: onReply, color: COLORS.midBlue },
    ...(isTeacher && !ctxMessage?.poll_id
      ? [
          {
            icon: isPinned ? "pin-off" : "pin",
            label: isPinned ? "Unpin" : "Pin",
            action: onPin,
            color: COLORS.lightOrange,
          },
        ]
      : []),
    ...(isTeacher || isSender
      ? [
          {
            icon: "delete-outline",
            label: "Delete",
            action: onDelete,
            color: COLORS.error,
          },
        ]
      : []),
  ];

  return (
    <Pressable style={ctxStyles.overlay} onPress={onClose}>
      <Animated.View
        style={[
          ctxStyles.menu,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              ctxStyles.item,
              i < items.length - 1 && ctxStyles.itemBorder,
            ]}
            onPress={() => {
              onClose();
              item.action();
            }}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={item.color}
            />
            <Text style={[ctxStyles.itemText, { color: item.color }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Pressable>
  );
};

const ctxStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    minWidth: 180,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
  },
});

const CreatePollModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    question: string;
    options: string[];
    allow_multiple_answers: boolean;
  }) => void;
  isLoading: boolean;
}> = ({ visible, onClose, onSubmit, isLoading }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const updateOption = (i: number, val: string) => {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  };

  const removeOption = (i: number) => {
    if (options.length > 2)
      setOptions(options.filter((_, index) => index !== i));
  };

  const handleSubmit = () => {
    const filledOptions = options.filter((o) => o.trim().length > 0);
    if (question.trim().length < 5) {
      Alert.alert("Error", "Question must be at least 5 characters");
      return;
    }
    if (filledOptions.length < 2) {
      Alert.alert("Error", "At least 2 options required");
      return;
    }
    onSubmit({
      question: question.trim(),
      options: filledOptions,
      allow_multiple_answers: allowMultiple,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={pollModalStyles.overlay} onPress={onClose}>
        <Pressable
          style={pollModalStyles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView>
            <View style={pollModalStyles.header}>
              <Text style={pollModalStyles.title}>Create Poll</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={COLORS.midDarkBlue}
                />
              </TouchableOpacity>
            </View>

            <Input
              label="Question"
              labelStyle={{ color: COLORS.darkBlue }}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask something..."
              textStyle={{ color: COLORS.darkBlue }}
            />

            <Text style={pollModalStyles.optionsLabel}>Options</Text>
            {options.map((opt, i) => (
              <View key={i} style={pollModalStyles.optionRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={opt}
                    onChangeText={(v) => updateOption(i, v)}
                    placeholder={`Option ${i + 1}`}
                    textStyle={{ color: COLORS.darkBlue }}
                  />
                </View>
                {options.length > 2 && (
                  <TouchableOpacity
                    style={pollModalStyles.removeOption}
                    onPress={() => removeOption(i)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {options.length < 10 && (
              <TouchableOpacity
                style={pollModalStyles.addOption}
                onPress={addOption}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={COLORS.midBlue}
                />
                <Text style={pollModalStyles.addOptionText}>Add Option</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={pollModalStyles.multipleRow}
              onPress={() => setAllowMultiple(!allowMultiple)}
            >
              <View
                style={[
                  pollModalStyles.checkbox,
                  allowMultiple && pollModalStyles.checkboxActive,
                ]}
              >
                {allowMultiple && (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={COLORS.white}
                  />
                )}
              </View>
              <Text style={pollModalStyles.multipleText}>
                Allow multiple answers
              </Text>
            </TouchableOpacity>

            <Button
              title="Create Poll"
              variant="primary"
              size="large"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              onPress={handleSubmit}
              style={{ marginTop: SPACING.sm }}
            />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
const pollModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: COLORS.skinToneOrange,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: "90%",
    maxHeight: "85%",
    borderWidth: 3,
    borderColor: COLORS.midDarkBlue,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.midDarkBlue,
  },
  optionsLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  removeOption: {
    marginBottom: SPACING.lg,
  },
  addOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addOptionText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },
  multipleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  multipleText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
});
export default function GroupChatScreen() {
  //---------------Constants-----------

  const { user } = useAuth();
  const { groupId, groupName, skillIconUrl, creatorId } = useGroupContext();
  //For error handling
  const toast = useErrorToast();

  //Refs
  const flatListRef = useRef<FlatList>(null);
  const groupChatIdRef = useRef<string | null>(null);

  //messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  //Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  //polls
  const [pollsMap, setPollsMap] = useState<Record<string, PollDetail>>({});

  //input
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  //context menu
  const [ctxMessage, setCtxMessage] = useState<ChatMessage | null>(null);

  //modals
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);

  const tabBarHeight = useBottomTabBarHeight();

  const isTeacher = user?.id === creatorId;

  //---------------Hooks-----------
  useEffect(() => {
    initChat();
    return () => {
      if (groupChatIdRef.current) {
        getSocket()?.emit("leave-group-chat", groupChatIdRef.current);
      }
    };
  }, []);

  //---------------Functions-----------
  const initChat = async () => {
    try {
      const chatRes = await chatAPI.getGroupChat(groupId);
      if (!chatRes.success) return;
      const chatId: string = chatRes.data.id;
      groupChatIdRef.current = chatId;

      //Join socket room
      getSocket()?.emit("join-group-chat", chatId);

      //Load messages
      await loadMessages(chatId);

      //Setup socket listeneres
      setupSocketListeners(chatId);
    } catch {
      toast.showError("Failed to load chat");
      setIsLoading(false);
    }
  };

  const setupSocketListeners = (chatId: string) => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("new-message");
    socket.off("message-pinned");
    socket.off("message-unpinned");
    socket.off("message-deleted");
    socket.off("poll-updated");
    socket.off("poll-closed");

    socket.on("new-message", (payload: { type: string; data: any }) => {
      const msg = payload.data as ChatMessage;
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.message_type === "poll" && msg.poll_id) {
        fetchPoll(msg.poll_id);
      }
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });

    socket.on("message-deleted", ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on("message-pinned", ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: true } : m)),
      );
      setLatestPinned(messages.find((m) => m.id === messageId) || null);
      console.log(messages.find((m) => m.id == messageId));
    });

    socket.on("message-unpinned", ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_pinned: false } : m)),
      );
      setLatestPinned(null);
    });

    socket.on("poll-updated", ({ pollId }: { pollId: string }) => {
      fetchPoll(pollId);
    });

    socket.on("poll-closed", ({ pollId }: { pollId: string }) => {
      setPollsMap((prev) =>
        prev[pollId]
          ? { ...prev, [pollId]: { ...prev[pollId], is_closed: true } }
          : prev,
      );
    });
  };

  const loadMessages = async (chatId: string, before?: string) => {
    if (!before) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await chatAPI.getChatMessages(chatId, 50, before);
      if (res.success) {
        const newMsgs: ChatMessage[] = res.data;
        if (!before) {
          setMessages(newMsgs);
        } else {
          setMessages((prev) => [...newMsgs, ...prev]);
        }
        setHasMore(newMsgs.length === 50);

        //Batch fetch all polls
        const pollIds = newMsgs
          .filter((m) => m.message_type === "poll" && m.poll_id)
          .map((m) => m.poll_id as string);
        if (pollIds.length > 0) {
          await batchFetchPolls(pollIds);
        }
      }
    } catch {
      toast.showError("Failed to load messages");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const batchFetchPolls = async (pollIds: string[]) => {
    const results = await Promise.allSettled(
      pollIds.map((id) => chatAPI.getPollDetails(id)),
    );

    const updates: Record<string, PollDetail> = {};
    results.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value.success) {
        updates[pollIds[i]] = result.value.data;
      }
    });
    setPollsMap((prev) => ({ ...prev, ...updates }));
  };
  const fetchPoll = async (pollId: string) => {
    try {
      const res = await chatAPI.getPollDetails(pollId);
      console.log("The poll response is:", res.data);
      if (res.success) {
        setPollsMap((prev) => ({ ...prev, [pollId]: res.data }));
      }
    } catch {}
  };

  //actions
  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !groupChatIdRef.current) return;
    setIsSending(true);
    setMessageText("");
    const replyId = replyTo?.id;
    setReplyTo(null);
    try {
      await chatAPI.sendMessage(groupChatIdRef.current, {
        content: text,
        reply_to_message_id: replyId,
      });
    } catch {
      toast.showError("Failed to send message");
      setMessageText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    const poll = pollsMap[pollId];
    if (!poll) return;
    const alreadyVoted = poll.user_voted.includes(optionId);
    const newVotedIds = alreadyVoted
      ? poll.user_voted.filter((id) => id! === optionId)
      : poll.allow_multiple_answers
        ? [...poll.user_voted, optionId]
        : [optionId];

    //Optimistic update
    setPollsMap((prev) => ({
      ...prev,
      [pollId]: { ...prev[pollId], user_voted: newVotedIds },
    }));

    try {
      await chatAPI.votePoll(pollId, newVotedIds);
      fetchPoll(pollId);
    } catch {
      toast.showError("Failed to vote");
      fetchPoll(pollId);
    }
  };
  const handleClosePoll = async (pollId: string) => {
    try {
      await chatAPI.closePoll(pollId);
      fetchPoll(pollId);
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to close poll");
    }
  };

  const handlePin = async (message: ChatMessage) => {
    if (!message) return;
    try {
      if (message.is_pinned) {
        await chatAPI.unpinMessage(message.id);
        setLatestPinned(null);
      } else {
        await chatAPI.pinMessage(message.id);
        setLatestPinned(message);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed");
    }
  };

  const handleDelete = async (message: ChatMessage) => {
    Alert.alert("Delete Message", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (message.message_type === "poll" && message.poll_id) {
              await chatAPI.deletePoll(message.poll_id);
            } else {
              await chatAPI.deleteMessage(message.id);
            }
          } catch (error: any) {
            toast.showError(error.response?.data?.error || "Failed to delete");
          }
        },
      },
    ]);
  };

  const handleLoadPinned = async () => {
    if (!groupChatIdRef.current) return;
    try {
      const res = await chatAPI.getPinnedMessages(groupChatIdRef.current);
      if (res.success) setPinnedMessages(res.data);
      setShowPinnedModal(true);
    } catch {
      toast.showError("Failed to load pinned messages");
    }
  };

  const handleCreatePoll = async (data: {
    question: string;
    options: string[];
    allow_multiple_answers: boolean;
  }) => {
    if (!groupChatIdRef.current) return;
    setIsCreatingPoll(true);
    try {
      await chatAPI.createPoll(groupChatIdRef.current, data);
      setShowCreatePoll(false);
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to create poll");
    } finally {
      setIsCreatingPoll(false);
    }
  };

  const handleLoadMore = () => {
    if (
      !hasMore ||
      isLoadingMore ||
      messages.length === 0 ||
      !groupChatIdRef.current
    )
      return;
    loadMessages(groupChatIdRef.current, messages[0].created_at);
  };

  //helper functions
  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isMe = item.sender.id === user?.id;
      const displayName = item.sender.nick_name || item.sender.full_name;

      return (
        <Pressable
          onLongPress={() => setCtxMessage(item)}
          delayLongPress={350}
          style={[msgStyles.row, isMe ? msgStyles.rowMe : msgStyles.rowOther]}
        >
          {/* Avatar - other users only */}
          {!isMe && (
            <View style={msgStyles.avatarContainer}>
              {item.sender.profile_image_url ? (
                <Image
                  source={{ uri: item.sender.profile_image_url }}
                  style={msgStyles.avatar}
                />
              ) : (
                <View style={[msgStyles.avatar, msgStyles.avatarPlaceholder]}>
                  <Text style={msgStyles.avatarInitials}>
                    {getInitials(item.sender.full_name)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              msgStyles.bubbleWrapper,
              isMe ? msgStyles.bubbleWrapperMe : msgStyles.bubbleWrapperOther,
            ]}
          >
            {/* Sender name */}
            {!isMe && <Text style={msgStyles.senderName}> {displayName}</Text>}

            {/* Reply preview */}
            {item.reply_to && (
              <View
                style={[
                  msgStyles.replyPreview,
                  isMe ? msgStyles.replyPreviewMe : msgStyles.replyPreviewOther,
                ]}
              >
                <View style={msgStyles.replyBar} />
                <View>
                  <Text style={msgStyles.replyName}>
                    {item.reply_to.sender.nick_name ||
                      item.reply_to.sender.full_name}
                  </Text>
                  <Text style={msgStyles.replyContent} numberOfLines={1}>
                    {item.reply_to.content}
                  </Text>
                </View>
              </View>
            )}

            {/* Bubble */}
            <View
              style={[
                msgStyles.bubble,
                isMe ? msgStyles.bubbleMe : msgStyles.bubbleOther,
                item.message_type === "poll" && msgStyles.bubblePoll,
              ]}
            >
              {item.message_type === "poll" && item.poll_id ? (
                <PollBubble
                  pollId={item.poll_id}
                  pollsMap={pollsMap}
                  isTeacher={isTeacher}
                  onVote={handleVote}
                  onClose={handleClosePoll}
                />
              ) : (
                <Text
                  style={[
                    msgStyles.messageText,
                    isMe ? msgStyles.messageTextMe : msgStyles.messageTextOther,
                  ]}
                >
                  {item.content}
                </Text>
              )}
            </View>
            {/* Footer: time + pin indicator */}
            <View
              style={[
                msgStyles.footer,
                isMe ? msgStyles.footerMe : msgStyles.footerOther,
              ]}
            >
              {item.is_pinned && (
                <MaterialCommunityIcons
                  name="pin"
                  size={12}
                  color={COLORS.lightOrange}
                />
              )}
              <Text style={msgStyles.time}>{formatTime(item.created_at)}</Text>
            </View>
          </View>
        </Pressable>
      );
    },
    [pollsMap, isTeacher, user],
  );

  const [latestPinned, setLatestPinned] = useState<ChatMessage | null>(null);

  if (isLoading) {
    return <LoadingScreen variant="orange" />;
  }
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={skillIconUrl as any}
            size={28}
            color={COLORS.lightOrange}
          />
          <View>
            <Text style={styles.headerTitle}>{groupName}</Text>
            <Text style={styles.headerSubtitle}>Group Chat</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.pinnedBtn} onPress={handleLoadPinned}>
          <MaterialCommunityIcons
            name="pin"
            size={20}
            color={COLORS.lightOrange}
          />
        </TouchableOpacity>
      </View>

      {/* Pinned banned */}
      {latestPinned && (
        <TouchableOpacity
          style={styles.pinnedBanner}
          onPress={handleLoadPinned}
        >
          <MaterialCommunityIcons
            name="pin"
            size={14}
            color={COLORS.lightOrange}
          />
          <Text style={styles.pinnedBannerText} numberOfLines={1}>
            {latestPinned.content || "Pinned message"}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={COLORS.midBlack}
          />
        </TouchableOpacity>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onStartReachedThreshold={0.1}
          onStartReached={handleLoadMore}
          ListHeaderComponent={
            isLoading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.lightBlue}
                style={{ marginVertical: SPACING.md }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={60}
                color={COLORS.midDarkBlue}
              />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to say something!
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

        {/* Input area */}
        <View style={styles.inputArea}>
          {/* Reply preview */}
          {replyTo && (
            <View style={styles.replyPreviewBar}>
              <View style={styles.replyPreviewBarInner}>
                <MaterialCommunityIcons
                  name="reply"
                  size={16}
                  color={COLORS.midBlue}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyPreviewName}>
                    {replyTo.sender.nick_name || replyTo.sender.full_name}
                  </Text>
                  <Text style={styles.replyPreviewContent} numberOfLines={1}>
                    {replyTo.content}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <MaterialCommunityIcons
                  name="close"
                  size={18}
                  color={COLORS.midBlack}
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Poll button - teacher only */}
            {isTeacher && (
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => setShowCreatePoll(true)}
              >
                <MaterialCommunityIcons
                  name="poll"
                  size={22}
                  color={COLORS.midBlue}
                />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.lightBlack}
              multiline
              maxLength={5000}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!messageText.trim() || isSending) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={
                  !messageText.trim() || isSending
                    ? COLORS.lightBlack
                    : COLORS.white
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Context Menu */}
      <ContextMenu
        visible={!!ctxMessage}
        ctxMessage={ctxMessage}
        isTeacher={isTeacher}
        isSender={ctxMessage?.sender.id === user?.id}
        isPinned={ctxMessage?.is_pinned ?? false}
        onReply={() => {
          setReplyTo(ctxMessage);
          setCtxMessage(null);
        }}
        onPin={() => {
          handlePin(ctxMessage!);
          setCtxMessage(null);
        }}
        onDelete={() => {
          handleDelete(ctxMessage!);
          setCtxMessage(null);
        }}
        onClose={() => setCtxMessage(null)}
      />

      {/* Pinned messages modal */}
      <Modal
        visible={showPinnedModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPinnedModal(false)}
      >
        <Pressable
          style={pinnedStyles.overlay}
          onPress={() => setShowPinnedModal(false)}
        >
          <Pressable
            style={pinnedStyles.container}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={pinnedStyles.header}>
              <Text style={pinnedStyles.title}>Pinned Messages</Text>
              <TouchableOpacity onPress={() => setShowPinnedModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={COLORS.midDarkBlue}
                />
              </TouchableOpacity>
            </View>
            {pinnedMessages.length === 0 ? (
              <View style={pinnedStyles.empty}>
                <MaterialCommunityIcons
                  name="pin-off"
                  size={40}
                  color={COLORS.midBlack}
                />
                <Text style={pinnedStyles.emptyText}>No pinned messages</Text>
              </View>
            ) : (
              pinnedMessages.map((msg) => (
                <View key={msg.id} style={pinnedStyles.msgItem}>
                  <MaterialCommunityIcons
                    name="pin"
                    size={14}
                    color={COLORS.lightOrange}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={pinnedStyles.msgSender}>
                      {msg.sender.nick_name || msg.sender.full_name}
                    </Text>
                    <Text style={pinnedStyles.msgContent}>{msg.content}</Text>
                  </View>
                  <Text style={pinnedStyles.msgTime}>
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Create Poll modal */}
      <CreatePollModal
        visible={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        onSubmit={handleCreatePoll}
        isLoading={isCreatingPoll}
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
    backgroundColor: COLORS.midDarkBlue,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.darkBlue,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.midDarkBlue,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  pinnedBtn: {
    padding: SPACING.sm,
    backgroundColor: "rgba(231,111,81,0.1)",
    borderRadius: BORDER_RADIUS.round,
    borderColor: COLORS.lightOrange,
    borderWidth: 0.5,
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(231,111,81,0.1)",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(231,111,81,0.2)",
  },
  pinnedBannerText: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    padding: SPACING.md,
    gap: SPACING.xs,
    paddingBottom: SPACING.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.massive * 4,
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.lightBlack3,
  },
  emptySubtext: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightBlack,
  },
  inputArea: {
    backgroundColor: COLORS.darkBlue,
    borderTopWidth: 1,
    borderTopColor: COLORS.midDarkBlue,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  replyPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.midBlue,
  },
  replyPreviewBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    flex: 1,
  },
  replyPreviewName: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
  },
  replyPreviewContent: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightOrange,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

const msgStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 3,
    gap: SPACING.sm,
  },
  rowMe: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  avatarContainer: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.darkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlue,
  },
  bubbleWrapper: {
    maxWidth: "78%",
    gap: 3,
  },
  bubbleWrapperMe: {
    alignItems: "flex-end",
  },
  bubbleWrapperOther: {
    alignItems: "flex-start",
  },
  senderName: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightOrange,
    marginLeft: SPACING.sm,
  },
  replyPreview: {
    flexDirection: "row",
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 2,
  },
  replyPreviewMe: {
    backgroundColor: "rgba(231,111,81,0.15)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.lightOrange,
  },
  replyPreviewOther: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderLeftWidth: 3,
    borderLeftColor: COLORS.midBlue,
  },
  replyBar: {
    width: 0,
  },
  replyName: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
  },
  replyContent: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  bubble: {
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  bubbleMe: {
    backgroundColor: COLORS.lightOrange,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.darkBlue,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.midDarkBlue,
  },
  bubblePoll: {
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.dimBlue,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
  },
  messageTextMe: {
    fontFamily: FONT_USAGE.body,
    color: COLORS.white,
  },
  messageTextOther: {
    fontFamily: FONT_USAGE.body,
    color: COLORS.lightBlack3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerMe: { justifyContent: "flex-end" },
  footerOther: { justifyContent: "flex-start" },
  time: {
    fontFamily: FONT_USAGE.label,
    fontSize: 10,
    color: COLORS.lightBlack,
  },
});

const pinnedStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: COLORS.skinToneOrange,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    maxHeight: "60%",
    borderWidth: 2,
    borderColor: COLORS.midDarkBlue,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.midDarkBlue,
  },
  empty: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlack,
  },
  msgItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dimBlue,
  },
  msgSender: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  msgContent: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlack,
  },
  msgTime: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
  },
});
