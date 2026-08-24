import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'

export function configureApp(app: NestExpressApplication): void {
  const corsOrigin = process.env.CORS_ORIGIN
  const origins = corsOrigin
    ? corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:3000']

  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  })

  app.use(cookieParser())
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  )
}
