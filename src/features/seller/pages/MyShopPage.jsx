import useSellerShop from "../hooks/useSellerShop";
import ShopForm from "../components/shop/ShopForm";

export default function MyShopPage() {
  const {
    shop,
    loading,
    hasShop,
    reloadShop,
  } = useSellerShop();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading Shop...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">

      <div className="mx-auto max-w-5xl">

        <div className="mb-8">

          <h1 className="text-4xl font-bold text-white">
            {hasShop ? "Edit Shop" : "Create Your Shop"}
          </h1>

          <p className="mt-2 text-slate-400">
            {hasShop
              ? "Update your shop information."
              : "Complete your shop profile to start selling on BridgeOne."}
          </p>

        </div>

        <ShopForm
          shop={shop}
          reloadShop={reloadShop}
        />

      </div>

    </div>
  );
}