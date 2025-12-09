'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Users, UserPlus, Shield, Eye, Trash2, Crown, Settings2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'
import CreateSubAccountModal from './CreateSubAccountModal'

interface TeamMember {
    id: string
    user_id: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
    status: 'active' | 'pending' | 'inactive'
    joined_at: string
    created_by_owner: boolean
    user_email?: string
    user_name?: string
    permissions?: string[]
}

interface Team {
    id: string
    name: string
    max_members: number
    created_at: string
}

export default function TeamManagementPanel() {
    const supabase = createBrowserClient()
    const { showToast, showConfirm } = useNotification()
    const [team, setTeam] = useState<Team | null>(null)
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [currentUserRole, setCurrentUserRole] = useState<string>('')
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        loadTeam()
    }, [])

    const loadTeam = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user's team
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id, role')
                .eq('user_id', user.id)
                .single()

            if (!teamMember) {
                setLoading(false)
                return
            }

            setCurrentUserRole(teamMember.role)

            // Get team details
            const { data: teamData } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamMember.team_id)
                .single()

            setTeam(teamData)

            // Get team members with permissions
            const { data: membersData } = await supabase
                .from('team_members')
                .select(`
                    *,
                    users:user_id (
                        email,
                        full_name
                    )
                `)
                .eq('team_id', teamMember.team_id)
                .order('joined_at', { ascending: true })

            // Load permissions for each member
            const enrichedMembers = await Promise.all(
                (membersData || []).map(async (m) => {
                    const { data: perms } = await supabase
                        .from('team_member_permissions')
                        .select('permission')
                        .eq('team_member_id', m.id)

                    return {
                        ...m,
                        user_email: (m.users as any)?.email,
                        user_name: (m.users as any)?.full_name,
                        permissions: perms?.map(p => p.permission) || []
                    }
                })
            )

            setMembers(enrichedMembers)
        } catch (error) {
            console.error('Error loading team:', error)
        } finally {
            setLoading(false)
        }
    }

    const removeMember = async (memberId: string, memberName: string) => {
        if (!['owner'].includes(currentUserRole)) {
            showToast('Sadece sahip üye çıkarabilir', 'error')
            return
        }

        const confirmed = await showConfirm({
            title: 'Personeli Çıkar',
            message: `${memberName} çıkarılacak. Hesabı da silinecek. Emin misiniz?`,
            confirmText: 'Çıkar',
            type: 'danger'
        })

        if (!confirmed) return

        try {
            // Get user_id before deleting team_member
            const member = members.find(m => m.id === memberId)
            if (!member) return

            // Delete team member (will cascade delete permissions)
            const { error: deleteError } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId)

            if (deleteError) throw deleteError

            // Delete user account if it was created by owner
            if (member.created_by_owner) {
                await supabase.auth.admin.deleteUser(member.user_id)
            }

            showToast('Personel çıkarıldı', 'success')
            loadTeam()
        } catch (error) {
            console.error('Error removing member:', error)
            showToast('Personel çıkarılırken hata oluştu', 'error')
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />
            case 'admin': return <Shield className="w-4 h-4 text-blue-600" />
            case 'member': return <Users className="w-4 h-4 text-green-600" />
            case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />
            default: return null
        }
    }

    const getRoleText = (role: string) => {
        switch (role) {
            case 'owner': return 'Sahip'
            case 'admin': return 'Yönetici'
            case 'member': return 'Üye'
            case 'viewer': return 'İzleyici'
            default: return role
        }
    }

    const getPermissionText = (perm: string) => {
        const map: Record<string, string> = {
            'view_calls': 'Çağrıları Görüntüle',
            'view_blacklist': 'Kara Liste Görüntüle',
            'manage_blacklist': 'Kara Liste Yönet',
            'view_contacts': 'Kişileri Görüntüle',
            'manage_contacts': 'Kişi Yönet',
            'view_appointments': 'Randevuları Görüntüle',
            'manage_appointments': 'Randevu Yönet',
            'view_settings': 'Ayarları Görüntüle',
            'manage_settings': 'Ayarları Yönet'
        }
        return map[perm] || perm
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!team) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ekip Özelliği</h3>
                <p className="text-gray-600 mb-4">
                    Ekip özelliğini kullanmak için Pro veya Enterprise planına yükseltmeniz gerekiyor.
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600" />
                                {team.name}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {members.length} / {team.max_members} personel
                            </p>
                        </div>
                        {currentUserRole === 'owner' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                disabled={members.length >= team.max_members}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" />
                                Yeni Personel
                            </button>
                        )}
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {members.map((member, index) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {member.user_name?.[0] || member.user_email?.[0] || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900">
                                                    {member.user_name || 'İsimsiz'}
                                                </p>
                                                {getRoleIcon(member.role)}
                                                {member.created_by_owner && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                        Personel
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{member.user_email}</p>

                                            {member.permissions && member.permissions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {member.permissions.map(perm => (
                                                        <span
                                                            key={perm}
                                                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                                                        >
                                                            {getPermissionText(perm)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {member.role !== 'owner' && currentUserRole === 'owner' && (
                                            <>
                                                <button
                                                    onClick={() => {/* TODO: Edit permissions */ }}
                                                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="İzinleri Düzenle"
                                                >
                                                    <Settings2 className="w-5 h-5 text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => removeMember(member.id, member.user_name || member.user_email || 'Personel')}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Çıkar"
                                                >
                                                    <Trash2 className="w-5 h-5 text-red-600" />
                                                </button>
                                            </>
                                        )}
                                        {member.role === 'owner' && (
                                            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                                {getRoleText(member.role)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <CreateSubAccountModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadTeam}
            />
        </>
    )
}
