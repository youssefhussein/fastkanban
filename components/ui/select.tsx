import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SelectProps = React.ComponentProps<"select">

function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-md border-2 border-zinc-950 bg-white px-3 py-2 pr-10 text-sm font-semibold text-zinc-900 shadow-[3px_3px_0_0_#09090b] outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-zinc-950 dark:text-zinc-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700 dark:text-zinc-300" />
    </div>
  )
}

export { Select }
