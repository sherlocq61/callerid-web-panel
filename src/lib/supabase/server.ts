import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Supabase Client for Server Components
 * Used in server-side rendering
 */
export const createServerClient = () => {
    return createServerComponentClient({ cookies })
}
