/**
 * Privacy-Preserving Leaked Password Security Service (HaveIBeenPwned k-Anonymity model)
 * Checks passwords against known data breaches before account creation or password updates.
 */

/**
 * Computes SHA-1 hash of a text string using Web Crypto API.
 */
async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/**
 * Checks if a password has been compromised in a known data breach via HaveIBeenPwned API (k-Anonymity model).
 * @param {string} password - Cleartext password to test
 * @returns {Promise<{ leaked: boolean, count: number }>}
 */
export async function checkLeakedPassword(password) {
  if (!password || typeof password !== "string") {
    return { leaked: false, count: 0 };
  }

  try {
    const fullHash = await sha1(password);
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: "GET",
      headers: { "Add-Padding": "true" },
    });

    if (!response.ok) {
      console.warn("[PasswordSecurity] HIBP API responded with non-200 status:", response.status);
      return { leaked: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix && hashSuffix.toUpperCase() === suffix.toUpperCase()) {
        const count = parseInt(countStr || "0", 10);
        return { leaked: true, count };
      }
    }

    return { leaked: false, count: 0 };
  } catch (err) {
    console.warn("[PasswordSecurity] Leaked password check failed (failing open):", err.message);
    return { leaked: false, count: 0 };
  }
}

/**
 * Validates password security and throws error if password is known to be compromised.
 */
export async function validatePasswordSecurity(password) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const { leaked, count } = await checkLeakedPassword(password);
  if (leaked) {
    throw new Error(
      `Security Alert: This password has appeared in known data breaches (${count.toLocaleString()} times). Please choose a safer password to protect your account.`
    );
  }
}
