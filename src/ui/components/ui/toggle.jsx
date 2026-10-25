"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva } from "class-variance-authority";

import { cn } from "@/ui/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-[background-color,color,box-shadow,transform] text-muted-foreground hover:bg-background/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs data-[state=on]:border data-[state=on]:border-border/80 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 gap-1.5 motion-safe:active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-8 px-3 min-w-8",
        sm: "h-7 px-2.5 min-w-7",
        lg: "h-9 px-4 min-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
