import { supabase } from "@/config/supabase";

export async function uploadShopLogo(file, userId) {
  if (!file) return null;

  const extension = file.name.split(".").pop();

  const fileName = `${userId}-${Date.now()}.${extension}`;

  const filePath = `logos/${fileName}`;

  const { error } = await supabase.storage
    .from("shop-logos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("shop-logos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}