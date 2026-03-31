
import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover hover disabled disabled data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg='size-'])]:size-4 [&_svg]:shrink-0 focus-visible focus-visible focus-visible outline-none transition-[color,box-shadow] aria-invalid dark aria-invalid whitespace-nowrap",
  {
    variants: {
      variant: { default: '', outline: '' },
      size: { default: '', sm: '', lg: '' },
    },
    defaultVariants: { variant: 'default', size: 'default', },
  })

function Toggle({
  className,
  variant,
  size,
  ...props
}) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants    }
