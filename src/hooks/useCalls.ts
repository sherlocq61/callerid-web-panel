'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { Call } from '@/lib/supabase/types'
import { useEffect, useState } from 'react'

/**
 * Custom Hook: useCalls
 * Manages call data with real-time updates
 * Single Responsibility: Call data management
 */
export function useCalls() {
    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const supabase = createBrowserClient()

    useEffect(() => {
        // Fetch initial calls
        const fetchCalls = async () => {
            try {
                const { data, error } = await supabase
                    .from('calls')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(50)

                if (error) throw error
                setCalls(data || [])
            } catch (err) {
                setError(err as Error)
            } finally {
                setLoading(false)
            }
        }

        fetchCalls()

        // Subscribe to real-time updates
        const channel = supabase
            .channel('calls-channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'calls',
                },
                (payload) => {
                    setCalls((prev) => [payload.new as Call, ...prev])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return { calls, loading, error }
}
