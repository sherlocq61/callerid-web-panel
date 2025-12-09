'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

declare global {
    interface Window {
        electron?: {
            isElectron: boolean
            auth: {
                saveSession: (session: any) => Promise<boolean>
                getSession: () => Promise<any>
                clearSession: () => Promise<boolean>
            }
        }
    }
}

/**
 * Custom hook for Electron auth with persistent session
 */
export function useElectronAuth() {
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<any>(null)
    const router = useRouter()
    const supabase = createBrowserClient()
    const isElectron = typeof window !== 'undefined' && window.electron?.isElectron

    useEffect(() => {
        if (!isElectron) {
            setLoading(false)
            return
        }

        // Restore session from Electron storage on mount
        restoreSession()
    }, [isElectron])

    const restoreSession = async () => {
        try {
            console.log('Restoring session from Electron storage...')
            const savedSession = await window.electron!.auth.getSession()

            if (savedSession) {
                console.log('Found saved session, restoring to Supabase...')

                    // Mark restore time to prevent duplicate saves
                    (window as any).__lastRestoreTime = Date.now()

                // Set session state immediately
                setSession(savedSession)

                // Restore session to Supabase
                const { data, error } = await supabase.auth.setSession({
                    access_token: savedSession.access_token,
                    refresh_token: savedSession.refresh_token
                })

                if (error) {
                    console.error('Error restoring session:', error)
                    await window.electron!.auth.clearSession()
                    setSession(null)
                } else {
                    console.log('Session restored successfully!')
                    setSession(data.session)
                }
            } else {
                console.log('No saved session found')
            }
        } catch (error) {
            console.error('Error in restoreSession:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveSession = async (session: Session) => {
        if (!isElectron) return
        try {
            console.log('Saving session to Electron storage...')
            await window.electron!.auth.saveSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at || 0
            })
        } catch (error) {
            console.error('Error saving session:', error)
        }
    }

    const clearSession = async () => {
        if (!isElectron) return
        try {
            console.log('Clearing session from Electron storage...')
            await window.electron!.auth.clearSession()
            setSession(null)
        } catch (error) {
            console.error('Error clearing session:', error)
        }
    }

    // Listen for auth state changes
    useEffect(() => {
        if (!isElectron) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('Auth state changed:', event)

            // Only save session on actual sign in, not during restore
            if (event === 'SIGNED_IN' && currentSession && !loading) {
                // Check if this is a real login (not a restore)
                // If we just restored a session, don't save it again
                const timeSinceRestore = Date.now() - (window as any).__lastRestoreTime || Infinity
                if (timeSinceRestore > 5000) { // Only save if more than 5 seconds since restore
                    console.log('Saving session to Electron storage...')
                    await saveSession(currentSession)
                }
            } else if (event === 'SIGNED_OUT') {
                await clearSession()
            } else if (event === 'TOKEN_REFRESHED' && currentSession) {
                console.log('Token refreshed, updating session...')
                await saveSession(currentSession)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [isElectron, loading])

    return {
        session,
        loading,
        isElectron,
        saveSession,
        clearSession
    }
}
