import { supabase } from "@/config/supabase";

export async function getProductsByShop(shopId) {
  
  const query = supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId);

  const { data, error } = await query;

  

  return data ?? [];
}