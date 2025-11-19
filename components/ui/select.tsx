import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils/cn"

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full h-10 box-border">
        <select
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-neutral-300 bg-white pl-3 pr-9 py-2 text-sm text-neutral-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 box-border",
          className
        )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-[10px] top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
