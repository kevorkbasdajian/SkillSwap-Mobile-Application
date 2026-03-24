import { useState } from "react";

export const useErrorToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"error" | "success" | "warning" | "info">(
    "error",
  );

  const showError = (msg: string) => {
    setMessage(msg);
    setType("error");
    setVisible(true);
  };

  const showSuccess = (msg: string) => {
    setMessage(msg);
    setType("success");
    setVisible(true);
  };
  const showWarning = (msg: string) => {
    setMessage(msg);
    setType("warning");
    setVisible(true);
  };

  const showInfo = (msg: string) => {
    setMessage(msg);
    setType("info");
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return {
    visible,
    message,
    type,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    hideToast,
  };
};
