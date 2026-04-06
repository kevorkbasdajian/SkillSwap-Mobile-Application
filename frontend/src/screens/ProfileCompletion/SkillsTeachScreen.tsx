import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_USAGE,
  SPACING,
} from "@/src/constants";
import { ProfileCompletionParamList } from "@/src/navigation/types";
import { skillsAPI } from "@/src/services/api";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "@/src/components/common/Button";
import { Header } from "@/src/components/navigation/NavHeader";
import { Modal } from "@/src/components/common/Modal";
import { Input } from "@/src/components/common/Input";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useErrorToast } from "@/src/hooks/useErrorToast";
import { ErrorToast } from "@/src/components/common/ErrorToast";

//Type for the navigation prop
type SkillsTeachNavigationProp = NativeStackNavigationProp<
  ProfileCompletionParamList,
  "SkillsTeach"
>;
//Type for the route prop
type SkillsTeachRouteProp = RouteProp<
  ProfileCompletionParamList,
  "SkillsTeach"
>;

//Interface for the skills
interface Skill {
  id: number;
  name: string;
  icon_url: string;
  is_default: boolean;
  created_at: Date;
  proficiency_level?: Number;
}

export default function SkillsTeachScreen() {
  //---------------Constants-----------
  //Navigation and route constants, one to navigate and the other to extract props send to this route from the previous page
  const navigation = useNavigation<SkillsTeachNavigationProp>();
  const route = useRoute<SkillsTeachRouteProp>();

  //To store all of the backend  skills
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  //User's Selected Skills
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  //New skill's Name
  const [newSkillName, setNewSkillName] = useState("");
  //New skill's Icon
  const [newSkillIcon, setNewSkillIcon] = useState("star");
  //New skill proficiency level
  const [level, setLevel] = useState<Number | null>();

  //To store error message if fetching all skills from backend fails
  //For loading state
  const [isLoading, setIsLoading] = useState(true);
  //For the Create Custom Skill Modal
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  //For loading state when registering custom skill
  const [isCreatingSkill, setIsCreatingSkill] = useState(false);
  //This hook is for the error message
  const toast = useErrorToast();

  //---------------Hooks-----------
  useEffect(() => {
    loadSkills();
  }, []);

  //---------------Functions-----------
  //loadSkills(): fetches default skills from the backend + Selected skills stored in AsyncStorage/ AsyncStorage is needed to store the selected skills even after moving to another
  //route
  const loadSkills = async () => {
    try {
      const response = await skillsAPI.getAllSkills();
      if (response.success) {
        // Get selected skills from AsyncStorage
        const selectedSkillsString = await AsyncStorage.getItem("TeachSkills");
        const parsedSkills = selectedSkillsString
          ? JSON.parse(selectedSkillsString)
          : [];

        // Combine backend skills with custom selected skills
        const combinedSkills = [...response.data, ...parsedSkills].filter(
          (skill, index, self) =>
            index === self.findIndex((s) => s.id === skill.id),
        );
        setAllSkills(combinedSkills);
        setSelectedSkills(parsedSkills);
      }
    } catch (error: any) {
      toast.showError("Failed to load skills");
    } finally {
      setIsLoading(false);
    }
  };

  //toggleSkill(): Either select or deselect a skill by adding or removing it to my selectedSkills array
  const toggleSkill = (skill: Skill) => {
    setSelectedSkills((prev) => {
      const exists = prev.some((s) => s.id === skill.id);
      const newSkills = exists
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, skill];
      // Save immediately using the new array
      AsyncStorage.setItem("TeachSkills", JSON.stringify(newSkills));
      return newSkills;
    });
  };
  //handleCreateSkill: First, send the data to the backend to store it in the database. Show a success message, automatically select it and add it to the all skills array, and store
  //it in the AsyncStorage
  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      toast.showError("Please enter a skill name");
      return;
    }
    if (!level) {
      toast.showError("Please select a proficiency level");
      return;
    }
    setIsCreatingSkill(true);
    try {
      const response = await skillsAPI.createCustomSkill({
        name: newSkillName,
        icon_url: newSkillIcon,
      });

      if (response.success) {
        toast.showSuccess("Skill created successfully!");
        response.data.proficiency_level = level;
        //Add new skill to list
        setAllSkills([...allSkills, response.data]);
        //Automatically select the new skill and add it to the selected list
        const newSelectedSkills = [...selectedSkills, response.data];
        setSelectedSkills(newSelectedSkills);

        //Add to AsyncStorage
        AsyncStorage.setItem("TeachSkills", JSON.stringify(newSelectedSkills));

        //Close the modal
        setShowAddSkillModal(false);
        //Reset fields
        setNewSkillName("");
        setNewSkillIcon("star");
        setLevel(null);
      }
    } catch (error: any) {
      toast.showError(error.response?.data?.error || "Failed to create skill");
    } finally {
      setIsCreatingSkill(false);
    }
  };

  //handleNext(): Pass the props to the last screen and navigate
  const handleNext = () => {
    if (selectedSkills.length < 2) {
      toast.showError("Please select at least 2 skills to teach");
      return;
    }
    navigation.navigate("SkillsLearn", {
      profileData: route.params.profileData,
      selectedTeachSkills: selectedSkills,
    });
  };

  //handleBack(): Return back to the profile info page
  const handleBack = () => {
    navigation.goBack();
  };

  const renderSkillItem = ({ item }: { item: Skill }) => {
    const isSelected = selectedSkills.some((skill) => skill.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.skillCard, isSelected && styles.skillCardSelected]}
        onPress={() => toggleSkill(item)}
      >
        <MaterialCommunityIcons
          name={item.icon_url as any}
          size={40}
          color={isSelected ? COLORS.white : COLORS.midBlue}
        />
        <Text
          style={[styles.skillName, isSelected && styles.skillNameSelected]}
        >
          {item.name}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialCommunityIcons
              name="check"
              size={16}
              color={COLORS.white}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.midBlue} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <Header title="Choose Teaching Skills" handleOnPress={handleBack}>
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
        </Header>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Count */}
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              <Text style={{ color: COLORS.darkBlue }}>Selected: </Text>
              {selectedSkills.length}
            </Text>
          </View>

          {/* Skills Grid */}
          <FlatList
            data={allSkills}
            renderItem={renderSkillItem}
            keyExtractor={(item) => item.id?.toString()}
            numColumns={3}
            columnWrapperStyle={styles.skillRow}
            scrollEnabled={false}
            contentContainerStyle={styles.skillsGrid}
          />
          {/* Error Message */}
          {/* {errorMessage && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={20}
                color={COLORS.error}
              />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )} */}
          {/* Add New Skill Button */}
          <View style={{ gap: 10, flexDirection: "row" }}>
            <Button
              title="Add New Skill"
              variant="secondary"
              size="large"
              onPress={() => setShowAddSkillModal(true)}
              icon={
                <MaterialCommunityIcons
                  name="plus-circle"
                  size={24}
                  color={COLORS.white}
                />
              }
            />

            {/* Next Button */}
            <Button
              title="Next"
              onPress={handleNext}
              variant="primary"
              size="large"
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>

        {/* Add Skill Modal */}
        {showAddSkillModal && (
          <Modal
            visible={showAddSkillModal}
            title="Add New Skill"
            showCloseButton={true}
            size="large"
            onClose={() => {
              setShowAddSkillModal(false);
              setNewSkillName("");
              setNewSkillIcon("star");
              setLevel(null);
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
          </Modal>
        )}
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.darkGray,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  progressDot: {
    width: 40,
    height: 6,
    backgroundColor: COLORS.lightBlue,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressDotActive: {
    backgroundColor: COLORS.lightOrange,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  countContainer: {
    borderColor: COLORS.darkBlue,
    borderWidth: 2,
    backgroundColor: COLORS.skinToneOrange,
    paddingInline: SPACING.md,
    paddingBlock: 6,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    width: "auto",
    alignSelf: "flex-end",
  },
  countText: {
    fontFamily: FONT_USAGE.button,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    textAlign: "center",
  },
  skillsGrid: {
    paddingBottom: SPACING.sm,
  },
  skillRow: {
    justifyContent: "flex-start",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  skillCard: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.midBlue,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.sm,
    position: "relative",
  },
  skillCardSelected: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  skillName: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.darkBlue,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  skillNameSelected: {
    color: COLORS.white,
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: COLORS.lightOrange,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    marginTop: SPACING.xl,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.errorDim,
    flex: 1,
  },
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
});
