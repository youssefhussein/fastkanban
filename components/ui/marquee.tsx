import * as React from "react"
import { cn } from "@/lib/utils"

type MarqueeProps = {
  items: string[]
  className?: string
}

function Marquee({ items, className }: MarqueeProps) {
  const row = [...items, ...items]

  return (
    <div className={cn("overflow-hidden rounded-md border-2 border-zinc-950 bg-amber-200", className)}>
      <div className="flex min-w-max animate-[marquee_18s_linear_infinite] gap-6 px-4 py-2">
        {row.map((item, index) => (
          <span key={`${item}-${index}`} className="text-xs font-black uppercase tracking-wide text-zinc-900">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export { Marquee }
