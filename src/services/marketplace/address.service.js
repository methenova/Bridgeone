import { supabase } from "@/config/supabase";

// ─────────────────────────────────────────────────────────────
// GET ADDRESSES
// ─────────────────────────────────────────────────────────────
export async function getAddresses(userId) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// CREATE ADDRESS
// ─────────────────────────────────────────────────────────────
export async function createAddress(userId, addressData) {
  const { data, error } = await supabase
    .from("addresses")
    .insert({ ...addressData, user_id: userId })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// UPDATE ADDRESS
// ─────────────────────────────────────────────────────────────
export async function updateAddress(id, addressData) {
  const { data, error } = await supabase
    .from("addresses")
    .update(addressData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// DELETE ADDRESS
// ─────────────────────────────────────────────────────────────
export async function deleteAddress(id) {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// SET DEFAULT ADDRESS
// ─────────────────────────────────────────────────────────────
export async function setDefaultAddress(id, userId) {
  // Unset all defaults first
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);

  // Set the selected one
  const { data, error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}
