'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Activity, Filter, Calendar, User, Phone, UserPlus, Settings, LogIn, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

interface ActivityLog {
    id: string
    user_id: string
    action: string
    details: any
    created_at: string
    user_email?: string
    user_name?: string
}

interface TeamMember {
    user_id: string
    user_email: string
    user_name: string
}

export default function ActivityLogsPanel() {
    const supabase = createBrowserClient()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [filterUser, setFilterUser] = useState<string>('all')
    const [filterAction, setFilterAction] = useState<string>('all')

    useEffect(() => {
        loadData()

        // Real-time subscription
        const channel = supabase
            .channel('activity-logs')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_logs' },
                () => loadLogs()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filterUser, filterAction])

    const loadData = async () => {
        await Promise.all([loadMembers(), loadLogs()])
    }

    const loadMembers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (!teamMember) return

            const { data } = await supabase
                .from('team_members')
                .select(`
                    user_id,
                    users:user_id (
                        email,
                        full_name
                    )
                `)
                .eq('team_id', teamMember.team_id)

            const enrichedMembers = data?.map(m => ({
                user_id: m.user_id,
                user_email: (m.users as any)?.email || '',
                user_name: (m.users as any)?.full_name || ''
            })) || []

            setMembers(enrichedMembers)
        } catch (error) {
            console.error('Error loading members:', error)
        }
    }

    const loadLogs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (!teamMember) {
                setLoading(false)
                return
            }

            let query = supabase
                .from('activity_logs')
                .select(`
                    *,
                    users:user_id (
                        email,
                        full_name
                    )
                `)
                .eq('team_id', teamMember.team_id)
                .order('created_at', { ascending: false })
                .limit(100)

            if (filterUser !== 'all') {
                query = query.eq('user_id', filterUser)
            }

            if (filterAction !== 'all') {
                query = query.eq('action', filterAction)
            }

            const { data } = await query

            const enrichedLogs = data?.map(log => ({
                ...log,
                user_email: log.users?.email,
                user_name: log.users?.full_name
            })) || []

            setLogs(enrichedLogs)
        } catch (error) {
            console.error('Error loading logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login': return <LogIn className="w-4 h-4 text-green-600" />
            case 'logout': return <LogOut className="w-4 h-4 text-gray-600" />
            case 'call_viewed': return <Phone className="w-4 h-4 text-blue-600" />
            case 'contact_added': return <UserPlus className="w-4 h-4 text-purple-600" />
            case 'settings_changed': return <Settings className="w-4 h-4 text-orange-600" />
            default: return <Activity className="w-4 h-4 text-gray-600" />
        }
    }

    const getActionText = (action: string) => {
        switch (action) {
            case 'login': return 'Giriş Yaptı'
            case 'logout': return 'Çıkış Yaptı'
            case 'call_viewed': return 'Çağrı Görüntüledi'
            case 'contact_added': return 'Kişi Ekledi'
            case 'contact_edited': return 'Kişi Düzenledi'
            case 'blacklist_added': return 'Kara Listeye Ekledi'
            case 'appointment_created': return 'Randevu Oluşturdu'
            case 'settings_changed': return 'Ayarları Değiştirdi'
            default: return action
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Az önce'
        if (minutes < 60) return `${minutes} dakika önce`
        if (hours < 24) return `${hours} saat önce`
        if (days < 7) return `${days} gün önce`

        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" />
                        Aktivite Logları
                    </h2>
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tüm Kullanıcılar</option>
                            {members.map(member => (
                                <option key={member.user_id} value={member.user_id}>
                                    {member.user_name || member.user_email}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tüm Aktiviteler</option>
                            <option value="login">Giriş</option>
                            <option value="logout">Çıkış</option>
                            <option value="call_viewed">Çağrı Görüntüleme</option>
                            <option value="contact_added">Kişi Ekleme</option>
                            <option value="blacklist_added">Kara Liste</option>
                            <option value="appointment_created">Randevu</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz aktivite kaydı yok</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map((log, index) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">
                                                {log.user_name || log.user_email}
                                            </span>
                                            <span className="text-gray-600">•</span>
                                            <span className="text-sm text-gray-600">
                                                {getActionText(log.action)}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <p className="text-sm text-gray-500">
                                                {JSON.stringify(log.details)}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(log.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
