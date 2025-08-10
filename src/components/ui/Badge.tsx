import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/90",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/90",
    destructive: "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/90",
    outline: "text-slate-950 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-start rounded-md border px-3 py-2 text-xs font-medium transition-colors break-words hyphens-auto",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }