/**
 * Utility service to safely clear user-specific workspace state from localStorage on logout or session switch.
 * Ensures zero stale workspace data (active organization, active shop, session states) persists across user sessions.
 */

export function clearUserWorkspaceStorage(userId = null) {
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    const keysToRemove = new Set();

    // Specific user keys if userId provided
    if (userId) {
      keysToRemove.add(`active-org-${userId}`);
      keysToRemove.add(`active-shop-${userId}`);
      keysToRemove.add(`workspace-${userId}`);
    }

    // Scan all localStorage keys for organization/shop workspace pattern matches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("active-org-") ||
          key.startsWith("active-shop-") ||
          key.startsWith("bo_visitor_") ||
          key.startsWith("bo_customer_") ||
          key.startsWith("bridgeone_") ||
          key.startsWith("workspace_") ||
          key.startsWith("last_active_"))
      ) {
        keysToRemove.add(key);
      }
    }

    // Remove all identified keys
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[WorkspaceStorage] Failed to remove key ${key}:`, e);
      }
    });

    console.log(`[WorkspaceStorage] Cleared ${keysToRemove.size} workspace state key(s) from localStorage.`);
  } catch (err) {
    console.warn("[WorkspaceStorage] Error clearing workspace storage:", err);
  }
}
