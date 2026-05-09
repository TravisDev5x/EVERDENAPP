import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Variantes de tamano del Input shadcn.
 * - default: dimension original (h-8) para escritorio.
 * - touch: 48px (Fase 1 Touch-First Everden) sin tocar consumidores existentes.
 */
const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent transition-colors outline-hidden file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default: "h-8 px-2.5 py-1 text-base md:text-sm",
        touch: "h-12 px-3.5 py-2.5 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/**
 * Input shadcn con prop `size` controlada por cva.
 * Se extrae `size` del spread para que React no intente reenviarla al DOM
 * como atributo nativo (que esperaria un numero).
 */
function Input({ className, type, size = "default", ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
