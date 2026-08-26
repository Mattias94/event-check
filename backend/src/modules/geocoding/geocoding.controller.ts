import { Controller, Get, Query, BadRequestException } from '@nestjs/common'
import { GeocodingService } from './geocoding.service'

@Controller('geocode')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('search')
  search(@Query('q') query?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Informe um endereço para buscar')
    }
    return this.geocodingService.search(query)
  }

  @Get('reverse')
  reverse(@Query('lat') lat?: string, @Query('lon') lon?: string) {
    const latitude = Number(lat)
    const longitude = Number(lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('Coordenadas inválidas')
    }
    return this.geocodingService.reverse(latitude, longitude)
  }
}
