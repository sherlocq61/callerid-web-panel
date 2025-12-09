export interface Blacklist {
    id: string
    phone_number: string
    added_by_user_id: string
    reason: string | null
    added_at: string
    is_active: boolean
}

export interface BlacklistStats {
    total_blacklisted: number
    contributors: number
    last_added: string
}

export interface Call {
    id: string
    user_id: string
    device_id: string
    phone_number: string
    contact_name: string | null
    call_type: 'incoming' | 'outgoing' | 'missed'
    duration: number
    timestamp: string
    created_at: string
}

export interface CallWithDetails extends Call {
    call_date: string // Formatted date
    call_time: string // Formatted time (HH:MM)
    duration_formatted: string // Formatted duration (MM:SS)
    is_blacklisted: boolean
}
