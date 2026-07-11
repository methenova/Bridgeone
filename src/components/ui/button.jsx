import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-[1px] border border-transparent",
        outline: "bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent shadow-none",
        destructive: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
        link: "text-blue-600 underline-offset-4 hover:underline !p-0 !h-auto active:scale-100 shadow-none bg-transparent",
      },
      size: {
        default: "h-10 px-5 rounded-xl text-sm gap-2 [&_svg]:size-4",
        sm: "h-8 px-3 rounded-lg text-xs gap-1.5 [&_svg]:size-3.5",
        lg: "h-12 px-6 rounded-xl text-base gap-2 [&_svg]:size-5",
        icon: "size-10 rounded-xl [&_svg]:size-4",
        "icon-sm": "size-8 rounded-lg [&_svg]:size-3.5",
        "icon-lg": "size-12 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      ref={ref}
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} 
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
