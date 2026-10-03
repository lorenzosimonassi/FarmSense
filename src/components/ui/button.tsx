import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-secondary",
        // Acento: só sobre fundos Mata (CTA final, faixa do dashboard)
        milho: "bg-milho text-milho-foreground shadow-sm hover:bg-milho/90",
        secondary:
          "bg-card text-primary border border-input shadow-xs hover:bg-accent hover:border-primary/30",
        outline:
          "border border-primary-foreground/30 bg-transparent text-current hover:bg-primary-foreground/10",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2 [&_svg]:size-4",
        sm: "h-9 px-4 text-[13px] pointer-coarse:h-10 [&_svg]:size-3.5",
        lg: "h-12 px-6 text-[15px] [&_svg]:size-4.5",
        icon: "size-10 pointer-coarse:size-11 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
