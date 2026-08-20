import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateEventDto {
  @IsString()
  @MinLength(3)
  title!: string

  @IsString()
  @MinLength(10)
  description!: string

  @IsString()
  category!: string

  @IsDateString()
  date!: string

  @IsString()
  time!: string

  @IsString()
  @MinLength(3)
  location!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number

  @IsString()
  createdBy!: string

  @IsOptional()
  @IsString()
  status?: 'active' | 'cancelled' | 'finished'

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null
}
