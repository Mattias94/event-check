'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Button from './ui/Button'
import { cn } from '../lib/utils'

export interface PageBackButtonProps {
  href: string
  label: string
  className?: string
}

export default function PageBackButton({ href, label, className }: PageBackButtonProps) {
  return (
    <Button variant="outline" className={cn('h-11 w-full sm:w-auto', className)} asChild>
      <Link href={href}>
        <ArrowLeft aria-hidden="true" />
        {label}
      </Link>
    </Button>
  )
}
