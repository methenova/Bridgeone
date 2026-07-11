import { Container } from "@/components/common/Container";

import ShopBanner from "../components/ShopBanner";
import ShopInfo from "../components/ShopInfo";
import ProductGrid from "../components/ProductGrid";
import ReviewList from "../components/ReviewList";

export default function ShopProfilePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <Container>
        <ShopBanner />

        <ShopInfo />

        <ProductGrid />

        <ReviewList />
      </Container>
    </main>
  );
}