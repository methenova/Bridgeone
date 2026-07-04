import Hero from "../components/Hero";
import Categories from "../components/Categories";
import FeaturedShops from "../components/FeaturedShops";
import FeaturedProducts from "../components/FeaturedProducts";
import HowItWorks from "../components/HowItWorks";
import WhyBridgeOne from "../components/WhyBridgeOne";

export default function LandingPage() {
  return (
    <main className="bg-slate-950">
      <Hero />
      <Categories />
      <FeaturedShops />
      <FeaturedProducts />
      <HowItWorks />
      <WhyBridgeOne />
    </main>
  );
}