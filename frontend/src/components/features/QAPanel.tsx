import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { qaAPI } from "@/src/services/api";
import { GradientBackground } from "../common/GradientBackground";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

//interface for the message
interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

//interface for the Panel
interface QAPanelProps {
  visible: boolean;
  groupId: number;
  onClose: () => void;
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const SUGGESTIONS = [
  "What was covered in the last session?",
  "Explain the main concepts",
  "Summarize the uploaded materials",
];

const AnimatedBubble: React.FC<{
  message: QAMessage;
  isGrouped: boolean;
}> = ({ message, isGrouped }) => {
  const isUser = message.role === "user";
  const slideAnim = useRef(new Animated.Value(isUser ? 40 : -40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAI,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
        isGrouped && { marginBottom: 2 },
      ]}
    >
      {/* AI avatar - hidden if grouped */}
      {!isUser && (
        <View style={[styles.aiAvatar, isGrouped && styles.aiAvatarHidden]}>
          {!isGrouped && (
            <MaterialCommunityIcons
              name="robot-happy"
              size={18}
              color={COLORS.lightOrange}
            />
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          isGrouped && isUser && styles.bubbleUserGrouped,
          isGrouped && !isUser && styles.bubbleAIGrouped,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.messageTextUser : styles.messageTextAI,
          ]}
        >
          {message.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isUser ? styles.messageTimeUser : styles.messageTimeAI,
          ]}
        >
          {formatTime(message.created_at)}
        </Text>
      </View>
    </Animated.View>
  );
};

const ThinkingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    //Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    //Staggered pulsing dots
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(700 - delay),
        ]),
      ).start();

    animateDot(dot1, 0);
    animateDot(dot2, 180);
    animateDot(dot3, 360);
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        styles.messageRowAI,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={styles.aiAvatar}>
        <MaterialCommunityIcons
          name="robot-happy"
          size={18}
          color={COLORS.lightOrange}
        />
      </View>
      <View
        style={[styles.messageBubble, styles.bubbleAI, styles.thinkingBubble]}
      >
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
        <Text style={styles.thinkingLabel}>Searching session materials...</Text>
      </View>
    </Animated.View>
  );
};

const SendButton: React.FC<{
  onPress: () => void;
  disabled: boolean;
}> = ({ onPress, disabled }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.sendBtn,
          disabled && styles.sendBtnDisabled,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <MaterialCommunityIcons
          name="send"
          size={20}
          color={disabled ? COLORS.lightBlack : COLORS.white}
        />
      </Animated.View>
    </Pressable>
  );
};

