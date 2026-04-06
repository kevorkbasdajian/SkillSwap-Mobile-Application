// This service has an authAPI object that has methods which calls the register, login, forgot-password,
// and change-password endpoints in the backend.
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";

//Base URL for the backend
const API_URL = "http://192.168.1.8:5000/api";

//Creating an axios instance, and indicating the types of files to be sent to the backend, Here JSON.
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//AXIOS Interceptor: Request Interceptor which attaches the authentication token fetched from the AsyncStorage.
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

//AXIOS Interceptor: Response interceptor which checks the message of the response. In case of Unauthorized response, calls the signOut
// function from the authContext.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuth().signOut();
    }

    return Promise.reject(error);
  },
);

//This does not need authorization
export const authAPI = {
  //1-login: Call the login backend endpoint
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
  //2-register: Call the register backend endpoint
  register: async (data: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post("/auth/register", {
      full_name: data.fullName,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
  //3-forgotPassword: Call the forgot-password backend enpoint.
  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },
  //4-resetPassword: Call the reset-password backend enpoint.
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

//User API
export const userAPI = {
  //1-Complete the profile by updating profile info, and subscribing to skills for learning and teaching
  completeProfile: async (formData: FormData) => {
    const response = await api.put("/users/complete-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  //2- Get Public Profile of a user
  getPublicProfile: async (userId: String) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
  //3-fetchOwnProfile for the profile page
  fetchOwnProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },
  //4- Update User Profile
  updateUserProfile: async (formData: FormData) => {
    const response = await api.put("/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

//Skills API
export const skillsAPI = {
  //1-getAllSkills: Retrieve default skills from the backend
  getAllSkills: async () => {
    const response = await api.get("/skills");
    return response.data;
  },

  //2-createCustomSkill:Create a new skill
  createCustomSkill: async (data: { name: string; icon_url: string }) => {
    const response = await api.post("/skills", data);
    return response.data;
  },

  //3- Get user's skills by role (teacher/learner)
  getUserSkillsByRole: async (role: "teacher" | "learner") => {
    const response = await api.get(`/skills/user/${role}`);
    return response.data;
  },

  //4- Toggle Skill Favorite
  setSkillFavorite: async (skillId: string) => {
    const response = await api.patch(`/skills/user/${skillId}/favorite`);
    return response.data;
  },
  //5-Add skill to a user's profile
  addSkillToProfile: async (skill: any) => {
    const response = await api.post("/skills/user", { skills: [skill] });
    return response.data;
  },
  //6- Get all skills including custom ones
  getAllSkillsIncludingCustom: async () => {
    const response = await api.get("/skills/all");
    return response.data;
  },
};

//Groups API
export const groupsAPI = {
  //1- Get User Groups by Role
  getUserGroupsByRole: async (role: "teacher" | "learner") => {
    const response = await api.get(`/groups/my-groups/${role}`);
    return response.data;
  },
  //2-For the search results when a learner clicks on a skill
  getAvailableGroupsForLearner: async (userSkillId: string) => {
    const response = await api.get(
      `/groups/skills/${userSkillId}/learner-groups`,
    );
    return response.data;
  },
  //3-Get the groups of the teacher
  getTeacherGroups: async (skillId: string) => {
    const response = await api.get(`/groups/skills/${skillId}/teacher-groups`);
    return response.data;
  },
  //Get the details of a group
  getGroupDetails: async (groupId: string) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },
  //Join a group
  joinGroup: async (groupId: number) => {
    const response = await api.post(`/groups/${groupId}/join`);
    return response.data;
  },
  //create a group
  createGroup: async (formData: FormData) => {
    const response = await api.post("groups", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  //Approve Member
  approveMember: async (groupId: string, memberId: string) => {
    const response = await api.patch(
      `/groups/${groupId}/members/${memberId}/approve`,
    );
    return response.data;
  },

  //Reject Member
  rejectMember: async (groupId: string, memberId: string) => {
    const response = await api.patch(
      `/groups/${groupId}/members/${memberId}/reject`,
    );
    return response.data;
  },
};

//Search API
export const searchAPI = {
  //Get Recent Searches
  getRecentSearches: async () => {
    const response = await api.get("/users/recent-searches");
    return response.data;
  },

  //Search users by name
  searchUsers: async (query: string) => {
    const response = await api.get(
      `/users/search/?q=${encodeURIComponent(query)}`,
    );
    return response.data;
  },

  //Save a recent search
  saveRecentSearch: async (searchedUserId: string) => {
    const response = await api.post(`/users/recent-searches/${searchedUserId}`);
    return response.data;
  },

  //Remove a recent search
  removeRecentSearch: async (searchedUserId: string) => {
    const response = await api.delete(
      `/users/recent-searches/${searchedUserId}`,
    );
  },

  // Clear all recent searches
  clearRecentSearches: async () => {
    const response = await api.delete("/users/recent-searches");
    return response.data;
  },
};

//Friend API
export const friendAPI = {
  //Send a friend request
  sendFriendRequest: async (addresseeId: string) => {
    const response = await api.post(`/friends/request/${addresseeId}`);
    return response.data;
  },

  //Accept friend request
  acceptFriendRequest: async (friendshipId: string) => {
    const response = await api.patch(`/friends/${friendshipId}/accept`);
    return response.data;
  },
  //Get All friends
  getAllFriends: async () => {
    const response = await api.get("/friends/");
    return response.data;
  },
  //Remove a friend
  removeFriend: async (friendshipId: string) => {
    const response = await api.delete(`/friends/${friendshipId}`);
    return response.data;
  },
  rejectFriendRequest: async (friendshipId: string) => {
    const response = await api.delete(`/friends/${friendshipId}/reject`);
    return response.data;
  },
};

export const notificationsAPI = {
  getAll: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },
};

export default api;
