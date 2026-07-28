import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// SEC-6 FIX: Removed hardcoded credential fallbacks. Both values must be
// supplied via environment variables. A missing value means the .env file
// is not configured — fail loudly at startup instead of silently using a
// stale hardcoded key that could be extracted from the JS bundle.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env — " +
    "hardcoded fallback values have been removed for security."
  );
}

const isWidget = typeof window !== "undefined" && window.location.pathname.includes("/widget/");

const clientConfig = {
  auth: {
    storageKey: isWidget ? "bridgeone-customer-auth-token" : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
};

let activeClient = createClient(supabaseUrl, supabaseAnonKey, clientConfig);

// Dynamic Proxy to wrap the active client instance.
// If triggerRegionalDbFailover is called, the underlying client is swapped,
// and all callers immediately query the backup endpoint without reload.
export const supabase = new Proxy({}, {
  get(target, prop) {
    const val = activeClient[prop];
    if (typeof val === "function") {
      return val.bind(activeClient);
    }
    return val;
  }
});

/**
 * Triggers database failover to secondary regional replica.
 */
export function triggerRegionalDbFailover() {
  const secondaryUrl = import.meta.env.VITE_SUPABASE_BACKUP_URL;
  if (!secondaryUrl) {
    console.warn("[supabase] No backup database URL (VITE_SUPABASE_BACKUP_URL) configured.");
    return;
  }
  console.error(`[supabase] CONNECTION LOSS: Swapping database client to backup region: ${secondaryUrl}`);
  activeClient = createClient(secondaryUrl, supabaseAnonKey, clientConfig);
}