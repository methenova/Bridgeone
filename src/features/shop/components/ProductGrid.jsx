import ProductCard from "./ProductCard";

const demoProducts = [
  {
    id: 1,
    product_name: "Premium T-Shirt",
    sale_price: 799,
    mrp: 1199,
    stock_quantity: 20,
    image_url: "",
  },
  {
    id: 2,
    product_name: "Sneakers",
    sale_price: 2499,
    mrp: 3499,
    stock_quantity: 10,
    image_url: "",
  },
  {
    id: 3,
    product_name: "Smart Watch",
    sale_price: 4999,
    mrp: 6999,
    stock_quantity: 8,
    image_url: "",
  },
  {
    id: 4,
    product_name: "Backpack",
    sale_price: 1499,
    mrp: 1999,
    stock_quantity: 15,
    image_url: "",
  },
];

export default function ProductGrid() {
  return (
    <section className="mt-10">

      <h2 className="mb-8 text-3xl font-bold text-slate-900">
        Products
      </h2>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {demoProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}
      </div>

    </section>
  );
}