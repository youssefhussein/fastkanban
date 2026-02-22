import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border-2 border-zinc-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-zinc-900",
  {
    variants: {
      variant: {
        default: "bg-lime-300",
        neutral: "bg-zinc-300",
        info: "bg-sky-300",
        warn: "bg-amber-300",
        danger: "bg-rose-300",
        accent: "bg-pink-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
