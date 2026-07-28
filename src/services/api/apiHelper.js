import { supabase } from "@/config/supabase";

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Standardized Custom Error Class
 */
export class BridgeOneError extends Error {
  constructor(message, code = "UNKNOWN_ERROR", details = null) {
    super(message);
    this.name = "BridgeOneError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Execute a Supabase query with timeout, transient error retry, and standardized error mapping.
 * @param {Promise} queryPromise - The Supabase query promise
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.retries - Max retry attempts for transient failures
 * @returns {Promise<{data: any, error: BridgeOneError, count: number}>}
 */
export async function executeQuery(queryPromise, options = {}) {
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = options.retries ?? 2;

  let attempt = 0;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await Promise.race([
        queryPromise,
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new BridgeOneError("Database request timed out", "TIMEOUT_ERROR"));
          });
        })
      ]);

      clearTimeout(timeoutId);

      if (response && response.error) {
        if (isTransientError(response.error) && attempt < maxRetries) {
          attempt++;
          console.warn(`[API Helper] Transient DB error (${response.error.code}). Retrying attempt ${attempt}/${maxRetries}...`);
          await delay(200 * attempt);
          continue;
        }

        throw new BridgeOneError(
          response.error.message || "Database execution failed",
          response.error.code || "DB_ERROR",
          response.error.details
        );
      }

      return {
        data: response?.data ?? null,
        error: null,
        count: response?.count ?? 0
      };

    } catch (err) {
      clearTimeout(timeoutId);

      const isNetwork = err.message?.includes("fetch") || err.code === "TIMEOUT_ERROR";
      if (isNetwork && attempt < maxRetries) {
        attempt++;
        console.warn(`[API Helper] Network/Timeout error: ${err.message}. Retrying attempt ${attempt}/${maxRetries}...`);
        await delay(300 * attempt);
        continue;
      }

      const standardError = err instanceof BridgeOneError
        ? err
        : new BridgeOneError(err.message || "An unexpected error occurred", "INTERNAL_ERROR", err);

      return { data: null, error: standardError, count: 0 };
    }
  }
}

/**
 * Check if a Supabase error is transient (e.g. rate limit, gateway outage, connection issue)
 */
function isTransientError(error) {
  if (!error) return false;
  const status = error.status;
  const code = error.code;
  return (
    [408, 502, 503, 504].includes(status) ||
    ["57014", "08006", "08003", "P0000"].includes(code)
  );
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
