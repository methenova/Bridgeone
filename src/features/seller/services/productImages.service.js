import { supabase } from "@/config/supabase";

const BUCKET = "product-images";

// ─────────────────────────────────────────────────────────────
// UPLOAD IMAGE FILE TO STORAGE
// ─────────────────────────────────────────────────────────────
export async function uploadProductImage(file, shopId, productId) {
  const extension = file.name.split(".").pop().toLowerCase();
  const fileName = `${shopId}/${productId}/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return { url: data.publicUrl, filePath: fileName };
}

// ─────────────────────────────────────────────────────────────
// GET PRODUCT IMAGES
// ─────────────────────────────────────────────────────────────
export async function getProductImages(productId) {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, product_id, url:image_url, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// ─────────────────────────────────────────────────────────────
// ADD IMAGE RECORD TO DB
// ─────────────────────────────────────────────────────────────
export async function addProductImage(productId, url, _sortOrder = 0, _isPrimary = false) {
  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: url
    })
    .select("id, product_id, url:image_url")
    .single();

  if (error) throw error;

  return data;
}

// ─────────────────────────────────────────────────────────────
// DELETE IMAGE — from DB + Storage
// ─────────────────────────────────────────────────────────────
export async function deleteProductImage(imageId, filePath) {
  // Remove from DB
  const { error: dbError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (dbError) throw dbError;

  // Remove from storage (best-effort, don't throw if file missing)
  if (filePath) {
    await supabase.storage.from(BUCKET).remove([filePath]);
  }
}

// ─────────────────────────────────────────────────────────────
// REORDER IMAGES — batch update sort_order
// ─────────────────────────────────────────────────────────────
export async function reorderProductImages(_images) {
  // sort_order is not supported in the database, return resolved promise
  return Promise.resolve();
}

// ─────────────────────────────────────────────────────────────
// SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────
export async function setPrimaryImage(imageId, productId, imageUrl) {
  // is_primary is not supported in the product_images table in the database.
  // We set primary status by updating the thumbnail_url on the products table.
  const { error: productError } = await supabase
    .from("products")
    .update({ thumbnail_url: imageUrl })
    .eq("id", productId);

  if (productError) throw productError;
}