const WelcomeScreen: React.FC<{ onSuggestion: (text: string) => void }> = ({
  onSuggestion,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const chipAnims = useRef(
    SUGGESTIONS.map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(20),
    })),
  ).current;

  useEffect(() => {
    //Icon + title entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    //Staggered chip entrance
    chipAnims.forEach(({ fade, slide }, i) => {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 400,
          delay: 300 + i * 120,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          tension: 80,
          friction: 10,
          delay: 300 + i * 120,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.welcomeContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.welcomeIconRing}>
        <View style={styles.welcomeIconBg}>
          <MaterialCommunityIcons
            name="robot-happy"
            size={50}
            color={COLORS.lightOrange}
          />
        </View>
      </View>
      <Text style={styles.welcomeTitle}>Q&A Assistant</Text>
      <Text style={styles.welcomeText}>
        I'm trained on all session materials uploaded by your teacher. Ask me
        anything about topics covered in your sessions.
      </Text>
      <View style={styles.welcomeSuggestions}>
        {SUGGESTIONS.map((s, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: chipAnims[i].fade,
              transform: [{ translateY: chipAnims[i].slide }],
            }}
          >
            <TouchableOpacity
              style={styles.suggestionChip}
              onPress={() => onSuggestion(s)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={15}
                color={COLORS.lightOrange}
              />
              <Text style={styles.suggestionText}>{s}</Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color={COLORS.midBlue}
              />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

export const QAPanel: React.FC<QAPanelProps> = ({
  visible,
  groupId,
  onClose,
}) => {
  //---------------Constants-----------
  //For scrolling
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollViewHeighRef = useRef(0);

  //For storing the messages
  const [messages, setMessages] = useState<QAMessage[]>([]);
  //For storing the question
  const [question, setQuestion] = useState("");
  //For loading state
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  //For Thinking state
  const [isThinking, setIsThinking] = useState(false);
  //To show scroll button
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollBtnAnim = useRef(new Animated.Value(0)).current;

  //---------------Hooks-----------
  useEffect(() => {
    if (visible) loadHistory();
    else {
      setMessages([]);
      setQuestion("");
    }
  }, [visible]);

  useEffect(() => {
    const isAtBottom =
      scrollOffsetRef.current + scrollViewHeighRef.current >=
      contentHeightRef.current - 60;
    if (messages.length > 0 && isAtBottom) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages, isThinking]);

  useEffect(() => {
    Animated.timing(scrollBtnAnim, {
      toValue: showScrollBtn ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    });
  }, [showScrollBtn]);

  //---------------Functions-----------
  //Load history of messages
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await qaAPI.getHistory(groupId);
      if (response.success) setMessages(response.data || []);
    } catch {
      console.error("Failed to load Q&A history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  //hadnle Suggestion click
  const handleSuggestion = (text: string) => {
    setQuestion(text);
    //Auto-send after brief delay so user sees it
    setTimeout(() => handleSend(text), 150);
  };

  //handle sending a question
  const handleSend = async (overrideText?: string) => {
    const trimmed = (overrideText ?? question).trim();
    if (!trimmed || isThinking) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: QAMessage = {
      id: tempId,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setQuestion("");
    setIsThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

    try {
      const response = await qaAPI.askQuestion(groupId, trimmed);
      if (response.success) {
        const aiMsg: QAMessage = {
          id: response.data.messageId || `ai-${Date.now()}`,
          role: "assistant",
          content: response.data.answer,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to get answer",
      );
    } finally {
      setIsThinking(false);
    }
  };

  //Handle clearing the conversation messages
  const handleClear = () => {
    Alert.alert(
      "Clear Conversation",
      "Permanently delete your entire Q&A history for this group?",
      [
        { text: "Cance", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await qaAPI.clearConversation(groupId);
              setMessages([]);
            } catch {
              Alert.alert("Error", "Failed to clear conversation");
            }
          },
        },
      ],
    );
  };

  //Handle scrolling
  const handleScroll = (e: any) => {
    const offset = e.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offset;
    const distFromBottom =
      contentHeightRef.current - offset - scrollViewHeighRef.current;
    setShowScrollBtn(distFromBottom > 120);
  };

  //Determine if consecutive message is grouped
  const isGrouped = (index: number): boolean => {
    if (index === 0) return false;
    return messages[index].role === messages[index - 1].role;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GradientBackground variant="midBlueToLightOrange" style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={["rgba(47,102,144,0.95)", "rgba(47,102,144,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerLeft}>
              <View style={styles.headerIconRing}>
                <MaterialCommunityIcons
                  name="robot-happy-outline"
                  size={24}
                  color={COLORS.lightOrange}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Q&A Assistant</Text>
                <View style={styles.headerStatusRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.headerSubtitle}>
                    Powered by session materials
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              {messages.length > 0 && (
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={handleClear}
                >
                  <MaterialCommunityIcons
                    name="delete-sweep-outline"
                    size={22}
                    color={COLORS.lightBlack3}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={COLORS.lightBlack3}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Body */}
          <KeyboardAvoidingView
            style={styles.body}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            {isLoadingHistory ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.lightOrange} />
                <Text style={styles.loadingText}>Loading conversation...</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView
                  ref={scrollRef}
                  style={styles.messagesContainer}
                  contentContainerStyle={[
                    styles.messagesContent,
                    messages.length === 0 && {
                      flex: 1,
                      justifyContent: "center",
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  onContentSizeChange={(_, h) => {
                    contentHeightRef.current = h;
                  }}
                  onLayout={(e) => {
                    scrollViewHeighRef.current = e.nativeEvent.layout.height;
                  }}
                >
                  {messages.length === 0 ? (
                    <WelcomeScreen onSuggestion={handleSuggestion} />
                  ) : (
                    <>
                      {messages.map((msg, index) => (
                        <AnimatedBubble
                          key={msg.id}
                          message={msg}
                          isGrouped={isGrouped(index)}
                        />
                      ))}
                      {isThinking && <ThinkingIndicator />}
                    </>
                  )}
                </ScrollView>

                {/* Scroll to bottom button */}
                <Animated.View
                  style={[
                    styles.scrollBottomBtn,
                    {
                      opacity: scrollBtnAnim,
                      transform: [
                        {
                          translateY: scrollBtnAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                  pointerEvents={showScrollBtn ? "auto" : "none"}
                >
                  <TouchableOpacity
                    style={styles.scrollBottomBtnInner}
                    onPress={() =>
                      scrollRef.current?.scrollToEnd({ animated: true })
                    }
                  >
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={20}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            {/* Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={["rgba(47,102,144,0.95)", "rgba(47,102,144,0.85)"]}
                style={styles.inputContainer}
              >
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={question}
                    onChangeText={setQuestion}
                    placeholder="Ask about session materials..."
                    placeholderTextColor={COLORS.lightBlack}
                    multiline
                    maxLength={1000}
                    returnKeyType="default"
                    onSubmitEditing={() => handleSend()}
                  />
                  <SendButton
                    onPress={() => handleSend()}
                    disabled={!question.trim() || isThinking}
                  />
                </View>
                <Text style={styles.inputHint}>
                  RAG-based AI • Searches across all session artifacts
                </Text>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GradientBackground>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  //header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  headerIconRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.lightOrange,
  },
  headerTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  headerSubtitle: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightBlack3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },

  //messages
  messagesContainer: { flex: 1 },
  messagesContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },

  //welcome
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  welcomeIconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(231,111,81,0.5)",
  },
  welcomeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.white,
    textAlign: "center",
  },
  welcomeText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
  },
  welcomeSuggestions: {
    width: "100%",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(231,111,81,0.4)",
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  suggestionText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.85)",
    flex: 1,
  },
  //message bubbles
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAI: {
    justifyContent: "flex-start",
  },

  //avatar
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(47,102,144,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightOrange,
    flexShrink: 0,
  },
  aiAvatarHidden: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },

  //bubbles
  messageBubble: {
    maxWidth: "76%",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: COLORS.lightOrange,
    borderBottomRightRadius: 4,
  },
  bubbleUserGrouped: {
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  bubbleAI: {
    backgroundColor: "rgba(47,102,144,0.85)",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  bubbleAIGrouped: {
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    lineHeight: 22,
  },
  messageTextUser: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
  },
  messageTextAI: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: "rgba(255,255,255,0.9)",
  },
  messageTime: {
    fontFamily: FONT_USAGE.label,
    fontSize: 10,
  },
  messageTimeUser: {
    color: "rgba(255,255,255,0.55)",
    textAlign: "right",
  },
  messageTimeAI: {
    color: "rgba(255,255,255,0.4)",
  },

  //thinking
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightOrange,
  },
  thinkingLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
    flex: 1,
  },

  //scroll to bottom
  scrollBottomBtn: {
    position: "absolute",
    bottom: SPACING.lg,
    alignSelf: "center",
    zIndex: 10,
  },
  scrollBottomBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightOrange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  //input
  inputWrapper: {},
  inputContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  textInput: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
  },

  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightOrange,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    shadowColor: COLORS.lightOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowOpacity: 0,
    elevation: 0,
  },

  inputHint: {
    fontFamily: FONT_USAGE.label,
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },
});
