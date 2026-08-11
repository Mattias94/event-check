import React from 'react'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  name: string
  error?: string | null
}

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, name, error, ...rest }, ref) => {
    const base = 'w-full px-4 py-3 md:px-3 md:py-2 rounded-md bg-white dark:bg-slate-700 text-base md:text-sm'
    const border = error ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
    return (
      <div>
        {label && <label className="block text-sm md:text-xs font-medium mb-2 md:mb-1">{label}</label>}
        <input
          ref={ref}
          name={name}
          className={`${base} border ${border}`}
          {...rest}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

