import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  COLORS,
  FONT_USAGE,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
} from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { ErrorToast } from "@/src/components/common/ErrorToast";
import { Header } from "@/src/components/navigation/NavHeader";
import { userAPI } from "@/src/services/api";
import { RootStackParamList } from "@/src/navigation/types";

interface UserSettings {
  allow_notifications: boolean;
  show_skills: boolean;
  allow_friend_requests: boolean;
  auto_accept_group_invites: boolean;
}

type ExpandedSections = {
  notifications: boolean;
  showSkills: boolean;
  friendRequests: boolean;
  autoAccept: boolean;
  about: boolean;
};

export default function SettingsScreen() {
  //---------------Constants-----------
  const { user, signOut } = useAuth();
  const toast = useErrorToast();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [settings, setSettings] = useState<UserSettings>({
    allow_notifications: true,
    show_skills: true,
    allow_friend_requests: true,
    auto_accept_group_invites: true,
  });

  const [expanded, setExpanded] = useState<ExpandedSections>({
    notifications: false,
    showSkills: false,
    friendRequests: false,
    autoAccept: false,
    about: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  //---------------Hooks-----------
  useEffect(() => {
    loadSettings();
  }, []);

  //---------------Functions-----------
  //1-loadSettings: Fetch settings from backend
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await userAPI.getUserSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error: any) {
      toast.showError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  //2-handleToggle: Update a setting on the backend and locally
  const handleToggle = async (option: keyof UserSettings) => {
    const newValue = !settings[option];
    setSettings((prev) => ({ ...prev, [option]: newValue }));
    try {
      await userAPI.updateSettings(option, newValue);
    } catch (error: any) {
      // Revert on failure
      setSettings((prev) => ({ ...prev, [option]: !newValue }));
      toast.showError("Failed to update setting");
    }
  };

  //3-toggleSection: Expand/collapse a preference row
  const toggleSection = (key: keyof ExpandedSections) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  //4-handleChangePassword: Navigate to change password screen
  const handleChangePassword = () => {
    // navigation.navigate("ChangePassword");
  };

  //5-handleDeleteAccount: Confirm then delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await userAPI.deleteUserAccount();
              signOut();
            } catch (error: any) {
              toast.showError("Failed to delete account");
            }
          },
        },
      ],
    );
  };

  //6-handleSignOut: Sign the user out
  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  //renderToggleRow: A toggle control for a preference
  const renderToggleRow = (option: keyof UserSettings) => (
    <View style={styles.toggleRow}>
      <Switch
        value={settings[option]}
        onValueChange={() => handleToggle(option)}
        trackColor={{
          false: COLORS.skinToneOrange2,
          true: COLORS.midBlue,
        }}
        thumbColor={COLORS.white}
        ios_backgroundColor={COLORS.skinToneOrange2}
      />
    </View>
  );

  //renderPreferenceRow: An expandable row with a toggle inside
  const renderPreferenceRow = (
    label: string,
    expandKey: keyof ExpandedSections,
    toggleOption: keyof UserSettings,
    isLast: boolean = false,
  ) => (
    <View style={[styles.settingRow, isLast && styles.noBorder]}>
      <TouchableOpacity
        style={styles.settingHeader}
        onPress={() => toggleSection(expandKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.settingLabel}>{label}</Text>
        <MaterialCommunityIcons
          name={expanded[expandKey] ? "chevron-up" : "chevron-down"}
          size={20}
          color={COLORS.midBlue}
        />
      </TouchableOpacity>
      {expanded[expandKey] && renderToggleRow(toggleOption)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Settings" handleOnPress={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Preferences Section ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Preferences</Text>

          {renderPreferenceRow(
            "Allow notifications",
            "notifications",
            "allow_notifications",
          )}
          {renderPreferenceRow(
            "Show skills on profile",
            "showSkills",
            "show_skills",
          )}
          {renderPreferenceRow(
            "Allow friend requests",
            "friendRequests",
            "allow_friend_requests",
          )}
          {renderPreferenceRow(
            "Auto accept group invites",
            "autoAccept",
            "auto_accept_group_invites",
            true,
          )}
        </View>

        {/* ── Account & Settings Section ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Account & Settings</Text>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingHeader}>
              <Text style={styles.settingLabel}>Change password</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={COLORS.skinToneOrange2}
              />
            </View>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={styles.settingHeader}>
              <Text style={[styles.settingLabel, styles.dangerLabel]}>
                Delete Account
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={COLORS.skinToneOrange2}
              />
            </View>
          </TouchableOpacity>

          {/* About SkillSwap */}
          <View style={[styles.settingRow, styles.noBorder]}>
            <TouchableOpacity
              style={styles.settingHeader}
              onPress={() => toggleSection("about")}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>About SkillSwap</Text>
              <MaterialCommunityIcons
                name={expanded.about ? "chevron-up" : "chevron-down"}
                size={20}
                color={COLORS.midBlue}
              />
            </TouchableOpacity>
            {expanded.about && (
              <Text style={styles.aboutText}>
                SkillSwap is a peer-to-peer learning platform focused on social,
                skill-based collaboration. It supports structured sessions and
                progress tracking within small groups.
              </Text>
            )}
          </View>
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
    backgroundColor: COLORS.darkGray,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  sectionLabel: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xl,
    color: COLORS.midBlack,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    letterSpacing: 0.4,
  },
  card: {
    marginTop: SPACING.xxxl,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
    paddingHorizontal: SPACING.xs,
  },
  settingRow: {
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.darkGray,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  settingLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    flex: 1,
  },
  dangerLabel: {
    color: COLORS.lightOrange,
  },
  toggleRow: {
    paddingBottom: SPACING.md,
    alignItems: "flex-end",
  },
  aboutText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlack,
    lineHeight: 18,
    paddingBottom: SPACING.md,
  },
  signOutBtn: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xxxl,
    backgroundColor: COLORS.lightOrange,
    borderRadius: BORDER_RADIUS.round,
    paddingVertical: SPACING.md,
    alignItems: "center",
    width: "50%",
    marginInline: "auto",
  },
  signOutText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
