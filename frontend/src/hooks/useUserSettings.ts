import { useEffect, useState } from "react";
import { userAPI } from "@/src/services/api";

export function useUserSettings() {
  const [settings, setSettings] = useState({
    allow_notifications: true,
    show_skills: true,
    allow_friend_requests: true,
    auto_accept_group_invites: false,
  });

  useEffect(() => {
    userAPI
      .getUserSettings()
      .then((res) => {
        if (res.success) setSettings(res.data);
      })
      .catch(() => {});
  }, []);

  return settings;
}
