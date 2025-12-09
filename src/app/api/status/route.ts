import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface ServiceStatus {
    status: 'online' | 'offline' | 'degraded'
    responseTime: number
    message?: string
}

interface SystemStatus {
    status: 'operational' | 'degraded' | 'down'
    services: {
        database: ServiceStatus
        auth: ServiceStatus
        api: ServiceStatus
    }
    timestamp: string
}

export async function GET() {
    const startTime = Date.now()

    const status: SystemStatus = {
        status: 'operational',
        services: {
            database: { status: 'online', responseTime: 0 },
            auth: { status: 'online', responseTime: 0 },
            api: { status: 'online', responseTime: 0 }
        },
        timestamp: new Date().toISOString()
    }

    // Check Database
    try {
        const dbStart = Date.now()
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error } = await supabase.from('users').select('id').limit(1)
        const dbTime = Date.now() - dbStart

        if (error) {
            status.services.database = {
                status: 'offline',
                responseTime: dbTime,
                message: error.message
            }
            status.status = 'down'
        } else {
            status.services.database = {
                status: dbTime > 1000 ? 'degraded' : 'online',
                responseTime: dbTime
            }
            if (dbTime > 1000) status.status = 'degraded'
        }
    } catch (error) {
        status.services.database = {
            status: 'offline',
            responseTime: 0,
            message: 'Connection failed'
        }
        status.status = 'down'
    }

    // Check Auth
    try {
        const authStart = Date.now()
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const { error } = await supabase.auth.getSession()
        const authTime = Date.now() - authStart

        if (error) {
            status.services.auth = {
                status: 'offline',
                responseTime: authTime,
                message: error.message
            }
            if (status.status !== 'down') status.status = 'degraded'
        } else {
            status.services.auth = {
                status: authTime > 1000 ? 'degraded' : 'online',
                responseTime: authTime
            }
            if (authTime > 1000 && status.status === 'operational') {
                status.status = 'degraded'
            }
        }
    } catch (error) {
        status.services.auth = {
            status: 'offline',
            responseTime: 0,
            message: 'Connection failed'
        }
        if (status.status !== 'down') status.status = 'degraded'
    }

    // API is always online if we got here
    const apiTime = Date.now() - startTime
    status.services.api = {
        status: 'online',
        responseTime: apiTime
    }

    return NextResponse.json(status)
}
