import { Container } from "@/components/common/Container";

import FeatureCard from "./FeatureCard";
import { featuresData } from "./featuresData";

export default function WhyBridgeOne() {
  return (
    <section className="bg-slate-50 py-24">

      <Container>

        <div className="mb-16 text-center">

          <span className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            Why Choose BridgeOne
          </span>

          <h2 className="mt-6 text-4xl font-bold text-slate-900">
            Everything You Need for
            <br />
            Live Shopping
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
            We combine trust, technology, and convenience to create a
            better shopping experience for customers and shop owners.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {featuresData.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
            />
          ))}

        </div>

      </Container>

    </section>
  );
}