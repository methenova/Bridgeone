export default function ShopBanner({ shop }) {
  return (
    <section className="relative h-80 overflow-hidden rounded-3xl">

      <img
        src={
          shop.banner_url ||
          `https://placehold.co/1600x500/0f172a/ffffff?text=${encodeURIComponent(
            shop.shop_name
          )}`
        }
        alt={shop.shop_name}
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

    </section>
  );
}