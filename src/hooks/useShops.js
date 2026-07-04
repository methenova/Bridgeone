import { useEffect, useState } from "react";
import { getShops } from "@/services/shop/shop.service";

export default function useShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShops() {
      try {
        const data = await getShops();

        setShops(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadShops();
  }, []);

  return {
    shops,
    loading,
  };
}