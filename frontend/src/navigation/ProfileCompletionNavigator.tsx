import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileCompletionParamList } from "./types";
import ProfileInfoScreen from "../screens/ProfileCompletion/ProfileInfoScreen";
import SkillsTeachScreen from "../screens/ProfileCompletion/SkillsTeachScreen";
import SkillsLearnScreen from "../screens/ProfileCompletion/SkillsLearnScreen";

//Creating the stack navigator with the proper types
const Stack = createNativeStackNavigator<ProfileCompletionParamList>();

export default function ProfileCompletionNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} />
      <Stack.Screen name="SkillsTeach" component={SkillsTeachScreen} />
      <Stack.Screen name="SkillsLearn" component={SkillsLearnScreen} />
    </Stack.Navigator>
  );
}
