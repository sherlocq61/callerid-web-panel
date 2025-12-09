const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const AuthStorage = require('./storage')

const authStorage = new AuthStorage()

// Simple file-based storage
const storePath = path.join(app.getPath('userData'), 'session-store.json')

function getStore() {
    try {
        if (fs.existsSync(storePath)) {
            return JSON.parse(fs.readFileSync(storePath, 'utf8'))
        }
    } catch (e) {
        console.error('Error reading store:', e)
    }
    return {}
}

function setStore(data) {
    try {
        fs.writeFileSync(storePath, JSON.stringify(data, null, 2))
    } catch (e) {
        console.error('Error writing store:', e)
    }
}

let mainWindow
let tray
let nextProcess

function startNextServer() {
    return new Promise((resolve) => {
        console.log('Starting Next.js server...')
        nextProcess = spawn('npm', ['run', 'start'], {
            cwd: path.join(__dirname, '..'),
            shell: true
        })

        nextProcess.stdout.on('data', (data) => {
            console.log(`Next.js: ${data}`)
            if (data.toString().includes('Ready')) {
                resolve()
            }
        })

        nextProcess.stderr.on('data', (data) => {
            console.error(`Next.js Error: ${data}`)
        })

        setTimeout(resolve, 5000)
    })
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            partition: 'persist:callerid',
            webSecurity: true,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'icon.png'),
        show: false,
        backgroundColor: '#f3f4f6'
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('Failed to load:', errorCode, errorDescription)
        setTimeout(() => {
            mainWindow.loadURL('http://localhost:3000')
        }, 2000)
    })

    // Use app.isPackaged instead of NODE_ENV
    if (!app.isPackaged) {
        // Development mode
        setTimeout(() => {
            console.log('Development: Loading http://localhost:3000/login')
            mainWindow.loadURL('http://localhost:3000/login').then(() => {
                console.log('Successfully loaded!')
                mainWindow.webContents.openDevTools()
            }).catch(err => {
                console.error('Failed to load URL:', err)
            })
        }, 5000)
    } else {
        // Production mode - NO DevTools
        startNextServer().then(() => {
            setTimeout(() => {
                mainWindow.loadURL('http://localhost:3000/login')
            }, 2000)
        })
    }

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault()
            mainWindow.hide()
        }
        return false
    })
}

function createTray() {
    const iconPath = path.join(__dirname, 'tray-icon.png')
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

    tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Göster',
            click: () => {
                mainWindow.show()
                mainWindow.focus()
            }
        },
        {
            label: 'Gizle',
            click: () => {
                mainWindow.hide()
            }
        },
        { type: 'separator' },
        {
            label: 'Çıkış',
            click: () => {
                app.isQuitting = true
                app.quit()
            }
        }
    ])

    tray.setToolTip('Çağrı Yönetim Sistemi')
    tray.setContextMenu(contextMenu)

    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
            mainWindow.focus()
        }
    })
}

// IPC Handlers
ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({
        title,
        body,
        icon: path.join(__dirname, 'icon.png')
    }).show()
})

ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide()
})

ipcMain.on('incoming-call', (event, { phoneNumber, contactName }) => {
    if (!mainWindow.isVisible()) {
        mainWindow.show()
    }
    mainWindow.focus()
    mainWindow.flashFrame(true)

    new Notification({
        title: '📞 Gelen Çağrı',
        body: contactName ? `${contactName} (${phoneNumber})` : phoneNumber,
        icon: path.join(__dirname, 'icon.png')
    }).show()
})

// Session storage handlers - using simple JSON file
ipcMain.on('storage-set', (event, { key, value }) => {
    const store = getStore()
    store[key] = value
    setStore(store)
})

ipcMain.handle('storage-get', async (event, key) => {
    const store = getStore()
    return store[key]
})

ipcMain.on('storage-remove', (event, key) => {
    const store = getStore()
    delete store[key]
    setStore(store)
})

// Auth session handlers
ipcMain.handle('auth-save-session', async (event, session) => {
    return authStorage.saveSession(session)
})

ipcMain.handle('auth-get-session', async () => {
    return authStorage.getSession()
})

ipcMain.handle('auth-clear-session', async () => {
    return authStorage.clearSession()
})

// App lifecycle
app.whenReady().then(() => {
    createWindow()
    createTray()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    app.isQuitting = true
    if (nextProcess) {
        nextProcess.kill()
    }
})
