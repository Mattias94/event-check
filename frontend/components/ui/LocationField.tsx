'use client'

import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { MapPin, MapPinned } from 'lucide-react'
import {
  formControlClassName,
  formErrorClassName,
  formHintClassName,
  formLabelClassName,
} from '../../lib/form-styles'
import { geocodeAddress, searchLocations, type GeocodedPlace } from '../../lib/location-service'
import { cn } from '../../lib/utils'
import EventLocationMap from '../EventLocationMap'
import Button from './Button'
import LocationPickerDialog from './LocationPickerDialog'

export interface LocationSelection {
  location: string
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
}

export interface LocationFieldProps {
  value?: string
  latitude?: number | null
  longitude?: number | null
  placeId?: string | null
  onChange: (selection: LocationSelection) => void
  onBlur?: () => void
  error?: string
  disabled?: boolean
  required?: boolean
  label?: string
  hint?: string
  id?: string
  name?: string
}

const LocationField = forwardRef<HTMLInputElement, LocationFieldProps>(
  (
    {
      value = '',
      latitude = null,
      longitude = null,
      onChange,
      onBlur,
      error,
      disabled,
      required,
      label = 'Localização',
      hint,
      id,
      name = 'location',
    },
    ref,
  ) => {
    const generatedId = useId()
    const inputId = id ?? `${generatedId}-location`
    const listboxId = `${generatedId}-suggestions`
    const errorId = error ? `${generatedId}-error` : undefined
    const hintId = hint ? `${generatedId}-hint` : undefined
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

    const inputRef = useRef<HTMLInputElement>(null)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const onChangeRef = useRef(onChange)
    const onBlurRef = useRef(onBlur)
    const [geocoding, setGeocoding] = useState(false)
    const [pickerOpen, setPickerOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([])
    const [suggestionsOpen, setSuggestionsOpen] = useState(false)
    const [searching, setSearching] = useState(false)

    const resolvedHint =
      hint ?? 'Digite o endereço, selecione na lista ou use “Selecionar no mapa” (OpenStreetMap — gratuito)'

    useEffect(() => {
      onChangeRef.current = onChange
      onBlurRef.current = onBlur
    }, [onChange, onBlur])

    useEffect(() => {
      if (typeof ref === 'function') {
        ref(inputRef.current)
      } else if (ref) {
        ref.current = inputRef.current
      }
    })

    useEffect(() => {
      if (inputRef.current && inputRef.current.value !== value) {
        inputRef.current.value = value
      }
    }, [value])

    function applySelection(selection: LocationSelection) {
      if (inputRef.current) {
        inputRef.current.value = selection.location
      }
      onChangeRef.current(selection)
      setSuggestions([])
      setSuggestionsOpen(false)
    }

    function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
      const nextValue = event.target.value
      onChangeRef.current({
        location: nextValue,
        latitude: null,
        longitude: null,
        placeId: null,
      })

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      const query = nextValue.trim()
      if (query.length < 3) {
        setSuggestions([])
        setSuggestionsOpen(false)
        return
      }

      setSearching(true)
      setSuggestionsOpen(true)
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(query)
          .then((results) => {
            setSuggestions(results)
            setSuggestionsOpen(true)
          })
          .catch(() => setSuggestions([]))
          .finally(() => setSearching(false))
      }, 450)
    }

    async function handleBlur() {
      setTimeout(() => setSuggestionsOpen(false), 150)

      const currentValue = inputRef.current?.value.trim() ?? ''

      if (currentValue && (latitude == null || longitude == null)) {
        setGeocoding(true)
        try {
          const geocoded = await geocodeAddress(currentValue)
          if (geocoded) {
            applySelection({
              location: geocoded.location,
              latitude: geocoded.latitude,
              longitude: geocoded.longitude,
              placeId: geocoded.placeId ?? null,
            })
          }
        } catch {
          /* geocoding opcional */
        } finally {
          setGeocoding(false)
        }
      }

      onBlurRef.current?.()
    }

    const previewLocation = value.trim()

    return (
      <div className="w-full min-w-0 space-y-3">
        <label htmlFor={inputId} className={formLabelClassName}>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </span>
        </label>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              id={inputId}
              name={name}
              type="text"
              role="combobox"
              autoComplete="off"
              aria-autocomplete="list"
              disabled={disabled}
              required={required}
              defaultValue={value}
              placeholder="Ex.: Av. Paulista, 1000 — São Paulo, SP"
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              aria-expanded={suggestionsOpen}
              aria-controls={suggestionsOpen ? listboxId : undefined}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              onBlur={handleBlur}
              className={cn(
                formControlClassName,
                'w-full',
                error && 'border-destructive focus-visible:ring-destructive',
              )}
            />

            {suggestionsOpen && (searching || suggestions.length > 0) && (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
              >
                {searching && (
                  <li className="px-3 py-2 text-sm text-muted-foreground">Buscando endereços...</li>
                )}
                {!searching && suggestions.map((result) => (
                  <li key={`${result.placeId}-${result.latitude}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      className="flex min-h-11 w-full items-center px-3 py-2.5 text-left text-sm hover:bg-accent"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() =>
                        applySelection({
                          location: result.location,
                          latitude: result.latitude,
                          longitude: result.longitude,
                          placeId: result.placeId ?? null,
                        })
                      }
                    >
                      {result.location}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
            className="h-11 w-full shrink-0 sm:h-10 sm:w-auto"
          >
            <MapPinned aria-hidden="true" />
            Selecionar no mapa
          </Button>
        </div>

        {geocoding && (
          <p className="text-xs text-muted-foreground">Buscando coordenadas do endereço...</p>
        )}

        {previewLocation && (
          <EventLocationMap
            location={previewLocation}
            latitude={latitude}
            longitude={longitude}
            compact
            interactive={false}
          />
        )}

        {hintId && (
          <p id={hintId} className={formHintClassName}>
            {resolvedHint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className={formErrorClassName}>
            {error}
          </p>
        )}

        <LocationPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={applySelection}
          initialLocation={value}
          initialLatitude={latitude}
          initialLongitude={longitude}
        />
      </div>
    )
  },
)

LocationField.displayName = 'LocationField'

export default LocationField
