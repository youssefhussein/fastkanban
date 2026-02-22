"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AccordionProps = React.HTMLAttributes<HTMLDivElement>

function Accordion({ className, ...props }: AccordionProps) {
  return <div className={cn("space-y-3", className)} {...props} />
}

type AccordionItemProps = React.DetailsHTMLAttributes<HTMLDetailsElement>

function AccordionItem({ className, ...props }: AccordionItemProps) {
  return (
    <details
      className={cn(
        "group overflow-hidden rounded-xl border-2 border-zinc-950 bg-amber-100 shadow-[3px_3px_0_0_#09090b]",
        className,
      )}
      {...props}
    />
  )
}

type AccordionTriggerProps = React.HTMLAttributes<HTMLElement>

function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-3 bg-amber-200 px-4 py-3 text-sm font-black uppercase tracking-wide text-zinc-900 [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 items-center justify-center rounded-sm border-2 border-zinc-950 bg-white text-lg leading-none transition-transform group-open:rotate-45"
      >
        +
      </span>
    </summary>
  )
}

type AccordionContentProps = React.HTMLAttributes<HTMLDivElement>

function AccordionContent({ className, ...props }: AccordionContentProps) {
  return (
    <div
      className={cn(
        "border-t-2 border-zinc-950 bg-white px-4 py-3 text-sm leading-relaxed text-zinc-700",
        className,
      )}
      {...props}
    />
  )
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
