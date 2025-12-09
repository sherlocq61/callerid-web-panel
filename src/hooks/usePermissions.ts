import { createBrowserClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'

interface UsePermissionsReturn {
    permissions: string[]
    isSubAccount: boolean
    ownerUserId: string | null
    loading: boolean
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    hasAllPermissions: (permissions: string[]) => boolean
}

export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<string[]>([])
    const [isSubAccount, setIsSubAccount] = useState(false)
    const [ownerUserId, setOwnerUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        loadPermissions()
    }, [])

    const loadPermissions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Check if user is a sub-account
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('id, created_by_owner, owner_user_id')
                .eq('user_id', user.id)
                .eq('created_by_owner', true)
                .single()

            if (teamMember) {
                setIsSubAccount(true)
                setOwnerUserId(teamMember.owner_user_id)

                // Load permissions
                const { data: perms } = await supabase
                    .from('team_member_permissions')
                    .select('permission')
                    .eq('team_member_id', teamMember.id)

                setPermissions(perms?.map(p => p.permission) || [])
            } else {
                // Owner account - has all permissions
                setIsSubAccount(false)
                setOwnerUserId(null)
                setPermissions([
                    'view_calls',
                    'view_blacklist',
                    'manage_blacklist',
                    'view_contacts',
                    'manage_contacts',
                    'view_appointments',
                    'manage_appointments',
                    'view_settings',
                    'manage_settings'
                ])
            }
        } catch (error) {
            console.error('Error loading permissions:', error)
        } finally {
            setLoading(false)
        }
    }

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission)
    }

    const hasAnyPermission = (perms: string[]): boolean => {
        return perms.some(p => permissions.includes(p))
    }

    const hasAllPermissions = (perms: string[]): boolean => {
        return perms.every(p => permissions.includes(p))
    }

    return {
        permissions,
        isSubAccount,
        ownerUserId,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    }
}
