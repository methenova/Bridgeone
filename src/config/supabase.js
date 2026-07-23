import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xrsujalzbvvlyplehdrm.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc3VqYWx6YnZ2bHlwbGVoZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTAzNDMsImV4cCI6MjA5ODU2NjM0M30.xewCP7FmemrZ1D7_wtlsPjT1tQlTUBcLa52hi6_R1sE";

const isWidget = typeof window !== "undefined" && window.location.pathname.includes("/widget/");

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storageKey: isWidget ? "bridgeone-customer-auth-token" : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);