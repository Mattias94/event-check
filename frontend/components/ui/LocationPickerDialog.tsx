'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, MapPinned, Search, X } from 'lucide-react'
import {
  DEFAULT_MAP_CENTER,
  geocodeAddress,
  reverseGeocode,
  searchLocations,
  type GeocodedPlace,
} from '../../lib/location-service'
import { cn } from '../../lib/utils'
import Button from './Button'
import OsmMapLazy from './OsmMapLazy'
import type { LocationSelection } from './LocationField'

export interface LocationPickerDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (selection: LocationSelection) => void
  initialLocation?: string
  initialLatitude?: number | null
  initialLongitude?: number | null
}

export default function LocationPickerDialog({
  open,
  onClose,
  onConfirm,
  initialLocation = '',
  initialLatitude = null,
  initialLongitude = null,
}: LocationPickerDialogProps) {
  const titleId = useId()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialLocation)
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [selection, setSelection] = useState<GeocodedPlace | null>(null)
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : null,
  )
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : DEFAULT_MAP_CENTER,
  )
  const [mapZoom, setMapZoom] = useState(initialLatitude != null ? 16 : 11)

  const resolvePosition = useCallback(async (lat: number, lng: number) => {
    setMarker({ lat, lng })
    setMapCenter({ lat, lng })
    setMapZoom(16)
    setResolving(true)

    try {
      const result = await reverseGeocode(lat, lng)
      const nextSelection = result ?? {
        location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        placeId: null,
      }
      setSelection(nextSelection)
      if (result?.location) {
        setSearchQuery(result.location)
      }
    } catch {
      setSelection({
        location: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat,
        longitude: lng,
        placeId: null,
      })
    } finally {
      setResolving(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    setSearchQuery(initialLocation)
    setSearchResults([])

    if (initialLatitude != null && initialLongitude != null) {
      const initial = {
        location: initialLocation.trim() || `${initialLatitude}, ${initialLongitude}`,
        latitude: initialLatitude,
        longitude: initialLongitude,
        placeId: null,
      }
      setSelection(initial)
      setMarker({ lat: initialLatitude, lng: initialLongitude })
      setMapCenter({ lat: initialLatitude, lng: initialLongitude })
      setMapZoom(16)

      if (!initialLocation.trim()) {
        void resolvePosition(initialLatitude, initialLongitude)
      }
    } else if (initialLocation.trim()) {
      void geocodeAddress(initialLocation).then((result) => {
        if (!result) return
        setSelection(result)
        setMarker({ lat: result.latitude, lng: result.longitude })
        setMapCenter({ lat: result.latitude, lng: result.longitude })
        setMapZoom(16)
      })
    } else {
      setSelection(null)
      setMarker(DEFAULT_MAP_CENTER)
      setMapCenter(DEFAULT_MAP_CENTER)
      setMapZoom(11)
    }
  }, [open, initialLocation, initialLatitude, initialLongitude, resolvePosition])

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.removeProperty('overflow')
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    const query = searchQuery.trim()
    if (query.length < 3) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query)
        .then((results) => setSearchResults(results))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 450)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [open, searchQuery])

  function handleSelectResult(result: GeocodedPlace) {
    setSelection(result)
    setSearchQuery(result.location)
    setSearchResults([])
    setMarker({ lat: result.latitude, lng: result.longitude })
    setMapCenter({ lat: result.latitude, lng: result.longitude })
    setMapZoom(16)
  }

  function handleConfirm() {
    if (!selection) return
    onConfirm({
      location: selection.location,
      latitude: selection.latitude,
      longitude: selection.longitude,
      placeId: selection.placeId ?? null,
    })
    onClose()
  }

  if (!mounted || !open) return null

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[120] bg-black/40"
        onMouseDown={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        className="fixed inset-x-3 top-[5dvh] z-[130] mx-auto flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-x-auto"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-foreground sm:text-lg">
              Selecionar localização
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              OpenStreetMap — busque um endereço ou clique no mapa
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-4 py-3 sm:px-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar endereço no Brasil..."
              className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {(searching || searchResults.length > 0) && searchQuery.trim().length >= 3 && (
              <ul
                role="listbox"
                className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
              >
                {searching && (
                  <li className="px-3 py-2 text-sm text-muted-foreground">Buscando...</li>
                )}
                {!searching && searchResults.length === 0 && (
                  <li className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado encontrado</li>
                )}
                {searchResults.map((result) => (
                  <li key={`${result.placeId}-${result.latitude}-${result.longitude}`}>
                    <button
                      type="button"
                      role="option"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={() => handleSelectResult(result)}
                    >
                      {result.location}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="relative h-[min(52dvh,420px)] min-h-[280px] w-full">
              <OsmMapLazy
                mapKey={open ? 'location-picker-open' : 'location-picker-closed'}
                center={mapCenter}
                zoom={mapZoom}
                marker={marker ?? mapCenter}
                height="100%"
                onMapClick={(lat, lng) => void resolvePosition(lat, lng)}
                onMarkerDrag={(lat, lng) => void resolvePosition(lat, lng)}
              />
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg border px-3 py-2.5 text-sm',
              selection ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border bg-muted/20 text-muted-foreground',
            )}
          >
            {resolving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Identificando endereço...
              </span>
            ) : selection ? (
              selection.location
            ) : (
              'Nenhum local selecionado — clique no mapa ou busque acima'
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selection || resolving}
            className="w-full sm:w-auto"
          >
            <MapPinned aria-hidden="true" />
            Usar esta localização
          </Button>
        </div>
      </div>
    </>,
    document.body,
  )
}
