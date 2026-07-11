export default function StepCard({ step, index }) {
  const Icon = step.icon;

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm p-8 transition duration-300 hover:-translate-y-2 hover:border-blue-500">

      <div className="absolute -top-4 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
        {index + 1}
      </div>

      <div className="mb-6 mt-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
        <Icon className="h-8 w-8 text-blue-500" />
      </div>

      <h3 className="mb-3 text-xl font-semibold text-slate-900">
        {step.title}
      </h3>

      <p className="leading-7 text-slate-500">
        {step.description}
      </p>

    </div>
  );
}