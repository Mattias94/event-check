'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { MapPosition } from './OsmMap'

const OsmMap = dynamic(() => import('./OsmMap').then((module) => module.OsmMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[10rem] items-center justify-center bg-muted/30">
      <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Carregando mapa...</span>
    </div>
  ),
})

export interface OsmMapLazyProps {
  center: MapPosition
  zoom?: number
  marker?: MapPosition | null
  height?: string
  onMapClick?: (lat: number, lng: number) => void
  onMarkerDrag?: (lat: number, lng: number) => void
  interactive?: boolean
  mapKey?: string
}

export default function OsmMapLazy(props: OsmMapLazyProps) {
  return <OsmMap {...props} />
}
