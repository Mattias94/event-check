import React from 'react'
import { clsx } from 'clsx'

export default function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={clsx(
        'w-full px-3 py-3 md:py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition-opacity text-base md:text-sm font-medium',
        className
      )}
    >
      {children}
    </button>
  )
}
