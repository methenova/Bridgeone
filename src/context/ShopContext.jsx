import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getShops } from "@/services/shop/shop.service";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");

  useEffect(() => {
    async function loadShops() {
      try {
        const data = await getShops();
        setShops(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadShops();
  }, []);

  // -----------------------------
  // Category List
  // -----------------------------
  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        shops
          .map((shop) => shop.categories?.name)
          .filter(Boolean)
      ),
    ];
  }, [shops]);

  // -----------------------------
  // City List
  // -----------------------------
  const cities = useMemo(() => {
    return [
      "All",
      ...new Set(
        shops
          .map((shop) => shop.city)
          .filter(Boolean)
      ),
    ];
  }, [shops]);

  // -----------------------------
  // Filter Shops
  // -----------------------------
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchSearch =
        shop.shop_name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchCategory =
        category === "All" ||
        shop.categories?.name === category;

      const matchCity =
        city === "All" ||
        shop.city === city;

      return matchSearch && matchCategory && matchCity;
    });
  }, [shops, search, category, city]);

  return (
    <ShopContext.Provider
      value={{
        loading,

        shops,
        filteredShops,

        search,
        setSearch,

        category,
        setCategory,

        city,
        setCity,

        categories,
        cities,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShopContext() {
  return useContext(ShopContext);
}