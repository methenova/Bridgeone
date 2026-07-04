export default function HeroStats() {
  const stats = [
    {
      value: "1K+",
      label: "Verified Shops",
    },
    {
      value: "15K+",
      label: "Products",
    },
    {
      value: "24/7",
      label: "Live Shopping",
    },
  ];

  return (
    <div className="mt-14 flex flex-wrap gap-10">
      {stats.map((item) => (
        <div key={item.label}>
          <h2 className="text-3xl font-bold text-white">
            {item.value}
          </h2>

          <p className="mt-2 text-slate-400">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}