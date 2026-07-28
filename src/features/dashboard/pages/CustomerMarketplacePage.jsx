import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/config/supabase";
import { Store, ShoppingBag, Search, PhoneCall, ArrowRight, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function CustomerMarketplacePage() {
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketplaceData() {
      try {
        setLoading(true);

        // Fetch active shops
        const { data: shopData } = await supabase
          .from("shops")
          .select("*")
          .eq("status", "active")
          .limit(10);
        setShops(shopData || []);

        // Fetch active products
        const { data: prodData } = await supabase
          .from("products")
          .select("*, categories:category_id (name, slug)")
          .eq("is_active", true)
          .limit(16);
        setProducts(prodData || []);

        // Fetch categories
        const { data: catData } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        setCategories(catData || []);

      } catch (err) {
        console.error("Load marketplace error:", err);
        toast.error("Failed to load marketplace content");
      } finally {
        setLoading(false);
      }
    }

    loadMarketplaceData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    return matchesSearch && p.categories?.slug === activeCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-500 font-medium">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Configuring live marketplace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Shop Live with video
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Consult experts, shop instantly
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-lg">
            Connect live with merchant specialists via WebRTC. Ask questions, view product close-ups, and purchase directly inside the stream.
          </p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, descriptions..."
            className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500"
          />
        </div>

        {/* Categories List */}
        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === "all"
                ? "bg-slate-950 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === c.slug
                  ? "bg-slate-950 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Shops Section */}
      <div className="space-y-5">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Store className="h-6 w-6 text-slate-500" /> Live Stores
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group">
              <div className="space-y-4">
                {/* Shop Logo & Name */}
                <div className="flex gap-4">
                  {shop.logo_url || shop.logo ? (
                    <img
                      src={shop.logo_url || shop.logo}
                      alt={shop.shop_name}
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center">
                      {shop.shop_name.charAt(0)}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {shop.shop_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{shop.website}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  Welcome to {shop.shop_name}. Consult with our live agents for expert advice on our full catalog.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex gap-3">
                <button
                  onClick={() => navigate(`/widget/${shop.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-650 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Join Live
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="space-y-5">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-slate-500" /> Featured Catalog
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center border border-slate-200 rounded-3xl bg-white text-slate-500">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const finalPrice = p.discount_price || p.price;
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col shadow-xs hover:shadow-md transition-all group">
                  {/* Thumbnail */}
                  <div className="relative pt-[100%] bg-slate-50 border-b border-slate-100 overflow-hidden">
                    {p.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt={p.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-350 text-3xl font-bold bg-slate-50">
                        {p.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {p.categories?.name || "Product"}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-tight line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description || "No product description details available."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-base font-black text-slate-900">
                          ₹{Number(finalPrice).toLocaleString()}
                        </span>
                        {p.discount_price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{Number(p.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/checkout?product_id=${p.id}&shop_id=${p.shop_id}`)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs transition-all cursor-pointer"
                      >
                        Buy Now <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
