export default function CategoryCard({ category }) {
  const Icon = category.icon;

  return (
    <div className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10">

      <div
        className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color}`}
      >
        <Icon className="h-8 w-8 text-white" />
      </div>

      <h3 className="text-xl font-semibold text-white">
        {category.title}
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        Explore live shopping
      </p>

    </div>
  );
}