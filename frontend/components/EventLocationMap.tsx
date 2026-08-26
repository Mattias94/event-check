'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import OpenMapButton from './OpenMapButton'
import { geocodeAddress, openEventLocation, OSM_ATTRIBUTION } from '../lib/location-service'
import { cn } from '../lib/utils'
import OsmMapLazy from './ui/OsmMapLazy'

export interface EventLocationMapProps {
  location: string
  latitude?: number | null
  longitude?: number | null
  compact?: boolean
  className?: string
  interactive?: boolean
}

export default function EventLocationMap({
  location,
  latitude = null,
  longitude = null,
  compact = false,
  className,
  interactive = true,
}: EventLocationMapProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  )
  const [displayLocation, setDisplayLocation] = useState(location)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    setDisplayLocation(location)
    if (latitude != null && longitude != null) {
      setCoords({ lat: latitude, lng: longitude })
      return
    }

    if (!location.trim()) {
      setCoords(null)
      return
    }

    let cancelled = false
    geocodeAddress(location)
      .then((result) => {
        if (cancelled || !result) return
        setCoords({ lat: result.latitude, lng: result.longitude })
        setDisplayLocation(result.location)
      })
      .catch(() => {
        /* mantém endereço textual */
      })

    return () => {
      cancelled = true
    }
  }, [location, latitude, longitude])

  const handleOpenMap = useCallback(() => {
    if (!location.trim() || opening) return

    setOpening(true)
    void openEventLocation({
      location: displayLocation,
      latitude: coords?.lat ?? latitude,
      longitude: coords?.lng ?? longitude,
    }).finally(() => setOpening(false))
  }, [coords, displayLocation, latitude, location, longitude, opening])

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      {coords ? (
        <button
          type="button"
          onClick={() => interactive && void handleOpenMap()}
          disabled={opening}
          className={cn(
            'block w-full text-left',
            interactive && 'cursor-pointer transition-opacity hover:opacity-95 disabled:opacity-70',
          )}
          aria-label="Abrir mapa"
        >
          <div className={cn('w-full', compact ? 'h-40' : 'h-56 md:h-64')}>
            <OsmMapLazy
              center={coords}
              zoom={compact ? 15 : 16}
              marker={coords}
              height="100%"
              interactive={false}
            />
          </div>
        </button>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center bg-muted/30 px-4 text-center text-sm text-muted-foreground',
            compact ? 'h-24' : 'h-32',
          )}
        >
          {location.trim() ? (
            <OpenMapButton
              location={displayLocation}
              latitude={latitude}
              longitude={longitude}
              variant="outline"
              size="sm"
            />
          ) : (
            'Endereço não informado'
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground sm:text-sm">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{displayLocation}</span>
          </p>
            {coords && (
              <p className="mt-1 break-words pl-5 text-[10px] text-muted-foreground/80 sm:truncate sm:text-xs">{OSM_ATTRIBUTION}</p>
            )}
        </div>
        {location.trim() && (
          <OpenMapButton
            location={displayLocation}
            latitude={coords?.lat ?? latitude}
            longitude={coords?.lng ?? longitude}
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
          />
        )}
      </div>
    </div>
  )
}
