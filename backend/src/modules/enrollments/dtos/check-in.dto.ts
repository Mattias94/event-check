import { IsNotEmpty, IsString } from 'class-validator'

export class CheckInDto {
  @IsString()
  @IsNotEmpty({ message: 'Token do QR code é obrigatório' })
  token!: string
}
