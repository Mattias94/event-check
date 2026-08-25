import { cn } from './utils'

/** Altura e tipografia consistentes — touch-friendly no mobile (48px), compacto no desktop. */
export const formControlClassName = cn(
  'block min-h-12 w-full min-w-0 max-w-full rounded-md border border-input bg-card',
  'px-3 py-2.5 text-base shadow-sm transition-colors',
  'placeholder:text-muted-foreground',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'md:min-h-0 md:h-11 md:py-2 md:text-sm',
)

/** Select nativo — evita overflow do texto selecionado no mobile. */
export const selectControlClassName = cn(
  formControlClassName,
  'cursor-pointer truncate appearance-none bg-no-repeat pr-10',
)

export const formLabelClassName = 'mb-1.5 block text-sm font-medium text-foreground'

export const formErrorClassName = 'mt-1.5 text-sm text-destructive'

export const formHintClassName = 'mt-1.5 text-pretty text-sm text-muted-foreground'
