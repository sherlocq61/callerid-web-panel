import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// API endpoint to update device online status
// Called periodically to mark offline devices
export async function POST() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
        )

        // Mark devices as offline if last_seen > 2 minutes
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

        const { error } = await supabase
            .from('devices')
            .update({ is_online: false })
            .eq('is_online', true)
            .lt('last_seen', twoMinutesAgo)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating device status:', error)
        return NextResponse.json({ error: 'Failed to update device status' }, { status: 500 })
    }
}
