import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md border-2 border-zinc-950 text-sm font-semibold uppercase tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-lime-300 text-zinc-950 shadow-[3px_3px_0_0_#09090b] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#09090b]",
        secondary:
          "bg-sky-200 text-zinc-950 shadow-[3px_3px_0_0_#09090b] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#09090b]",
        ghost:
          "bg-zinc-100 text-zinc-900 shadow-[3px_3px_0_0_#09090b] hover:bg-zinc-50",
        destructive:
          "bg-rose-300 text-zinc-950 shadow-[3px_3px_0_0_#09090b] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#09090b]",
        outline:
          "bg-white text-zinc-900 shadow-[3px_3px_0_0_#09090b] hover:bg-zinc-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
