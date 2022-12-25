export interface MainState {
  notifyCount: number
}

export const UPDATE_NOTIFY_COUNT = 'UPDATE_NOTIFY_COUNT'

export interface UpdateNotifyCount {
  type: typeof UPDATE_NOTIFY_COUNT
  payload: number
}

export const updateNotifyCount = (count: number): UpdateNotifyCount => ({
  type: UPDATE_NOTIFY_COUNT,
  payload: count
})

export type MainUnionType = UpdateNotifyCount
