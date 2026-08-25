import { cn } from '../lib/utils'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]',
        'focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium',
        'focus:text-primary-foreground focus:shadow-lg focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {children}
    </a>
  )
}
