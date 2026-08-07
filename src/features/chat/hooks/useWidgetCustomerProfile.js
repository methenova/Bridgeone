import { useState, useEffect, useCallback } from "react";

/**
 * Custom Hook for managing returning customer profiles & visitor session identity in local storage.
 */
export function useWidgetCustomerProfile() {
  const [hasRegisteredBefore, setHasRegisteredBefore] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [previousCalls, setPreviousCalls] = useState([]);
  const [previousProducts, setPreviousProducts] = useState([]);

  const [visitorSessionId] = useState(() => {
    try {
      let cached = localStorage.getItem("bo_visitor_session_id");
      if (!cached) {
        cached = `visitor_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("bo_visitor_session_id", cached);
      }
      return cached;
    } catch {
      return `visitor_${Math.random().toString(36).substring(2, 9)}`;
    }
  });

  // Load returning profiles from LocalStorage on mount
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("bo_visitor_name") || "";
      const storedEmail = localStorage.getItem("bo_visitor_email") || "";
      const storedPhone = localStorage.getItem("bo_visitor_phone") || "";
      const storedLang = localStorage.getItem("bo_visitor_lang") || "en";
      const storedCalls = JSON.parse(localStorage.getItem("bo_previous_calls") || "[]");
      const storedProducts = JSON.parse(localStorage.getItem("bo_previous_products") || "[]");

      if (storedName) {
        setName(storedName);
        setHasRegisteredBefore(true);
      }
      if (storedEmail) setEmail(storedEmail);
      if (storedPhone) setPhone(storedPhone);
      setLanguage(storedLang);
      setPreviousCalls(storedCalls);
      setPreviousProducts(storedProducts);
    } catch (e) {
      console.warn("[LocalStorage] Failed to load returning customer profiles:", e);
    }
  }, []);

  const saveCustomerProfile = useCallback((nameVal, emailVal, phoneVal) => {
    try {
      localStorage.setItem("bo_visitor_name", nameVal);
      localStorage.setItem("bo_visitor_email", emailVal);
      localStorage.setItem("bo_visitor_phone", phoneVal);
      setHasRegisteredBefore(true);
    } catch (err) {
      console.warn("[LocalStorage] Profile save skipped:", err);
    }
  }, []);

  return {
    visitorSessionId,
    hasRegisteredBefore,
    setHasRegisteredBefore,
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    language,
    setLanguage,
    previousCalls,
    setPreviousCalls,
    previousProducts,
    setPreviousProducts,
    saveCustomerProfile
  };
}
