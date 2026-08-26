import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @IsString()
  time?: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  location?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number | null

  @IsOptional()
  @IsString()
  placeId?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null
}
