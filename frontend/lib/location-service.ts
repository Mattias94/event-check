import { api } from './api'

export interface GeocodedPlace {
  location: string
  latitude: number
  longitude: number
  placeId: string | null
}

export function buildMapsSearchUrl(location: string, latitude?: number | null, longitude?: number | null): string {
  if (latitude != null && longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`
}

export function isMobileMapsDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
}

/** Abre o app de mapas padrão no celular (Apple Maps, Google Maps, Waze, etc.). */
export function buildNativeMapsUrl(
  location: string,
  latitude?: number | null,
  longitude?: number | null,
): string {
  const label = encodeURIComponent(location.trim() || 'Localização')

  if (latitude != null && longitude != null) {
    if (isIosDevice()) {
      return `maps://?ll=${latitude},${longitude}&q=${label}`
    }
    return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`
  }

  if (isIosDevice()) {
    return `maps://?q=${label}`
  }
  return `geo:0,0?q=${label}`
}

export interface ResolvedEventLocation {
  location: string
  latitude: number
  longitude: number
}

export async function resolveEventLocation(
  location: string,
  latitude?: number | null,
  longitude?: number | null,
): Promise<ResolvedEventLocation | null> {
  if (latitude != null && longitude != null) {
    return { location: location.trim() || `${latitude}, ${longitude}`, latitude, longitude }
  }

  if (!location.trim()) return null

  const result = await geocodeAddress(location)
  if (!result) return null

  return {
    location: result.location,
    latitude: result.latitude,
    longitude: result.longitude,
  }
}

function openExternalUrl(url: string): void {
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }
}

/** Abre aba em branco mantendo referência (sem noopener, senão retorna null). */
function openPendingMapTab(): Window | null {
  return window.open('about:blank', '_blank')
}

function navigateMapTab(tab: Window | null, url: string): void {
  if (tab && !tab.closed) {
    tab.opener = null
    tab.location.replace(url)
    return
  }
  openExternalUrl(url)
}

function showMapTabLoading(tab: Window | null): void {
  if (!tab || tab.closed) return
  try {
    tab.document.title = 'Carregando mapa...'
    tab.document.body.innerHTML =
      '<p style="margin:0;padding:24px;font-family:system-ui,sans-serif;color:#444;">Carregando mapa...</p>'
  } catch {
    /* ignore */
  }
}

export type OpenEventLocationResult = 'native' | 'desktop' | 'failed'

export async function openEventLocation(options: {
  location: string
  latitude?: number | null
  longitude?: number | null
}): Promise<OpenEventLocationResult> {
  const isMobile = isMobileMapsDevice()

  if (!isMobile && options.latitude != null && options.longitude != null) {
    openExternalUrl(buildMapsSearchUrl(options.location, options.latitude, options.longitude))
    return 'desktop'
  }

  const pendingTab = isMobile ? null : openPendingMapTab()
  showMapTabLoading(pendingTab)

  const resolved = await resolveEventLocation(options.location, options.latitude, options.longitude)

  if (isMobile) {
    const url = buildNativeMapsUrl(
      resolved?.location ?? options.location,
      resolved?.latitude,
      resolved?.longitude,
    )
    openExternalUrl(url)
    return 'native'
  }

  const externalUrl = resolved
    ? buildMapsSearchUrl(resolved.location, resolved.latitude, resolved.longitude)
    : buildMapsSearchUrl(options.location)

  navigateMapTab(pendingTab, externalUrl)
  return resolved ? 'desktop' : 'failed'
}

export async function searchLocations(query: string): Promise<GeocodedPlace[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  return api.get<GeocodedPlace[]>(`/geocode/search${api.buildQuery({ q: trimmed })}`)
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodedPlace | null> {
  return api.get<GeocodedPlace | null>(
    `/geocode/reverse${api.buildQuery({ lat: String(latitude), lon: String(longitude) })}`,
  )
}

export async function geocodeAddress(address: string): Promise<GeocodedPlace | null> {
  const results = await searchLocations(address)
  return results[0] ?? null
}

export const DEFAULT_MAP_CENTER = { lat: -23.5505, lng: -46.6333 } as const

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors'
