import { supabase } from "@/config/supabase";

export async function registerUser({
  name,
  email,
  password,
  role,
}) {
  const {
    data,
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role,
      },
    },
  });

  if (error) throw error;

  // Profile is automatically created by the database trigger.
  return data;
}

export async function loginUser({
  email,
  password,
}) {
  const {
    data,
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function logoutUser() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  return await supabase.auth.getSession();
}