'use client'

import { useCallback, useState, type MouseEvent } from 'react'
import { MapPin } from 'lucide-react'
import { openEventLocation } from '../lib/location-service'
import { cn } from '../lib/utils'

export interface EventLocationTriggerProps {
  location: string
  latitude?: number | null
  longitude?: number | null
  className?: string
  label?: string
}

export default function EventLocationTrigger({
  location,
  latitude = null,
  longitude = null,
  className,
  label = 'Ver localização no mapa',
}: EventLocationTriggerProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!location.trim() || loading) return

    const task = openEventLocation({ location, latitude, longitude })
    setLoading(true)
    void task.finally(() => setLoading(false))
  }, [loading, location, latitude, longitude])

  if (!location.trim()) return null

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-busy={loading || undefined}
      disabled={loading}
      onClick={handleOpen}
      className={cn(
        'inline-flex max-w-full cursor-pointer items-start gap-2 rounded-md text-left text-sm text-inherit transition-opacity hover:text-inherit active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60',
        className,
      )}
    >
      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 truncate">{location}</span>
    </button>
  )
}
