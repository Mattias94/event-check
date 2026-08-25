import { ValidationPipe } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import cookieParser from 'cookie-parser'

const JSON_BODY_LIMIT = '10mb'

function isAllowedOrigin(origin: string): boolean {
  const configured = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  if (configured.includes(origin)) {
    return true
  }

  try {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true
    }
    // Preview/produção Vercel do frontend
    if (hostname.endsWith('.vercel.app') && hostname.includes('event-check')) {
      return true
    }
  } catch {
    return false
  }

  return false
}

export function configureApp(app: NestExpressApplication): void {
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT })
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true })

  app.enableCors({
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
