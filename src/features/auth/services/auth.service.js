import { supabase } from "@/config/supabase";
import { createAuditLog } from "@/services/audit/audit.service";
import { clearUserWorkspaceStorage } from "@/services/storage/workspaceStorage";
import { validatePasswordSecurity } from "@/services/auth/passwordSecurity.service";

export async function registerUser({
  name,
  email,
  password,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const now = new Date().toISOString();

  // Validate password security against HaveIBeenPwned breach database
  await validatePasswordSecurity(password);

  let clientIp = "127.0.0.1";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json").then((r) => r.json());
    if (ipRes?.ip) clientIp = ipRes.ip;
  } catch {
    // Fallback
  }

  // 1. Create user using Supabase Authentication
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        name: cleanName,
        role: "owner",
        onboarding_completed: false,
        current_onboarding_step: 1,
      },
    },
  });

  if (error) throw error;

  // 2. Insert profile into profiles table with strict error handling & rollback
  if (data?.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          role: "owner",
          onboarding_completed: false,
          current_onboarding_step: 1,
          status: "active",
          email_verified: false,
          phone_verified: false,
          profile_completed: false,
          login_count: 0,
          failed_login_attempts: 0,
          created_ip: clientIp,
          updated_ip: clientIp,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("Profile creation error during registration:", profileError);
      // Clean up session if profile creation fails to prevent orphan session without profile
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn("Sign out during registration error rollback warning:", signOutErr);
      }
      throw new Error(
        `Account creation failed while initializing profile: ${profileError.message || "Database error."}. Please try again.`
      );
    }

    await createAuditLog({
      userId: data.user.id,
      action: "register",
      resource: "auth",
      resourceId: data.user.id,
      metadata: { email: cleanEmail },
    });
  }

  return data;
}

export async function loginUser({
  email,
  password,
}) {
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Check if user is locked
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profiles && profiles.locked_until) {
      const lockedUntil = new Date(profiles.locked_until);
      if (lockedUntil > new Date()) {
        throw new Error(`This account is locked due to too many failed login attempts. Try again after ${lockedUntil.toLocaleTimeString()}.`);
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      try {
        await supabase.rpc("handle_failed_login", { user_email: cleanEmail });
      } catch (rpcErr) {
        console.warn("Failed to call handle_failed_login RPC:", rpcErr);
      }
      throw error;
    }

    // Login successful - Reset failed login attempts, update login count, last_login, last_active, and IP
    if (data?.user) {
      let clientIp = "127.0.0.1";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json").then((r) => r.json());
        if (ipRes?.ip) clientIp = ipRes.ip;
      } catch {
        // Fallback
      }

      const now = new Date().toISOString();
      const currentLoginCount = (profiles?.login_count || 0) + 1;

      await supabase
        .from("profiles")
        .update({
          login_count: currentLoginCount,
          failed_login_attempts: 0,
          locked_until: null,
          last_login: now,
          last_active: now,
          updated_ip: clientIp,
          email_verified: Boolean(data.user.email_confirmed_at),
          updated_at: now,
        })
        .eq("id", data.user.id);

      await createAuditLog({
        userId: data.user.id,
        action: "login",
        resource: "auth",
        resourceId: data.user.id,
        metadata: { email: cleanEmail },
      });
    }

    return data;
  } finally {
    // Audit actions completed
  }
}

import { clearUserWorkspaceStorage } from "@/services/storage/workspaceStorage";

export async function logoutUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      clearUserWorkspaceStorage(user.id);
      await createAuditLog({
        userId: user.id,
        action: "logout",
        resource: "auth",
        resourceId: user.id,
      });
    } else {
      clearUserWorkspaceStorage();
    }
  } catch (err) {
    console.warn("logoutUser notice:", err);
    clearUserWorkspaceStorage();
  }
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  return await supabase.auth.getSession();
}

export async function updatePassword(newPassword) {
  // Validate new password security against HaveIBeenPwned breach database
  await validatePasswordSecurity(newPassword);

  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;

  if (data?.user) {
    await createAuditLog({
      userId: data.user.id,
      action: "password_change",
      resource: "auth",
      resourceId: data.user.id,
    });
  }

  return data;
}