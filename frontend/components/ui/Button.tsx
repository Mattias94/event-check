import React from 'react'

export default function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full px-3 py-3 md:py-2 rounded-md bg-slate-900 text-white hover:opacity-90 transition-opacity text-base md:text-sm font-medium ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}
