import HeroContent from "./HeroContent";
import LivePreview from "./LivePreview";
import { Container } from "@/components/common/Container";

export default function Hero() {
  return (
    <section className="bg-slate-50 py-20">
      <Container>
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <HeroContent />
          <LivePreview />
        </div>
      </Container>
    </section>
  );
}