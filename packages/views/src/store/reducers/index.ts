import { CombinedState, combineReducers, Reducer } from 'redux'
import { connectRouter, RouterState } from 'connected-react-router'
import { History } from 'history'
import settings from './settings'
import main from './main'
import { Settings } from '../actions/settings.actions'
import { MainState } from '../actions/main.actions'

export interface AppState {
  router: RouterState
  settings: Settings
  main: MainState
}

const createRootReducer = (
  history: History
): Reducer<CombinedState<AppState>> => {
  return combineReducers({
    router: connectRouter(history),
    settings,
    main
  })
}

export default createRootReducer
