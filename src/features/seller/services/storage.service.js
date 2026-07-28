import { supabase } from "@/config/supabase";

export async function uploadShopLogo(file, userId) {
  if (!file) return null;

  // Security Validation: File Size (max 2MB)
  const MAX_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File size exceeds 2MB limit.");
  }

  // Security Validation: File Type
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are allowed.");
  }

  const extension = file.name.split(".").pop().toLowerCase();
  const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error("Invalid file extension.");
  }

  const fileName = `${userId}-${Date.now()}.${extension}`;

  const filePath = `logos/${fileName}`;

  const { error } = await supabase.storage
    .from("shop-logos")
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("shop-logos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}