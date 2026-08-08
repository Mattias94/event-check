import React from 'react'

export default function Button({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full py-2 rounded-md bg-slate-900 text-white hover:opacity-90 ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}
