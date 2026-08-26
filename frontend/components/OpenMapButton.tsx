'use client'

import { useCallback, useState } from 'react'
import { MapPinned } from 'lucide-react'
import { openEventLocation } from '../lib/location-service'
import Button, { type ButtonProps } from './ui/Button'

export interface OpenMapButtonProps extends Omit<ButtonProps, 'onClick' | 'loading'> {
  location: string
  latitude?: number | null
  longitude?: number | null
  label?: string
}

export default function OpenMapButton({
  location,
  latitude = null,
  longitude = null,
  label = 'Abrir mapa',
  children,
  ...buttonProps
}: OpenMapButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = useCallback(() => {
    if (!location.trim() || loading) return

    const task = openEventLocation({ location, latitude, longitude })
    setLoading(true)
    void task.finally(() => setLoading(false))
  }, [loading, location, latitude, longitude])

  return (
    <Button type="button" loading={loading} onClick={handleOpen} {...buttonProps}>
      {children ?? (
        <>
          <MapPinned aria-hidden="true" />
          {label}
        </>
      )}
    </Button>
  )
}
