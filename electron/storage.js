const fs = require('fs')
const path = require('path')
const { app } = require('electron')

class AuthStorage {
    constructor() {
        this.storePath = path.join(app.getPath('userData'), 'auth-session.json')
    }

    /**
     * Save Supabase session to storage
     */
    saveSession(session) {
        try {
            const data = {
                session: session,
                savedAt: new Date().toISOString()
            }
            fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2))
            console.log('Session saved to:', this.storePath)
            return true
        } catch (error) {
            console.error('Error saving session:', error)
            return false
        }
    }

    /**
     * Get saved session from storage
     */
    getSession() {
        try {
            if (!fs.existsSync(this.storePath)) {
                console.log('No saved session found')
                return null
            }

            const data = JSON.parse(fs.readFileSync(this.storePath, 'utf8'))

            // Check if session exists
            if (!data.session) {
                return null
            }

            // Check if token is expired
            const expiresAt = data.session.expires_at
            if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
                console.log('Session expired')
                this.clearSession()
                return null
            }

            console.log('Session loaded from storage')
            return data.session
        } catch (error) {
            console.error('Error reading session:', error)
            return null
        }
    }

    /**
     * Clear saved session
     */
    clearSession() {
        try {
            if (fs.existsSync(this.storePath)) {
                fs.unlinkSync(this.storePath)
                console.log('Session cleared')
            }
            return true
        } catch (error) {
            console.error('Error clearing session:', error)
            return false
        }
    }
}

module.exports = AuthStorage
