import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import {
  getProductImages,
  uploadProductImage,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  setPrimaryImage,
} from "../services/productImages.service";

import { updateProduct } from "../services/product.service";
import { productKeys } from "./useProducts";

// ─────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────
export const imageKeys = {
  all: ["product-images"],
  list: (productId) => [...imageKeys.all, productId],
};

// ─────────────────────────────────────────────────────────────
// GET PRODUCT IMAGES
// ─────────────────────────────────────────────────────────────
export function useProductImages(productId) {
  return useQuery({
    queryKey: imageKeys.list(productId),
    queryFn: () => getProductImages(productId),
    enabled: !!productId,
  });
}

// ─────────────────────────────────────────────────────────────
// UPLOAD + SAVE IMAGE
// ─────────────────────────────────────────────────────────────
export function useUploadProductImage(productId, shopId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, sortOrder, isPrimary = false }) => {
      // 1. Upload to storage
      const { url } = await uploadProductImage(file, shopId, productId);

      // 2. Save to DB
      const image = await addProductImage(productId, url, sortOrder, isPrimary);

      // 3. If primary, update product thumbnail
      if (isPrimary) {
        await updateProduct(productId, { thumbnail_url: url });
      }

      return image;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message || "Image upload failed");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// DELETE PRODUCT IMAGE
// ─────────────────────────────────────────────────────────────
export function useDeleteProductImage(productId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, filePath }) =>
      deleteProductImage(imageId, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Image removed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// REORDER IMAGES
// ─────────────────────────────────────────────────────────────
export function useReorderProductImages(productId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderProductImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.list(productId) });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reorder images");
    },
  });
}

// ─────────────────────────────────────────────────────────────
// SET PRIMARY IMAGE
// ─────────────────────────────────────────────────────────────
export function useSetPrimaryImage(productId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ imageId, imageUrl }) =>
      setPrimaryImage(imageId, productId, imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: imageKeys.list(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      toast.success("Primary image updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to set primary image");
    },
  });
}
