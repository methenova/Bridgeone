import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env — " +
    "hardcoded fallback values have been removed for security."
  );
}

// Startup validation for optional regional failover configuration
const backupUrl = import.meta.env.VITE_SUPABASE_BACKUP_URL;
if (!backupUrl || !backupUrl.trim()) {
  console.info(
    "[supabase] VITE_SUPABASE_BACKUP_URL is not configured in .env. " +
    "High-availability regional database failover is inactive (operating in single-region mode)."
  );
}

const isWidget = typeof window !== "undefined" && window.location.pathname.includes("/widget/");

const clientConfig = {
  auth: {
    storageKey: isWidget ? "bridgeone-customer-auth-token" : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

let activeClient = createClient(supabaseUrl, supabaseAnonKey, clientConfig);
let currentClientUrl = supabaseUrl;
let isFailoverActiveState = false;

// Dynamic Proxy to wrap the active client instance.
// If triggerRegionalDbFailover is called, the underlying client is swapped,
// and all callers immediately query the backup endpoint without reload.
export const supabase = new Proxy(
  {},
  {
    get(target, prop) {
      const val = activeClient[prop];
      if (typeof val === "function") {
        return val.bind(activeClient);
      }
      return val;
    },
  }
);

/**
 * Validates whether a URL string is valid and uses http/https protocol.
 */
function isValidUrl(stringUrl) {
  try {
    const url = new URL(stringUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Triggers database failover to secondary regional replica safely.
 * @returns {boolean} true if failover succeeded, false if unconfigured or invalid.
 */
export function triggerRegionalDbFailover() {
  const secondaryUrl = import.meta.env.VITE_SUPABASE_BACKUP_URL;

  if (!secondaryUrl || !secondaryUrl.trim()) {
    console.warn(
      "[supabase] Optional regional failover requested, but no backup database URL (VITE_SUPABASE_BACKUP_URL) is configured in .env. Continuing in single-region mode."
    );
    return false;
  }

  const cleanSecondaryUrl = secondaryUrl.trim();

  if (!isValidUrl(cleanSecondaryUrl)) {
    console.error(
      `[supabase] Invalid VITE_SUPABASE_BACKUP_URL provided: "${cleanSecondaryUrl}". Failover aborted.`
    );
    return false;
  }

  if (isFailoverActiveState && currentClientUrl === cleanSecondaryUrl) {
    console.info("[supabase] Regional failover is already active on secondary replica:", cleanSecondaryUrl);
    return true;
  }

  console.error(`[supabase] CONNECTION LOSS: Swapping database client to backup region: ${cleanSecondaryUrl}`);
  activeClient = createClient(cleanSecondaryUrl, supabaseAnonKey, clientConfig);
  currentClientUrl = cleanSecondaryUrl;
  isFailoverActiveState = true;
  return true;
}

/**
 * Resets regional database client back to primary endpoint.
 */
export function resetRegionalDbFailover() {
  if (!isFailoverActiveState) return;
  console.info(`[supabase] Restoring primary database client connection: ${supabaseUrl}`);
  activeClient = createClient(supabaseUrl, supabaseAnonKey, clientConfig);
  currentClientUrl = supabaseUrl;
  isFailoverActiveState = false;
}

/**
 * Returns current failover and client status.
 */
export function getFailoverStatus() {
  const backupUrlConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_BACKUP_URL &&
    isValidUrl(import.meta.env.VITE_SUPABASE_BACKUP_URL.trim())
  );

  return {
    isFailoverActive: isFailoverActiveState,
    currentUrl: currentClientUrl,
    primaryUrl: supabaseUrl,
    backupUrlConfigured,
  };
}