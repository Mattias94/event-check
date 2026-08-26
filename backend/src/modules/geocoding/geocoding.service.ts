import { Injectable, ServiceUnavailableException } from '@nestjs/common'

export interface GeocodedPlace {
  location: string
  latitude: number
  longitude: number
  placeId: string | null
}

interface NominatimSearchResult {
  place_id: number
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
}

interface NominatimReverseResult {
  place_id: number
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
}

@Injectable()
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org'
  private readonly userAgent = 'EventCheck/1.0 (https://event-check-seven.vercel.app; contact@event-check.local)'
  private lastRequestAt = 0

  private async throttle() {
    const elapsed = Date.now() - this.lastRequestAt
    if (elapsed < 1100) {
      await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed))
    }
    this.lastRequestAt = Date.now()
  }

  private mapSearchResult(result: NominatimSearchResult): GeocodedPlace {
    return {
      location: result.display_name,
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      placeId: `${result.osm_type}:${result.osm_id}`,
    }
  }

  private async fetchNominatim<T>(path: string, params: Record<string, string>): Promise<T> {
    await this.throttle()

    const url = new URL(`${this.baseUrl}${path}`)
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))

    let response: Response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
      })
    } catch {
      throw new ServiceUnavailableException('Serviço de mapas temporariamente indisponível')
    }

    if (!response.ok) {
      throw new ServiceUnavailableException('Serviço de mapas temporariamente indisponível')
    }

    return response.json() as Promise<T>
  }

  async search(query: string): Promise<GeocodedPlace[]> {
    const results = await this.fetchNominatim<NominatimSearchResult[]>('/search', {
      q: query.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '6',
      countrycodes: 'br',
    })

    return results.map((result) => this.mapSearchResult(result))
  }

  async reverse(latitude: number, longitude: number): Promise<GeocodedPlace | null> {
    const result = await this.fetchNominatim<NominatimReverseResult>('/reverse', {
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1',
    })

    if (!result?.display_name) return null
    return this.mapSearchResult(result)
  }

  async geocode(address: string): Promise<GeocodedPlace | null> {
    const results = await this.search(address)
    return results[0] ?? null
  }
}
