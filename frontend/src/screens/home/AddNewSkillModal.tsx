import { Button } from "@/src/components/common/Button";
import { Input } from "@/src/components/common/Input";
import { Modal } from "@/src/components/common/Modal";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { useNavigation } from "@react-navigation/native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { skillsAPI } from "@/src/services/api";
import { ErrorToast } from "@/src/components/common/ErrorToast";

//We have 2 modes, one to create and one to browse
type Mode = "browse" | "create";

//For the skill
interface Skill {
  id: string;
  name: string;
  icon_url: string;
  is_default: boolean;
}

export default function AddNewSkillModal() {
  //---------------Constants-----------
  //For navigation
  const navigation = useNavigation();
  //For error handling
  const toast = useErrorToast();
  //To switch between the modes
  const [mode, setMode] = useState<Mode>("browse");

  // ── browse mode ─────────────────────────────────
  //To store all of the skills
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  //Filtered skills
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  //The search query
  const [searchQuery, setSearchQuery] = useState("");
  //For loading state
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  //Selected skill
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  //To show/hide confirm modal after selecting a skill
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── create mode ──────────────────────────────────
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillIcon, setNewSkillIcon] = useState("star");
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);

  // ── shared (role + level) ────────────────────────
  const [skillRole, setSkillRole] = useState<"teacher" | "learner" | "">("");
  const [level, setLevel] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //---------------Hooks-----------

  //Load all of the skills in the beginning
  useEffect(() => {
    loadAllSkills();
  }, []);

  //For the searching functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSkills(allSkills);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredSkills(
        allSkills.filter((s) => s.name.toLowerCase().includes(q)),
      );
    }
  }, [searchQuery, allSkills]);

  //---------------Functions-----------
  //Load all of the skills from the backend
  const loadAllSkills = async () => {
    setIsLoadingSkills(true);
    try {
      const response = await skillsAPI.getAllSkillsIncludingCustom();
      if (response.success) {
        setAllSkills(response.data);
        setFilteredSkills(response.data);
      }
    } catch {
      toast.showError("Failed to load skills");
    } finally {
      setIsLoadingSkills(false);
    }
  };

  //Reset the selected role and level
  const resetShared = () => {
    setSkillRole("");
    setLevel(0);
  };

  const resetAll = () => {
    setMode("browse");
    setSearchQuery("");
    setSelectedSkill(null);
    setShowConfirmModal(false);
    setNewSkillName("");
    setNewSkillIcon("star");
    resetShared();
  };

  //To set the selected skill
  const handleSkillPress = (skill: Skill) => {
    setSelectedSkill(skill);
    resetShared();
    setShowConfirmModal(true);
  };

  //Add a skill from the already created ones
  const handleConfirmAdd = async () => {
    if (!selectedSkill) return;
    if (!skillRole) {
      toast.showError("Please select a role");
      return;
    }
    // if (!level) {
    //   toast.showError("Please select a proficiency level");
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const response = await skillsAPI.addSkillToProfile({
        skill_id: selectedSkill.id,
        role: skillRole,
        is_default: selectedSkill.is_default,
        proficiency_level: level,
      });
      if (response.success) {
        toast.showSuccess(`${selectedSkill.name} added to your profile!`);
        setShowConfirmModal(false);
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to add skill");
    } finally {
      setIsSubmitting(false);
    }
  };
  //Create a new skill
  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      toast.showError("Please enter a skill name");
      return;
    }
    if (!skillRole) {
      toast.showError("Please select a role");
      return;
    }
    if (!level) {
      toast.showError("Please select a proficiency level");
      return;
    }

    setIsCreatingSkill(true);
    try {
      const createRes = await skillsAPI.createCustomSkill({
        name: newSkillName.trim(),
        icon_url: newSkillIcon,
      });

      const addRes = await skillsAPI.addSkillToProfile({
        skill_id: createRes.data.id,
        role: skillRole,
        is_default: createRes.data.is_default,
        proficiency_level: level,
      });

      if (addRes.success) {
        toast.showSuccess("Skill created and added to your profile!");
        setTimeout(() => navigation.goBack(), 1000);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to create skill");
    } finally {
      setIsCreatingSkill(false);
    }
  };
  //Show the role and proficiency level after selecting a skill
  const renderRoleAndLevel = () => (
    <>
      {/* Role */}
      <Text style={styles.sectionLabel}>Choose Role</Text>
      <View style={styles.roleContainer}>
        {(["teacher", "learner"] as const).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setSkillRole(r)}
            style={[
              styles.role,
              skillRole === r && {
                backgroundColor: COLORS.midBlue,
                borderColor: COLORS.darkBlue,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={r === "teacher" ? "human-male-board" : "school"}
              size={18}
              color={skillRole === r ? COLORS.white : COLORS.midBlue}
            />
            <Text
              style={[
                styles.roleText,
                skillRole === r && { color: COLORS.white },
              ]}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Proficiency */}
      {!selectedSkill?.is_default && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: SPACING.md }]}>
            Proficiency Level
          </Text>
          <View style={styles.levelRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setLevel(num)}
                style={[
                  styles.numberContainer,
                  level !== num && {
                    borderColor: COLORS.lightOrange,
                    backgroundColor: COLORS.skinToneOrange,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.number,
                    level !== num && { color: COLORS.midBlue },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </>
  );
  //For browse mode
  const renderBrowseMode = () => (
    <>
      {/* Search */}
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search skills..."
        textStyle={{ color: COLORS.darkBlue }}
        leftIcon={
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={COLORS.midBlack}
          />
        }
      />

      {/* Skills list */}
      {isLoadingSkills ? (
        <ActivityIndicator
          size="large"
          color={COLORS.midBlue}
          style={{ marginVertical: SPACING.xl }}
        />
      ) : filteredSkills.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="magnify-close"
            size={40}
            color={COLORS.dimBlue}
          />
          <Text style={styles.emptyText}>No skills found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.skillsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {filteredSkills.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={styles.skillRow}
              onPress={() => handleSkillPress(skill)}
              activeOpacity={0.7}
            >
              <View style={styles.skillIconBg}>
                <MaterialCommunityIcons
                  name={skill.icon_url as any}
                  size={24}
                  color={COLORS.midBlue}
                />
              </View>
              <Text style={styles.skillRowName}>{skill.name}</Text>
              <View style={styles.skillBadge}>
                <Text style={styles.skillBadgeText}>
                  {skill.is_default ? "Default" : "Custom"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={COLORS.midBlack}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Switch to create */}
      <TouchableOpacity
        style={styles.switchModeBtn}
        onPress={() => {
          resetShared();
          setMode("create");
        }}
      >
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={18}
          color={COLORS.lightOrange}
        />
        <Text style={styles.switchModeText}>
          Can't find your skill? Create one
        </Text>
      </TouchableOpacity>
    </>
  );
  const renderCreateMode = () => (
    <>
      <TouchableOpacity
        style={styles.backToBrowse}
        onPress={() => {
          resetShared();
          setMode("browse");
        }}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={18}
          color={COLORS.midBlue}
        />
        <Text style={styles.backToBrowseText}>Back to skill list</Text>
      </TouchableOpacity>

      <Input
        label="Skill Name"
        labelStyle={styles.sectionLabel}
        value={newSkillName}
        onChangeText={setNewSkillName}
        placeholder="e.g., Pottery"
        textStyle={{ color: COLORS.darkBlue }}
      />
      <Input
        label="Icon (MaterialCommunityIcons name)"
        labelStyle={styles.sectionLabel}
        value={newSkillIcon}
        onChangeText={setNewSkillIcon}
        placeholder="star"
        textStyle={{ color: COLORS.darkBlue }}
        autoCapitalize="none"
        rightIcon={
          <MaterialCommunityIcons
            name={newSkillIcon as any}
            size={24}
            color={COLORS.midBlue}
          />
        }
      />

      {renderRoleAndLevel()}

      <Button
        title="Create & Add Skill"
        onPress={handleCreateSkill}
        loading={isCreatingSkill}
        disabled={isCreatingSkill}
        variant="primary"
        size="large"
        style={styles.submitBtn}
      />
    </>
  );
  return (
    <Modal
      visible={true}
      title={mode === "browse" ? "Add a Skill" : "Create New Skill"}
      showCloseButton
      size="large"
      onClose={() => navigation.goBack()}
    >
      <View style={styles.modalContent}>
        {mode === "browse" ? renderBrowseMode() : renderCreateMode()}
      </View>

      {/* Confirmation modal */}
      {selectedSkill && (
        <Modal
          visible={showConfirmModal}
          title={selectedSkill.name}
          showCloseButton
          size="medium"
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedSkill(null);
            resetShared();
          }}
        >
          <View style={styles.confirmContent}>
            <View style={styles.confirmIconBg}>
              <MaterialCommunityIcons
                name={selectedSkill.icon_url as any}
                size={50}
                color={COLORS.midBlue}
              />
            </View>
            <Text style={styles.confirmSkillName}>{selectedSkill.name}</Text>
            {renderRoleAndLevel()}
            <Button
              title="Confirm & Add"
              variant="primary"
              size="large"
              fullWidth
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleConfirmAdd}
              style={styles.submitBtn}
            />
          </View>
        </Modal>
      )}

      <ErrorToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={toast.hideToast}
      />
    </Modal>
  );
}
const styles = StyleSheet.create({
  modalContent: { gap: SPACING.sm },

  // skill list
  skillsList: { maxHeight: 280 },
  skillRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dimBlue,
    gap: SPACING.md,
  },
  skillIconBg: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  skillRowName: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
  },
  skillBadge: {
    backgroundColor: COLORS.skinToneOrange,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  skillBadgeText: {
    fontFamily: FONT_USAGE.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.midBlack,
  },

  // switch / back
  switchModeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.dimBlue,
    marginTop: SPACING.sm,
  },
  switchModeText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.lightOrange,
  },
  backToBrowse: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backToBrowseText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
    color: COLORS.midBlue,
  },

  // role selector
  sectionLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.md,
  },
  roleContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  role: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.lightOrange,
    borderWidth: 1.5,
  },
  roleText: {
    color: COLORS.midBlue,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
  },

  // level selector
  levelRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  numberContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderColor: COLORS.darkBlue,
    borderWidth: 2,
    backgroundColor: COLORS.midBlue,
  },
  number: {
    color: COLORS.skinToneOrange,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
  },

  // confirm modal
  confirmContent: { alignItems: "center", gap: SPACING.md },
  confirmIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.dimBlue,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  confirmSkillName: {
    fontFamily: FONT_USAGE.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.darkBlue,
    marginBottom: SPACING.sm,
  },

  submitBtn: { marginTop: SPACING.md, width: "100%" },
});
