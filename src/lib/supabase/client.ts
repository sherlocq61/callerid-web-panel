import { createClient } from '@supabase/supabase-js'

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

/**
 * Custom storage adapter for Electron that uses file-based storage
 */
const createElectronStorageAdapter = () => {
    const isElectron = typeof window !== 'undefined' && (window as any).electron?.isElectron

    if (!isElectron) {
        // Use localStorage for web
        return typeof window !== 'undefined' ? window.localStorage : undefined
    }

    // For Electron, create a synchronous wrapper around async storage
    // We'll use a memory cache that syncs with file storage
    let memoryCache: { [key: string]: string } = {}

    // Load initial data from Electron storage
    if (typeof window !== 'undefined' && (window as any).electron) {
        // Load auth session on init
        (window as any).electron.auth.getSession().then((session: any) => {
            if (session) {
                const key = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`
                memoryCache[key] = JSON.stringify(session)
                console.log('[Electron Storage] Loaded session from file storage')
            }
        }).catch((err: any) => {
            console.error('[Electron Storage] Error loading initial session:', err)
        })
    }

    return {
        getItem: (key: string) => {
            const value = memoryCache[key] || null
            console.log('[Electron Storage] getItem:', key, value ? 'found' : 'not found')
            return value
        },
        setItem: (key: string, value: string) => {
            console.log('[Electron Storage] setItem:', key)
            memoryCache[key] = value

            // Save to Electron file storage asynchronously
            if (typeof window !== 'undefined' && (window as any).electron) {
                try {
                    const session = JSON.parse(value)
                        ; (window as any).electron.auth.saveSession(session).then(() => {
                            console.log('[Electron Storage] Saved to file storage')
                        }).catch((err: any) => {
                            console.error('[Electron Storage] Error saving to file:', err)
                        })
                } catch (err) {
                    console.error('[Electron Storage] Error parsing session:', err)
                }
            }
        },
        removeItem: (key: string) => {
            console.log('[Electron Storage] removeItem:', key)
            delete memoryCache[key]

            // Clear from Electron file storage
            if (typeof window !== 'undefined' && (window as any).electron) {
                (window as any).electron.auth.clearSession().catch((err: any) => {
                    console.error('[Electron Storage] Error clearing file storage:', err)
                })
            }
        }
    }
}

/**
 * Supabase Client for Client Components
 * Uses singleton pattern to avoid multiple instances
 */
export const createBrowserClient = () => {
    if (supabaseInstance) {
        return supabaseInstance
    }

    const storage = createElectronStorageAdapter()

    supabaseInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: storage as any,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce'
            }
        }
    )

    return supabaseInstance
}

/**
 * Supabase Client with service role
 * Only use in server-side code
 */
export const createServiceClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
