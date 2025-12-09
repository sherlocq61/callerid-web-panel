/**
 * Database Types
 * Auto-generated from Supabase schema
 */

export type CallType = 'incoming' | 'outgoing' | 'missed'
export type DevicePlatform = 'android' | 'ios'
export type SubscriptionPlan = 'lite' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface User {
    id: string
    email: string
    full_name: string | null
    created_at: string
    updated_at: string
}

export interface Call {
    id: string
    user_id: string
    device_id: string
    phone_number: string
    contact_name: string | null
    call_type: CallType
    duration: number
    timestamp: string
    created_at: string
}

export interface Contact {
    id: string
    user_id: string
    phone_number: string
    name: string
    save_to_device: boolean
    notes: string | null
    created_at: string
    updated_at: string
}

export interface Device {
    id: string
    user_id: string
    device_name: string
    device_id: string
    platform: DevicePlatform
    fcm_token: string | null
    is_active: boolean
    last_seen: string
    created_at: string
}

export interface Subscription {
    id: string
    user_id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    max_devices: number
    started_at: string
    expires_at: string | null
    created_at: string
}
