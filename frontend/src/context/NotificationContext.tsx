import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { notificationsAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socketService";

export interface Notification {
  id: string;
  is_read: boolean;
  created_at: string;
  notifications: NotificationContent;
}

export interface NotificationContent {
  id: string;
  title: string;
  message: string;
  related_entity_type: "friendship" | "group" | "session" | "Group General";
  related_entity_id: string;
  sender: {
    id: string;
    full_name: string;
    nick_name: string;
    profile_image_url: string | null;
  };
  created_at: string;
}

interface NotificationContexType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContexType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  //Load existing notifications froom backend
  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsAPI.getAll();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  //Connect socket and listen for real-time notifications
  useEffect(() => {
    if (!user || !token) return;

    loadNotifications();

    const setupSocket = async () => {
      const socket = await connectSocket();

      socket.on("connect", () => {
        setIsConnected(true);
        console.log("Socket connected");
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      //Listen for new notifications from backend
      socket.on("new-notification", (notification: Notification) => {
        console.log("Notification is:", notification);
        setNotifications((prev) => [notification, ...prev]);
      });
      return () => {
        disconnectSocket();
      };
    };
  }, [user, token]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as aread:", error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
};
