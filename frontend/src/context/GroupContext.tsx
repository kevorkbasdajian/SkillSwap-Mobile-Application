import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import React, { createContext, useContext } from "react";

//To extract the route props for the GroupMain page
type GroupMainRouteProp = RouteProp<RootStackParamList, "GroupMain">;

//interface to defined the type of the GroupContext
interface GroupContextType {
  groupId: number;
  groupName: string;
  skillName: string;
  skillIconUrl: string;
  coverImageUrl: string | null;
  maxParticipants: number;
  difficulty: string;
  visibility: string;
  currentParticipants: number;
}
const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  //---------------Constants-----------
  const route = useRoute<GroupMainRouteProp>();

  const params = route.params;

  return (
    <GroupContext.Provider value={params}>{children}</GroupContext.Provider>
  );
}

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroupContext must be within GroupProvider");
  return context;
};
