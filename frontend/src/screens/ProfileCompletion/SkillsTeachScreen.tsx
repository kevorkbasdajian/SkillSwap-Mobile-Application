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
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { LoadingScreen } from "@/src/components/common/LoadingScreen";

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
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
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
  //For searching the icons
  const [query, setQuery] = useState("");

  // Keyword → icon name overrides for non-obvious searches
  const KEYWORD_HINTS: Record<string, string[]> = {
    "c language": ["language-c"],
    "c programming": ["language-c"],
    "c++": ["language-cpp"],
    cpp: ["language-cpp"],
    python: ["language-python"],
    java: ["language-java"],
    javascript: ["language-javascript"],
    js: ["language-javascript"],
    typescript: ["language-typescript"],
    "c#": ["language-csharp"],
    csharp: ["language-csharp"],
    golang: ["language-go"],
    programming: ["code-braces", "terminal"],
    coding: ["code-tags", "code-braces"],
    guitar: ["guitar-acoustic", "guitar-electric"],
    singing: ["microphone", "music"],
    drawing: ["draw", "pencil", "brush"],
    painting: ["palette", "brush"],
    photography: ["camera"],
    cooking: ["chef-hat", "pot-mix", "silverware-fork-knife"],
    baking: ["bread-slice", "chef-hat"],
    fitness: ["run", "yoga", "weight-lifter"],
    swimming: ["swim"],
    cycling: ["bike"],
    gardening: ["leaf", "sprout", "flower"],
    woodworking: ["hammer", "wrench"],
  };

  //Pull every icon name straight from the bundled glyph map
  const ALL_ICON_NAMES: string[] = Object.keys(
    (MaterialCommunityIcons as any).glyphMap,
  );

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

  //For calculating the results of the icons
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) {
      //Default view: show a broad useful starting set
      return ALL_ICON_NAMES.slice(0, 60);
    }

    //1. Collect keyword-hint boosts
    const boosted = new Set<string>();
    for (const [kw, icons] of Object.entries(KEYWORD_HINTS)) {
      if (kw.includes(q) || q.includes(kw)) {
        icons.forEach((i) => boosted.add(i));
      }
    }

    const words = q.split(/\s+/).filter((w) => w.length > 1);

    //2. Score every icon name
    const scored = ALL_ICON_NAMES.map((name) => {
      let score = 0;
      if (boosted.has(name)) score += 100;
      if (name === q) score += 90; //exact match
      if (name.startsWith(q)) score += 50; //prefix match
      if (name.includes(q)) score += 30; //substring match
      words.forEach((w) => {
        if (name.startsWith(w)) score += 20;
        else if (name.includes(w)) score += 10;
      });
      return { name, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.name);
  }, [query]);

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

  if (isLoading) return <LoadingScreen />;

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
          {/* Minimum skills note */}
          <Text style={styles.minNote}>
            * Select at least 2 skills to continue
          </Text>

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
              setQuery("");
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

              <View style={styles.iconcontainer}>
                <Text
                  style={[
                    { textAlign: "left", marginLeft: SPACING.md },
                    styles.modalLabel,
                  ]}
                >
                  Icon
                </Text>

                {/* Search input */}
                <View style={styles.searchRow}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={18}
                    color={COLORS.midBlue}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search icons... e.g. guitar"
                    placeholderTextColor={COLORS.midBlue + "88"}
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")}>
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={20}
                        color={COLORS.error}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Results count hint */}
                {query.length > 0 && (
                  <Text style={styles.hint}>
                    {results.length} icon{results.length !== 1 ? "s" : ""} found
                    {results.length > 60
                      ? " - refine your search to narrow down"
                      : ""}
                  </Text>
                )}

                {/* Icon grid - capped at 60 rendered items for performance */}
                <View
                  style={[
                    styles.gridWrapper,
                    results.length > 0 && {
                      borderWidth: 1,
                      borderColor: COLORS.midBlue,
                    },
                  ]}
                >
                  <ScrollView
                    style={styles.grid}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={true}
                  >
                    {chunk(results.slice(0, 60), 4).map((row, rowIndex) => (
                      <View key={rowIndex} style={styles.row}>
                        {row.map((item) => {
                          const isSelected = item === newSkillIcon;
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[
                                styles.iconBtn,
                                isSelected && styles.iconBtnSelected,
                              ]}
                              onPress={() => setNewSkillIcon(item)}
                            >
                              <MaterialCommunityIcons
                                name={item as any}
                                size={26}
                                color={
                                  isSelected ? COLORS.white : COLORS.midBlue
                                }
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
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

  iconcontainer: {
    gap: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.darkBlue,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.darkBlue,
  },
  gridWrapper: {
    maxHeight: 220,

    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  hint: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.midBlue,
    marginLeft: SPACING.md,
  },
  noResults: {
    textAlign: "center",
    color: COLORS.error,
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.sm,
    marginBlock: "auto",
  },
  grid: {
    padding: 4,
  },
  row: {
    gap: 4,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  iconBtn: {
    // flex: 1,
    width: "23%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.midBlue + "44",
    backgroundColor: COLORS.lightGray,
    gap: 2,
    minWidth: 0,
  },
  iconBtnSelected: {
    backgroundColor: COLORS.midBlue,
    borderColor: COLORS.darkBlue,
  },
  minNote: {
    fontFamily: FONT_USAGE.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.lightOrange,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
});
