import { createBrowserClient } from '@/lib/supabase/client'

/**
 * Activity Logger Utility
 * Automatically logs user actions to activity_logs table
 */

export type ActivityAction =
    | 'login'
    | 'logout'
    | 'call_viewed'
    | 'contact_added'
    | 'contact_edited'
    | 'contact_deleted'
    | 'blacklist_added'
    | 'blacklist_removed'
    | 'appointment_created'
    | 'appointment_cancelled'
    | 'settings_changed'
    | 'team_member_added'
    | 'team_member_removed'
    | 'device_registered'

interface ActivityDetails {
    [key: string]: any
}

class ActivityLogger {
    private supabase = createBrowserClient()
    private teamId: string | null = null

    async initialize() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser()
            if (!user) return

            // Get user's team
            const { data: teamMember } = await this.supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            this.teamId = teamMember?.team_id || null
        } catch (error) {
            console.error('Error initializing activity logger:', error)
        }
    }

    async log(action: ActivityAction, details?: ActivityDetails) {
        try {
            const { data: { user } } = await this.supabase.auth.getUser()
            if (!user) return

            // Get IP and user agent from browser
            const userAgent = navigator.userAgent

            // Log activity
            await this.supabase
                .from('activity_logs')
                .insert({
                    user_id: user.id,
                    team_id: this.teamId,
                    action,
                    details: details || {},
                    user_agent: userAgent,
                    created_at: new Date().toISOString()
                })

            console.log(`[Activity] ${action}`, details)
        } catch (error) {
            console.error('Error logging activity:', error)
        }
    }

    // Convenience methods
    async logLogin() {
        await this.initialize()
        await this.log('login')
    }

    async logLogout() {
        await this.log('logout')
    }

    async logCallViewed(callId: string, phoneNumber: string) {
        await this.log('call_viewed', { call_id: callId, phone_number: phoneNumber })
    }

    async logContactAdded(contactId: string, phoneNumber: string) {
        await this.log('contact_added', { contact_id: contactId, phone_number: phoneNumber })
    }

    async logContactEdited(contactId: string) {
        await this.log('contact_edited', { contact_id: contactId })
    }

    async logContactDeleted(contactId: string) {
        await this.log('contact_deleted', { contact_id: contactId })
    }

    async logBlacklistAdded(phoneNumber: string, reason?: string) {
        await this.log('blacklist_added', { phone_number: phoneNumber, reason })
    }

    async logBlacklistRemoved(phoneNumber: string) {
        await this.log('blacklist_removed', { phone_number: phoneNumber })
    }

    async logAppointmentCreated(appointmentId: string, phoneNumber: string) {
        await this.log('appointment_created', { appointment_id: appointmentId, phone_number: phoneNumber })
    }

    async logAppointmentCancelled(appointmentId: string) {
        await this.log('appointment_cancelled', { appointment_id: appointmentId })
    }

    async logSettingsChanged(settings: string[]) {
        await this.log('settings_changed', { changed_settings: settings })
    }

    async logTeamMemberAdded(userId: string, role: string) {
        await this.log('team_member_added', { user_id: userId, role })
    }

    async logTeamMemberRemoved(userId: string) {
        await this.log('team_member_removed', { user_id: userId })
    }

    async logDeviceRegistered(deviceId: string, deviceName: string) {
        await this.log('device_registered', { device_id: deviceId, device_name: deviceName })
    }
}

// Singleton instance
const activityLogger = new ActivityLogger()

export default activityLogger
