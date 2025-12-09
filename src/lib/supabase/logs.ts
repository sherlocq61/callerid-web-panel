import { createBrowserClient } from './client'

export interface LogAction {
    action: string
    target_type?: string
    target_id?: string
    details?: any
}

/**
 * Admin aktivitelerini loglar
 */
export async function logAdminAction({
    action,
    target_type,
    target_id,
    details
}: LogAction) {
    try {
        const supabase = createBrowserClient()

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Get IP address (client-side approximation)
        const ip_address = 'client-side' // Server-side'da daha doğru alınabilir

        const { error } = await supabase
            .from('admin_logs')
            .insert({
                admin_id: session.user.id,
                action,
                target_type,
                target_id,
                details: details ? JSON.stringify(details) : null,
                ip_address
            })

        if (error) {
            console.error('Error logging admin action:', error)
        }
    } catch (error) {
        console.error('Error in logAdminAction:', error)
    }
}

/**
 * Kullanıcı aktivitelerini loglar
 */
export async function logUserActivity({
    action,
    target_type,
    target_id,
    details
}: LogAction) {
    try {
        const supabase = createBrowserClient()

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { error } = await supabase
            .from('user_activity_logs')
            .insert({
                user_id: session.user.id,
                action,
                target_type,
                target_id,
                details: details ? JSON.stringify(details) : null
            })

        if (error) {
            console.error('Error logging user activity:', error)
        }
    } catch (error) {
        console.error('Error in logUserActivity:', error)
    }
}

/**
 * Log action types
 */
export const LOG_ACTIONS = {
    // Admin actions
    ADMIN_LOGIN: 'admin_login',
    USER_ROLE_UPDATE: 'user_role_update',
    PAYMENT_APPROVE: 'payment_approve',
    PAYMENT_REJECT: 'payment_reject',
    SUBSCRIPTION_CREATE: 'subscription_create',
    SUBSCRIPTION_EXTEND: 'subscription_extend',
    SUBSCRIPTION_UPDATE: 'subscription_update',
    SUBSCRIPTION_CANCEL: 'subscription_cancel',
    SETTINGS_UPDATE: 'settings_update',
    USER_DELETE: 'user_delete',

    // User actions
    USER_LOGIN: 'user_login',
    USER_REGISTER: 'user_register',
    PAYMENT_REQUEST: 'payment_request',
    CONTACT_CREATE: 'contact_create',
    CONTACT_UPDATE: 'contact_update',
    CONTACT_DELETE: 'contact_delete',
    CALL_LOG: 'call_log',
    BLACKLIST_ADD: 'blacklist_add'
} as const
