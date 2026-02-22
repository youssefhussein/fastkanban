import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border-2 border-zinc-950 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-[3px_3px_0_0_#09090b] outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950 dark:text-zinc-100",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
