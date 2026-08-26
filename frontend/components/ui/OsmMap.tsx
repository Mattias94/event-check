'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { OSM_ATTRIBUTION } from '../../lib/location-service'

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export interface MapPosition {
  lat: number
  lng: number
}

function MapResizeOnMount() {
  const map = useMap()

  useEffect(() => {
    const resize = () => map.invalidateSize({ animate: false })
    const frame = requestAnimationFrame(resize)
    const timeout = window.setTimeout(resize, 200)
    const timeout2 = window.setTimeout(resize, 500)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timeout)
      window.clearTimeout(timeout2)
    }
  }, [map])

  return null
}

interface MapViewControllerProps {
  center: MapPosition
  zoom: number
}

function MapViewController({ center, zoom }: MapViewControllerProps) {
  const map = useMap()
  const lastTargetRef = useRef('')

  useEffect(() => {
    const targetKey = `${center.lat.toFixed(6)},${center.lng.toFixed(6)},${zoom}`
    if (lastTargetRef.current === targetKey) return
    lastTargetRef.current = targetKey
    map.flyTo(center, zoom, { duration: 0.35 })
  }, [center, map, zoom])

  return null
}

interface MapClickHandlerProps {
  onMapClick?: (lat: number, lng: number) => void
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick

  useMapEvents({
    click(event) {
      onMapClickRef.current?.(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

interface DraggableMarkerProps {
  position: MapPosition
  onDrag?: (lat: number, lng: number) => void
}

function DraggableMarker({ position, onDrag }: DraggableMarkerProps) {
  const onDragRef = useRef(onDrag)
  onDragRef.current = onDrag

  return (
    <Marker
      position={position}
      icon={markerIcon}
      draggable={Boolean(onDrag)}
      eventHandlers={{
        dragend: (event) => {
          const next = event.target.getLatLng()
          onDragRef.current?.(next.lat, next.lng)
        },
      }}
    />
  )
}

export interface OsmMapProps {
  center: MapPosition
  zoom?: number
  marker?: MapPosition | null
  height?: string
  onMapClick?: (lat: number, lng: number) => void
  onMarkerDrag?: (lat: number, lng: number) => void
  interactive?: boolean
  mapKey?: string
}

export function OsmMap({
  center,
  zoom = 13,
  marker = null,
  height = '100%',
  onMapClick,
  onMarkerDrag,
  interactive = true,
  mapKey = 'osm-map',
}: OsmMapProps) {
  const markerPosition = marker ?? center

  return (
    <MapContainer
      key={mapKey}
      center={center}
      zoom={zoom}
      scrollWheelZoom={interactive}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      style={{ height, width: '100%', cursor: interactive && onMapClick ? 'crosshair' : 'default' }}
      className="z-0"
    >
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeOnMount />
      <MapViewController center={center} zoom={zoom} />
      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      <DraggableMarker position={markerPosition} onDrag={onMarkerDrag} />
    </MapContainer>
  )
}
