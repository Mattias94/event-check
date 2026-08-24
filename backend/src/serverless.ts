import 'dotenv/config'
import 'reflect-metadata'
import type { IncomingMessage, ServerResponse } from 'http'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { configureApp } from './common/app-config'

/**
 * Entrada serverless (Vercel). Cria o app Nest uma única vez por instância
 * da função e reaproveita entre invocações (cold start só na primeira).
 */
type ExpressInstance = (req: IncomingMessage, res: ServerResponse) => void

let cachedServer: ExpressInstance | undefined

async function getServer(): Promise<ExpressInstance> {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)
    configureApp(app)
    await app.init()
    cachedServer = app.getHttpAdapter().getInstance() as ExpressInstance
  }
  return cachedServer as ExpressInstance
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getServer()
  server(req, res)
}
