import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WishlistButton({ isWishlisted, isLoading, onClick, size = "md", className }) {
  const sizes = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "flex items-center justify-center rounded-xl transition-all active:scale-90",
        "bg-white/80 shadow-sm backdrop-blur-sm",
        isWishlisted
          ? "text-red-400 hover:bg-red-500/20"
          : "text-slate-500 hover:bg-slate-100 hover:text-red-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizes[size],
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          "transition-all",
          isWishlisted ? "fill-red-400" : ""
        )}
      />
    </button>
  );
}
