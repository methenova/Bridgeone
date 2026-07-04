export default function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10">

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
        <Icon className="h-8 w-8 text-blue-500" />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-white">
        {feature.title}
      </h3>

      <p className="leading-7 text-slate-400">
        {feature.description}
      </p>

    </div>
  );
}