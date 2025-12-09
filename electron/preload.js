const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    // Desktop notifications
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body })
    },

    // System tray
    minimizeToTray: () => {
        ipcRenderer.send('minimize-to-tray')
    },

    // Incoming call - bring window to front
    incomingCall: (phoneNumber, contactName) => {
        ipcRenderer.send('incoming-call', { phoneNumber, contactName })
    },

    // Session storage for general use
    storage: {
        setItem: (key, value) => {
            ipcRenderer.send('storage-set', { key, value })
        },
        getItem: async (key) => {
            return await ipcRenderer.invoke('storage-get', key)
        },
        removeItem: (key) => {
            ipcRenderer.send('storage-remove', key)
        }
    },

    // Auth session management
    auth: {
        saveSession: async (session) => {
            return await ipcRenderer.invoke('auth-save-session', session)
        },
        getSession: async () => {
            return await ipcRenderer.invoke('auth-get-session')
        },
        clearSession: async () => {
            return await ipcRenderer.invoke('auth-clear-session')
        }
    },

    // Platform info
    platform: process.platform,
    isElectron: true
})
