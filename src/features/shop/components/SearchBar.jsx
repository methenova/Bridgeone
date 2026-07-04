export default function SearchBar() {
  return (
    <div className="mb-8">
      <input
        type="text"
        placeholder="Search shops..."
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
      />
    </div>
  );
}