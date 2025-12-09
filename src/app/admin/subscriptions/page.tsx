// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Package, Calendar, Edit } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'

interface Subscription {
    id: string
    user_id: string
    plan: string
    status: string
    max_devices: number
    expires_at: string
    users: {
        email: string
        full_name: string
    }
}

export default function AdminSubscriptionsPage() {
    const supabase = createBrowserClient()
    const { showToast, showConfirm, showPrompt } = useNotification()
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSubscriptions()
    }, [])

    const loadSubscriptions = async () => {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select(`
          *,
          users!subscriptions_user_id_fkey (
            email,
            full_name
          )
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setSubscriptions(data || [])
            setLoading(false)
        } catch (error) {
            console.error('Error loading subscriptions:', error)
            setLoading(false)
        }
    }

    const handleExtend = async (subId: string, days: number) => {
        const confirmed = await showConfirm({
            title: 'Süre Uzat',
            message: `${days} gün süre uzatmak istediğinizden emin misiniz?`,
            confirmText: 'Uzat',
            type: 'info'
        })

        if (!confirmed) return

        try {
            const sub = subscriptions.find(s => s.id === subId)
            if (!sub) return

            const currentExpiry = new Date(sub.expires_at)
            const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000)

            const { error } = await supabase
                .from('subscriptions')
                .update({ expires_at: newExpiry.toISOString() })
                .eq('id', subId)

            if (error) throw error

            // Log admin action
            const { logAdminAction, LOG_ACTIONS } = await import('@/lib/supabase/logs')
            await logAdminAction({
                action: LOG_ACTIONS.SUBSCRIPTION_EXTEND,
                target_type: 'subscription',
                target_id: subId,
                details: { days, user_id: sub.user_id, plan: sub.plan }
            })

            showToast('Süre başarıyla uzatıldı!', 'success')
            loadSubscriptions()
        } catch (error) {
            console.error('Error extending subscription:', error)
            showToast('Süre uzatılırken hata oluştu', 'error')
        }
    }

    const handleEditExpiry = async (subId: string) => {
        const sub = subscriptions.find(s => s.id === subId)
        if (!sub) return

        const currentDate = new Date(sub.expires_at).toISOString().split('T')[0]

        const newDate = await showPrompt({
            title: 'Bitiş Tarihini Düzenle',
            message: 'Yeni bitiş tarihini seçin (YYYY-MM-DD):',
            defaultValue: currentDate,
            confirmText: 'Kaydet'
        })

        if (!newDate) return

        try {
            const { error } = await supabase
                .from('subscriptions')
                .update({ expires_at: new Date(newDate).toISOString() })
                .eq('id', subId)

            if (error) throw error

            // Log admin action
            const { logAdminAction, LOG_ACTIONS } = await import('@/lib/supabase/logs')
            await logAdminAction({
                action: LOG_ACTIONS.SUBSCRIPTION_UPDATE,
                target_type: 'subscription',
                target_id: subId,
                details: { old_date: sub.expires_at, new_date: newDate, user_id: sub.user_id }
            })

            showToast('Bitiş tarihi güncellendi!', 'success')
            loadSubscriptions()
        } catch (error) {
            console.error('Error updating expiry:', error)
            showToast('Tarih güncellenirken hata oluştu', 'error')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700 border-green-300'
            case 'cancelled':
                return 'bg-orange-100 text-orange-700 border-orange-300'
            case 'expired':
                return 'bg-red-100 text-red-700 border-red-300'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'lite':
                return 'from-orange-500 to-amber-500'
            case 'pro':
                return 'from-blue-500 to-cyan-500'
            case 'enterprise':
                return 'from-purple-500 to-pink-500'
            default:
                return 'from-gray-500 to-gray-600'
        }
    }

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Paket Yönetimi</h1>
                    <p className="text-gray-600">Kullanıcı paketlerini görüntüleyin ve yönetin</p>
                </div>

                {/* Subscriptions Grid */}
                <div className="grid grid-cols-1 gap-6">
                    {subscriptions.map((sub) => (
                        <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{sub.users?.full_name || 'İsimsiz'}</h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(sub.status)}`}>
                                            {sub.status === 'active' ? 'Aktif' : sub.status === 'cancelled' ? 'İptal' : 'Süresi Doldu'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600">{sub.users?.email}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getPlanColor(sub.plan)} text-white font-semibold`}>
                                    {sub.plan.toUpperCase()}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Package className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-gray-500">Cihaz Limiti</p>
                                        <p className="font-semibold">{sub.max_devices} Cihaz</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-gray-500">Bitiş Tarihi</p>
                                        <p className="font-semibold">{new Date(sub.expires_at).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-gray-500">Kalan Gün</p>
                                        <p className="font-semibold">
                                            {Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Gün
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {sub.status === 'active' && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExtend(sub.id, 30)}
                                            className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                                        >
                                            +30 Gün
                                        </button>
                                        <button
                                            onClick={() => handleExtend(sub.id, 90)}
                                            className="flex-1 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-medium transition-colors"
                                        >
                                            +90 Gün
                                        </button>
                                        <button
                                            onClick={() => handleExtend(sub.id, 365)}
                                            className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg font-medium transition-colors"
                                        >
                                            +1 Yıl
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleEditExpiry(sub.id)}
                                        className="w-full px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Bitiş Tarihini Düzenle
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {subscriptions.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz aktif paket yok</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

