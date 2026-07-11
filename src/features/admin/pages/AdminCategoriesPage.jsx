import { useState } from "react";
import { Plus, Pencil, Trash2, FolderPlus, FolderEdit, Folder, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "../hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/skeletons";

function getLucideIcon(iconName) {
  if (!iconName) return Folder;
  
  // Convert kebab-case to PascalCase (e.g. book-open -> BookOpen)
  const pascalName = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
    
  return LucideIcons[pascalName] || Folder;
}

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
    } catch (err) {
      console.error("[Categories] Update error:", err);
    }
  }

  async function handleDelete(id, name) {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      await deleteCat.mutateAsync(id);
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 text-slate-900 max-w-7xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Categories</h1>
        <p className="mt-1 text-xs text-slate-500">Configure marketplace product verticals and visual symbols.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        
        {/* List of Categories */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[10px] text-slate-500">Existing Categories</h3>

          {isLoading ? ( <TableSkeleton rows={5} /> ) : categories.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Folder className="h-10 w-10 text-slate-700 mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-500">No Categories Found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  key={cat.id} 
                  className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm text-slate-500 shrink-0">
                      {(() => {
                        const IconComponent = getLucideIcon(cat.icon);
                        return <IconComponent className="h-5 w-5" />;
                      })()}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{cat.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">slug: {cat.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(cat)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/60 shadow-sm text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/60 shadow-sm text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Creator / Editor Form */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 h-fit space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            {editingId ? <FolderEdit className="h-5 w-5 text-blue-400" /> : <FolderPlus className="h-5 w-5 text-blue-400" />}
            <h3 className="text-base font-bold">{editingId ? "Edit Category" : "Add Category"}</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Electronics, Fashion"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Icon Symbol (Emoji)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 💻, 👕"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                type="submit"
                disabled={createCat.isPending || updateCat.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-slate-900 hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-650/10"
              >
                {createCat.isPending || updateCat.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>{editingId ? "Update" : "Create"}</span>
              </Button>
              {editingId && (
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
