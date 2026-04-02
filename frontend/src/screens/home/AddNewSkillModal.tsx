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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { skillsAPI } from "@/src/services/api";
import { ErrorToast } from "@/src/components/common/ErrorToast";

interface User_Skill {
  skill_id: Number;
  role: string;
  is_default: boolean;
  proficiency_level: Number;
}
export default function AddNewSkillModal() {
  //---------------Constants-----------
  //For navigation
  const navigation = useNavigation();
  //New skill's Name
  const [newSkillName, setNewSkillName] = useState("");
  //New skill's Icon
  const [newSkillIcon, setNewSkillIcon] = useState("star");
  //New skill proficiency level
  const [level, setLevel] = useState<Number>(0);
  //New skill role
  const [skillRole, setSkillRole] = useState<string>("");
  //For Error handling
  const toast = useErrorToast();
  //For Loading State
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);

  //---------------Functions-----------
  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      toast.showError("Please enter a skill name");
      return;
    }
    setIsCreatingSkill(true);
    try {
      const response = await skillsAPI.createCustomSkill({
        name: newSkillName,
        icon_url: newSkillIcon,
      });

      const userSkill: User_Skill = {
        skill_id: response.data.id,
        role: skillRole,
        is_default: response.data.is_default,
        proficiency_level: level,
      };
      console.log(userSkill);

      const response2 = await skillsAPI.addSkillToProfile(userSkill);

      if (response2.success) {
        toast.showSuccess("Skill created successfully!");
        //Reset fields
        setNewSkillName("");
        setNewSkillIcon("star");
        setLevel(0);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to create skill");
    } finally {
      setIsCreatingSkill(false);
    }
  };
  return (
    <Modal
      visible={true}
      title="Add New Skill"
      showCloseButton={true}
      size="large"
      onClose={() => {
        navigation.goBack();
      }}
    >
      <View style={styles.modalContent}>
        <Input
          label="Skill Name"
          labelStyle={styles.modalLabel}
          value={newSkillName}
          onChangeText={setNewSkillName}
          placeholder="e.g., Pottery"
          textStyle={{ color: COLORS.darkBlue }}
        />
        <Input
          value={newSkillIcon}
          label="Icon"
          labelStyle={styles.modalLabel}
          onChangeText={setNewSkillIcon}
          placeholder="star"
          textStyle={{ color: COLORS.darkBlue }}
          rightIcon={
            <MaterialCommunityIcons
              name={newSkillIcon as any}
              size={24}
              color={COLORS.midBlue}
              onError={() => {}}
            />
          }
          autoCapitalize={"none"}
        />

        <View style={{ marginBottom: SPACING.lg }}>
          <Text
            style={[
              { textAlign: "left", marginLeft: SPACING.md },
              styles.modalLabel,
            ]}
          >
            Choose role
          </Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setSkillRole("teacher")}
              style={[
                styles.role,
                skillRole == "teacher" && {
                  backgroundColor: COLORS.midBlue,
                  borderColor: COLORS.darkBlue,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  skillRole == "teacher" && { color: COLORS.skinToneOrange },
                ]}
              >
                Teacher
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSkillRole("learner")}
              style={[
                styles.role,
                skillRole == "learner" && {
                  borderColor: COLORS.darkBlue,
                  backgroundColor: COLORS.midBlue,
                },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  skillRole == "learner" && { color: COLORS.skinToneOrange },
                ]}
              >
                Learner
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text
            style={[
              { textAlign: "left", marginLeft: SPACING.md },
              styles.modalLabel,
            ]}
          >
            Choose Proficiency Level
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setLevel(num)}
                style={[
                  styles.numberContainer,
                  level != num && {
                    borderColor: COLORS.lightOrange,
                    backgroundColor: COLORS.skinToneOrange,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.number,
                    level != num && { color: COLORS.midBlue },
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="Create Skill"
          onPress={handleCreateSkill}
          loading={isCreatingSkill}
          disabled={isCreatingSkill}
          variant="primary"
          style={styles.createButton}
        />
      </View>
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
  modalContent: {
    gap: SPACING.xs,
  },
  modalLabel: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.darkBlue,
    marginBottom: SPACING.xs,
  },
  numberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: COLORS.darkBlue,
    borderWidth: 2,
    backgroundColor: COLORS.midBlue,
    marginTop: 5,
  },
  number: {
    color: COLORS.skinToneOrange,
  },

  createButton: {
    marginTop: SPACING.md,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 10,
    alignItems: "center",
    width: "80%",
    marginInline: "auto",
  },
  role: {
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.lightOrange,
    flex: 1,
    borderWidth: 1.5,
  },
  roleText: {
    color: COLORS.midBlue,
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.sm,
  },
});
