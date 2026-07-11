export default function SearchBar() {
  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Search shops..."
        className="w-full rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
      />
    </div>
  );
}