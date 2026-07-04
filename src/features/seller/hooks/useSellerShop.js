import { useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  getMyShop,
} from "../services/shop.service";

export default function useSellerShop() {
  const { user } = useAuthContext();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadShop() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await getMyShop(user.id);
      setShop(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShop();
  }, [user]);

  return {
    shop,
    loading,
    reloadShop: loadShop,
    hasShop: !!shop,
  };
}