import 'reflect-metadata'
import { container } from './inversify.config'
import { TYPES } from './types'
import { MyApp } from './interfaces'

const app = container.get<MyApp>(TYPES.MyApp)

app.init().then(() => {
  console.log('执行成功')
}).catch(() => {
  console.log('执行失败')
})
