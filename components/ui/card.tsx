import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-zinc-950 bg-white text-zinc-900 shadow-[5px_5px_0_0_#09090b] dark:bg-zinc-900 dark:text-zinc-100",
        className,
      )}
      {...props}
    />
  )
}

function LayeredCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute inset-0 translate-x-2 translate-y-2 rounded-xl border-2 border-zinc-950 bg-pink-200 dark:bg-zinc-800" />
      <Card className="relative" {...props} />
    </div>
  )
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b-2 border-zinc-950 px-4 py-3", className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-black uppercase tracking-wide", className)} {...props} />
  )
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-zinc-700 dark:text-zinc-300", className)} {...props} />
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-3", className)} {...props} />
}

function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t-2 border-zinc-950 px-4 py-3", className)} {...props} />
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, LayeredCard }
