import HeroActions from "./HeroActions";
import HeroStats from "./HeroStats";

export default function HeroContent() {
  return (
    <div>

      <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
        🚀 India's First Live Video Commerce Platform
      </span>

      <h1 className="mt-8 text-5xl font-extrabold leading-tight text-slate-900 lg:text-7xl">
        Shop Smarter.
        <br />
        See Before
        <span className="text-blue-500"> You Buy.</span>
      </h1>

      <p className="mt-8 max-w-xl text-xl leading-9 text-slate-500">
        Connect directly with trusted shop owners through live video.
        Explore products in real time, ask questions instantly,
        and shop with complete confidence.
      </p>

      <HeroActions />

      <HeroStats />

    </div>
  );
}