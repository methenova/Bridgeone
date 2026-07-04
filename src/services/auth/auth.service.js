import { supabase } from "@/config/supabase";

export async function registerUser({
  email,
  password,
}) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function loginUser({
  email,
  password,
}) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logoutUser() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  return await supabase.auth.getUser();
}

export async function getSession() {
  return await supabase.auth.getSession();
}