import { useState, useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Custom Hook for tracking network online/offline state in the Chat Widget.
 */
export function useWidgetNetwork() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored!", { id: "network-status" });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Network disconnected. Please check your internet connection.", {
        id: "network-status",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
