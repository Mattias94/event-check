'use client'

import { cn } from '../lib/utils'

interface EventCoverImageProps {
  src: string
  className?: string
  /** Limita altura em telas maiores sem distorcer a imagem */
  maxHeightClass?: string
}

export default function EventCoverImage({
  src,
  className,
  maxHeightClass = 'max-h-44 sm:max-h-52 md:max-h-64',
}: EventCoverImageProps) {
  return (
    <div
      className={cn(
        'relative w-full min-w-0 overflow-hidden bg-muted',
        'aspect-[16/9] sm:aspect-[2/1]',
        maxHeightClass,
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
