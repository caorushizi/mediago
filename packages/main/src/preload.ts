import { contextBridge, dialog, ipcRenderer, shell } from 'electron'
import { resolve } from 'path'
import { Video } from './entity'

const apiKey = 'electron'
const api: ElectronApi = {
  store: {
    async set (key, value) {
      return await ipcRenderer.invoke('set-store', key, value)
    },
    async get (key) {
      return await ipcRenderer.invoke('get-store', key)
    }
  },
  isWindows: process.platform === 'win32',
  isMacos: process.platform === 'darwin',
  ipcExec: async (exeFile, args) => await ipcRenderer.invoke('exec-command', exeFile, args),
  openBinDir: async () => {
    const binDir = await ipcRenderer.invoke('get-bin-dir')
    await shell.openPath(binDir)
  },
  openPath: async (workspace) => await shell.openPath(workspace),
  openConfigDir: async () => {
    const appName =
      process.env.NODE_ENV === 'development'
        ? 'media downloader dev'
        : 'media downloader'
    const appPath = await ipcRenderer.invoke('get-path', 'appData')
    await shell.openPath(resolve(appPath, appName))
  },
  openExternal: async (url, options) => await shell.openExternal(url, options),
  openBrowserWindow: (url) => ipcRenderer.send('open-browser-window', url),
  closeBrowserWindow: () => ipcRenderer.send('close-browser-window'),
  getPath: async (name) => await ipcRenderer.invoke('get-path', name),
  showOpenDialog: async (options) => await dialog.showOpenDialog(options),
  getBrowserView: async () => await ipcRenderer.invoke('get-current-window'),
  addEventListener: (channel, listener) => ipcRenderer.on(channel, listener),
  removeEventListener: (channel, listener) =>
    ipcRenderer.removeListener(channel, listener),
  setBrowserViewRect: (rect) =>
    ipcRenderer.send('set-browser-view-bounds', rect),
  closeMainWindow: () => ipcRenderer.send('close-main-window'),
  browserViewGoBack: () => ipcRenderer.send('browser-view-go-back'),
  browserViewReload: () => ipcRenderer.send('browser-view-reload'),
  browserViewLoadURL: (url) => ipcRenderer.send('browser-view-load-url', url),
  itemContextMenu: (item) =>
    ipcRenderer.send('open-download-item-context-menu', item),
  minimize: (name) => ipcRenderer.send('window-minimize', name),
  getVideoList: async () => await ipcRenderer.invoke('get-video-list'),
  addVideo: async (video: Video) => await ipcRenderer.invoke('add-video', video),
  updateVideo: async (id: string, video: Partial<Video>) =>
    await ipcRenderer.invoke('update-video', id, video),
  removeVideo: async (id?: string) => await ipcRenderer.invoke('remove-video', id),
  getCollectionList: async () => await ipcRenderer.invoke('get-collection-list'),
  addCollection: async (video: Video) => await ipcRenderer.invoke('add-collection', video),
  updateCollection: async (id: string, video: Partial<Video>) =>
    await ipcRenderer.invoke('update-collection', id, video),
  removeCollection: async (id?: string) =>
    await ipcRenderer.invoke('remove-collection', id)
}

contextBridge.exposeInMainWorld(apiKey, api)
