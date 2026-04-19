import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import React, { createContext, useContext, useState } from "react";

type GroupMainRouteProp = RouteProp<RootStackParamList, "GroupMain">;

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
  userRole: "teacher" | "learner";
  creatorId: string;
  description: string;
  updateGroupInfo: (updates: Partial<GroupContextType>) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const route = useRoute<GroupMainRouteProp>();
  const [groupInfo, setGroupInfo] = useState(route.params);

  const updateGroupInfo = (updates: Partial<GroupContextType>) => {
    setGroupInfo((prev) => ({ ...prev, ...updates }));
  };

  return (
    <GroupContext.Provider value={{ ...groupInfo, updateGroupInfo }}>
      {children}
    </GroupContext.Provider>
  );
}

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (!context) throw new Error("useGroupContext must be within GroupProvider");
  return context;
};
