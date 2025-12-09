// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Activity, Filter, Calendar, User, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminLog {
    id: string
    admin_id: string
    action: string
    target_type: string | null
    target_id: string | null
    details: any
    ip_address: string | null
    created_at: string
    users: {
        email: string
        full_name: string
    }
}

export default function AdminLogsPage() {
    const supabase = createBrowserClient()
    const [logs, setLogs] = useState<AdminLog[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>('all')

    useEffect(() => {
        loadLogs()
    }, [filter])

    const loadLogs = async () => {
        try {
            let query = supabase
                .from('admin_logs')
                .select(`
          *,
          users!admin_logs_admin_id_fkey (
            email,
            full_name
          )
        `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (filter !== 'all') {
                query = query.eq('action', filter)
            }

            const { data, error } = await query

            if (error) throw error
            setLogs(data || [])
            setLoading(false)
        } catch (error) {
            console.error('Error loading logs:', error)
            setLoading(false)
        }
    }

    const getActionColor = (action: string) => {
        if (action.includes('approve') || action.includes('create')) {
            return 'bg-green-100 text-green-700 border-green-300'
        } else if (action.includes('reject') || action.includes('delete') || action.includes('cancel')) {
            return 'bg-red-100 text-red-700 border-red-300'
        } else if (action.includes('update') || action.includes('extend')) {
            return 'bg-blue-100 text-blue-700 border-blue-300'
        } else {
            return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    const getActionText = (action: string) => {
        const actionMap: Record<string, string> = {
            'admin_login': '🔐 Admin Girişi',
            'user_role_update': '👤 Rol Güncelleme',
            'payment_approve': '✅ Ödeme Onayı',
            'payment_reject': '❌ Ödeme Reddi',
            'subscription_create': '📦 Paket Oluşturma',
            'subscription_extend': '⏰ Süre Uzatma',
            'subscription_cancel': '🚫 Paket İptali',
            'settings_update': '⚙️ Ayar Güncelleme',
            'user_delete': '🗑️ Kullanıcı Silme'
        }
        return actionMap[action] || action
    }

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Logları</h1>
                    <p className="text-gray-600">Admin aktivitelerini görüntüleyin</p>
                </div>

                {/* Filters */}
                <div className="mb-6 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Tüm Aktiviteler</option>
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{getActionText(action)}</option>
                        ))}
                    </select>
                </div>

                {/* Logs Timeline */}
                <div className="space-y-4">
                    {logs.map((log, index) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Activity className="w-6 h-6 text-white" />
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getActionColor(log.action)}`}>
                                            {getActionText(log.action)}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString('tr-TR')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-900">
                                            {log.users?.full_name || 'İsimsiz'}
                                        </span>
                                        <span className="text-gray-600">({log.users?.email})</span>
                                    </div>

                                    {log.target_type && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span>Hedef: {log.target_type}</span>
                                            {log.target_id && <span className="text-gray-400">• {log.target_id.slice(0, 8)}...</span>}
                                        </div>
                                    )}

                                    {log.details && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-mono text-gray-700">
                                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                            </p>
                                        </div>
                                    )}

                                    {log.ip_address && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            IP: {log.ip_address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {logs.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz log kaydı yok</p>
                    </div>
                )}

                <div className="mt-4 text-sm text-gray-600">
                    Toplam {logs.length} log kaydı (Son 100)
                </div>
            </div>
        </AdminLayout>
    )
}

