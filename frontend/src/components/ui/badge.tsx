import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-800 text-white shadow-xs hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
        secondary:
          "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
        destructive:
          "border-transparent bg-rose-600 text-white shadow-xs hover:bg-rose-500",
        outline:
          "border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-200",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
