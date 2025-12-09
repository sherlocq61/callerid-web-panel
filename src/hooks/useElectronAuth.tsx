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
            const savedSession = await window.electron!.auth.getSession()

            if (savedSession) {
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
                    await window.electron!.auth.clearSession()
                    setSession(null)
                } else {
                    setSession(data.session)
                }
            }
        } catch (error) {
            // Silent error handling
        } finally {
            setLoading(false)
        }
    }

    const saveSession = async (session: Session) => {
        if (!isElectron) return
        try {
            await window.electron!.auth.saveSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at || 0
            })
        } catch (error) {
            // Silent error handling
        }
    }

    const clearSession = async () => {
        if (!isElectron) return
        try {
            await window.electron!.auth.clearSession()
            setSession(null)
        } catch (error) {
            // Silent error handling
        }
    }

    // Listen for auth state changes
    useEffect(() => {
        if (!isElectron) return

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            // Only save session on actual sign in, not during restore
            if (event === 'SIGNED_IN' && currentSession && !loading) {
                // Check if this is a real login (not a restore)
                // If we just restored a session, don't save it again
                const timeSinceRestore = Date.now() - (window as any).__lastRestoreTime || Infinity
                if (timeSinceRestore > 5000) { // Only save if more than 5 seconds since restore
                    await saveSession(currentSession)
                }
            } else if (event === 'SIGNED_OUT') {
                await clearSession()
            } else if (event === 'TOKEN_REFRESHED' && currentSession) {
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
