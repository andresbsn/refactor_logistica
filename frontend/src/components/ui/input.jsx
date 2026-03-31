import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file placeholder selection selection dark border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file file file file file file disabled disabled disabled md:text-sm',
        'focus-visible focus-visible focus-visible:ring-[3px]',
        'aria-invalid dark aria-invalid:border-destructive',
        className)}
      {...props}
    />
  )
}

export { Input    }
