import 'reflect-metadata'
import { container } from './inversify.config'
import { TYPES } from './types'
import { MyApp } from './interfaces'
import { app } from 'electron'

async function bootstrap (): Promise<void> {
  await app.whenReady()
  const myApp = container.get<MyApp>(TYPES.MyApp)
  await myApp.init()
}

void bootstrap()
