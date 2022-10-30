import { app, BrowserWindow } from 'electron'
import { resolve } from 'path'

const createWindow = async (): Promise<void> => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: resolve(__dirname, 'preload.js')
    }
  })

  await mainWindow.loadURL('http://localhost:5173')

  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().then(r => r).catch(e => e)
    }
  })
}).catch((e) => {

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
