import { supabase } from "@/config/supabase";

export async function getReviews(shopId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("shop_id", shopId);

  if (error) throw error;

  return data;
}