import { Container } from "@/components/common/Container";

import StepCard from "./StepCard";
import { stepsData } from "./stepsData";

export default function HowItWorks() {
  return (
    <section className="bg-slate-950 py-24">

      <Container>

        <div className="mb-16 text-center">

          <span className="rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            How BridgeOne Works
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white">
            Shopping Made More Personal
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            BridgeOne helps customers connect directly with shop owners
            through live video before making a purchase.
          </p>

        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {stepsData.map((step, index) => (
            <StepCard
              key={step.id}
              step={step}
              index={index}
            />
          ))}

        </div>

      </Container>

    </section>
  );
}