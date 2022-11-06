import { Container } from 'inversify'
import { TYPES } from './types'
import { MyApp, DB, MainWindow, Config } from './interfaces'
import { Data } from './services/dataSource'
import MainWindowImpl from './services/mainWindow'
import { CoreApp } from './services/coreApp'
import ConfigImpl from './services/configImpl'

const container = new Container({ skipBaseClassChecks: true })
container.bind<DB>(TYPES.DB).to(Data)
container.bind<MyApp>(TYPES.MyApp).to(CoreApp)
container.bind<MainWindow>(TYPES.MainWindow).to(MainWindowImpl)
container.bind<Config>(TYPES.Config).to(ConfigImpl)

export { container }
