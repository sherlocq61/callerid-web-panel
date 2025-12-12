import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// API endpoint to update device online status
// Called periodically to mark offline devices
export async function POST() {
    try {
        // Use runtime client initialization to avoid build-time env var dependency
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Mark devices as offline if last_seen > 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

        const { error } = await supabase
            .from('devices')
            .update({ is_online: false })
            .eq('is_online', true)
            .lt('last_seen', twoMinutesAgo)

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating device status:', error)
        return NextResponse.json({ error: 'Failed to update device status' }, { status: 500 })
    }
}
