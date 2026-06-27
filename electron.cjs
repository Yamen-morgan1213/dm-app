const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Yamen Ebrahim | Web Developer Portal",
    icon: path.join(__dirname, 'public/icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Load the production Vercel app
  win.loadURL('https://dm-129lnqf7j-yamen-morgan1213s-projects.vercel.app/')

  // Hide the default file/edit menu bar for a clean, premium app interface
  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
