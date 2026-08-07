/**
 * Centralized Edge Function Environment Configuration & Production Secret Validator
 * Validates required secrets with clear, descriptive error messages.
 */

export function validateSecrets(requiredList: string[]): Record<string, string> {
  const missing: string[] = [];
  const secrets: Record<string, string> = {};

  for (const key of requiredList) {
    const val = Deno.env.get(key);
    if (!val || val.trim() === "") {
      missing.push(key);
    } else {
      secrets[key] = val.trim();
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[Configuration Error] Missing required production secret(s) on Supabase Edge Runtime: ${missing.join(", ")}. Please configure via 'supabase secrets set ${missing.map((k) => `${k}=<value>`).join(" ")}'.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return secrets;
}
