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
};

//User API
export const userAPI = {
  completeProfile: async (formData: FormData) => {
    console.log("Form Data is ", formData);
    const response = await api.put("/users/complete-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("response is", response.data);
    return response.data;
  },
};

export default api;
