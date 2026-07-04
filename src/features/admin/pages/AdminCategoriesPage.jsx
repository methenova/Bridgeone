import { useState } from "react";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks/useAdmin";
import { Plus, Pencil, Trash2, FolderPlus, FolderEdit } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  function handleEdit(cat) {
    setEditingId(cat.id);
    setName(cat.name);
    setIcon(cat.icon || "");
  }

  function handleCancel() {
    setEditingId(null);
    setName("");
    setIcon("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingId) {
        await updateCat.mutateAsync({
          id: editingId,
          data: { name, icon },
        });
      } else {
        await createCat.mutateAsync({ name, icon });
      }
      handleCancel();
    } catch {}
  }

  async function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      await deleteCat.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <p className="mt-1 text-slate-400">Manage categories, icons, and slug generation.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* List of Categories */}
        <div className="md:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Existing Categories</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-800" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No categories created yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || "📂"}</span>
                    <div>
                      <p className="font-semibold text-white">{cat.name}</p>
                      <p className="text-xs text-slate-500 font-mono">slug: {cat.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      title="Edit Category"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 hover:border-red-500/30"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creator / Editor Form */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 text-white">
            {editingId ? <FolderEdit className="h-5 w-5 text-blue-400" /> : <FolderPlus className="h-5 w-5 text-blue-400" />}
            <h3 className="text-lg font-bold">{editingId ? "Edit Category" : "Add Category"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics, Fashion"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Icon Symbol (Emoji)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 💻, 👕"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={createCat.isPending || updateCat.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
