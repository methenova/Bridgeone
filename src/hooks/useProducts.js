import { useEffect, useState } from "react";
import { getProductsByShop } from "@/features/seller/services/product.service";

export default function useProducts(shopId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shopId) return;

    async function loadProducts() {
      try {
        const data = await getProductsByShop(shopId);
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [shopId]);

  return {
    products,
    loading,
  };
}