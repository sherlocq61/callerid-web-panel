import { createClient } from '@supabase/supabase-js'

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null

/**
 * Supabase Client for Client Components
 * Uses singleton pattern to avoid multiple instances
 */
export const createBrowserClient = () => {
    if (supabaseInstance) {
        return supabaseInstance
    }

    supabaseInstance = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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
