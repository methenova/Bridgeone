import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, Trash2, GripVertical, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates a file before upload
 * @returns {string|null} error message or null if valid
 */
function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: Only JPG, PNG and WebP are allowed`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: File must be under 5 MB`;
  }
  return null;
}

/**
 * Standalone drag-drop image uploader.
 * Handles local preview + calls onUpload for each file.
 * Works both for NEW products (productId=null, queues uploads)
 * and EXISTING products (uploads immediately via onUpload).
 */
export default function ProductImageUploader({
  productId,
  existingImages = [],
  onUpload,         // async (file, index) => { url, id }
  onDelete,         // async (imageId) => void
  onSetPrimary,     // async (imageId, url) => void
  onReorder,        // async (images [{id, sort_order}]) => void
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIds, setUploadingIds] = useState(new Set());
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);

  // Combined list: existing saved images + local previews
  const [localPreviews, setLocalPreviews] = useState([]);

  const allImages = [
    ...existingImages.map((img) => ({ ...img, _type: "saved" })),
    ...localPreviews,
  ];

  const canAddMore = allImages.length < MAX_FILES;

  // ── File processing ──────────────────────────────────────────
  async function processFiles(files) {
    const fileArray = Array.from(files);
    const validFiles = [];
    const newErrors = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else if (allImages.length + validFiles.length >= MAX_FILES) {
        newErrors.push(`Maximum ${MAX_FILES} images allowed`);
        break;
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);

    for (const file of validFiles) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);

      setLocalPreviews((prev) => [
        ...prev,
        { id: tempId, url: previewUrl, _type: "preview", file },
      ]);

      if (productId && onUpload) {
        setUploadingIds((prev) => new Set(prev).add(tempId));
        try {
          const sortOrder = allImages.length;
          await onUpload(file, sortOrder);
          // Remove local preview — the saved image will come from existingImages
          setLocalPreviews((prev) => prev.filter((p) => p.id !== tempId));
        } catch {
          setLocalPreviews((prev) => prev.filter((p) => p.id !== tempId));
        } finally {
          setUploadingIds((prev) => {
            const s = new Set(prev);
            s.delete(tempId);
            return s;
          });
        }
      }
    }
  }

  // ── Drag events ───────────────────────────────────────────────
  function handleDragEnter(e) {
    e.preventDefault();
    dragCounterRef.current++;
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (!disabled && canAddMore) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e) {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  // ── Drag-to-reorder (simple index-swap) ─────────────────────
  const dragImageRef = useRef(null);

  function handleImageDragStart(e, image) {
    dragImageRef.current = image;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleImageDrop(e, targetImage) {
    e.preventDefault();
    e.stopPropagation();
    const dragged = dragImageRef.current;
    if (!dragged || dragged.id === targetImage.id) return;

    // Only reorder saved images
    if (dragged._type !== "saved" || targetImage._type !== "saved") return;

    const saved = existingImages.map((img) => ({ ...img }));
    const fromIdx = saved.findIndex((img) => img.id === dragged.id);
    const toIdx = saved.findIndex((img) => img.id === targetImage.id);

    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = saved.splice(fromIdx, 1);
    saved.splice(toIdx, 0, moved);

    const reordered = saved.map((img, i) => ({ ...img, sort_order: i }));

    if (onReorder) {
      onReorder(reordered.map(({ id, sort_order }) => ({ id, sort_order })));
    }
  }

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      localPreviews.forEach((p) => {
        if (p._type === "preview") URL.revokeObjectURL(p.url);
      });
    };
  }, [localPreviews]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
          Product Images
          <span className="text-xs font-normal text-slate-400 normal-case">
            ({allImages.length}/{MAX_FILES})
          </span>
        </label>
        <p className="text-xs text-slate-500">
          JPG, PNG, WebP · Max 5 MB each
        </p>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-100/50 px-3 py-2 text-xs text-red-650 font-semibold"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && !disabled && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all",
             isDragging
               ? "border-blue-500 bg-blue-50"
               : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50"
           )}
         >
           <div
             className={cn(
               "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
               isDragging ? "bg-blue-100/50" : "bg-slate-100"
             )}
           >
             <ImagePlus
               className={cn(
                 "h-6 w-6 transition-colors",
                 isDragging ? "text-blue-600" : "text-slate-500"
               )}
             />
           </div>

          <div>
            <p className="text-xs font-bold text-slate-700">
              {isDragging ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase">
              or click to browse · up to {MAX_FILES - allImages.length} more
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Image grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {allImages.map((image) => {
            const isUploading = uploadingIds.has(image.id);
            const isSaved = image._type === "saved";
            const isPrimary = image.is_primary;

            return (
              <div
                key={image.id}
                draggable={isSaved}
                onDragStart={(e) => handleImageDragStart(e, image)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleImageDrop(e, image)}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                {/* Image */}
                <img
                  src={image.url}
                  alt="Product"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* Uploading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
                  </div>
                )}

                {/* Drag handle */}
                {isSaved && (
                  <div className="absolute left-1 top-1 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 text-slate-900 drop-shadow" />
                  </div>
                )}

                {/* Primary badge */}
                {isPrimary && (
                  <div className="absolute bottom-1 left-1 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Primary
                  </div>
                )}

                {/* Action buttons */}
                {!isUploading && isSaved && (
                  <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {/* Set primary */}
                    {!isPrimary && onSetPrimary && (
                      <button
                        type="button"
                        onClick={() => onSetPrimary(image.id, image.url)}
                        title="Set as primary"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/90 text-white transition-colors hover:bg-amber-400"
                      >
                        <Star className="h-3 w-3" />
                      </button>
                    )}

                    {/* Delete */}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(image.id)}
                        title="Delete image"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/90 text-white transition-colors hover:bg-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!canAddMore && (
        <p className="text-center text-xs text-slate-500">
          Maximum of {MAX_FILES} images reached
        </p>
      )}
    </div>
  );
}
