// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, User, Calendar, CreditCard, LogOut, RefreshCw } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useNotification } from '@/components/notifications/NotificationProvider'



interface PaymentRequest {
    id: string
    user_id: string
    plan: string
    amount: number
    payer_name: string
    payment_date: string
    status: string
    created_at: string
    users: {
        email: string
        full_name: string
    }
}

export default function AdminPaymentsPage() {
    const router = useRouter()
    const supabase = createBrowserClient()
    const { showToast, showConfirm } = useNotification()
    const [loading, setLoading] = useState(true)
    const [payments, setPayments] = useState<PaymentRequest[]>([])
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

    useEffect(() => {
        checkAdminAuth()
        loadPayments()
        subscribeToPayments()
    }, [filter])

    const checkAdminAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        // Check if user has admin or super_admin role
        const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single() as any // Type cast to fix build error

        if (error || !userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
            showToast('Bu sayfaya erişim yetkiniz yok!', 'error')
            router.push('/dashboard')
            return
        }
    }

    const loadPayments = async () => {
        try {
            let query = supabase
                .from('payment_requests')
                .select(`
          *,
          users!payment_requests_user_id_fkey (
            email,
            full_name
          )
        `)
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) {
                console.error('Supabase error details:', error)
                throw error
            }

            setPayments(data || [])
            setLoading(false)
        } catch (error: any) {
            console.error('Error loading payments:', error)
            console.error('Error message:', error?.message)
            console.error('Error code:', error?.code)
            setLoading(false)
        }
    }

    const subscribeToPayments = () => {
        const channel = supabase
            .channel('admin-payments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payment_requests'
                },
                () => {
                    loadPayments()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const handleApprove = async (paymentId: string, userId: string, plan: string) => {
        const confirmed = await showConfirm({
            title: 'Ödemeyi Onayla',
            message: 'Bu ödemeyi onaylamak ve paketi aktifleştirmek istediğinizden emin misiniz?',
            confirmText: 'Onayla',
            cancelText: 'İptal',
            type: 'info'
        })

        if (!confirmed) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                alert('Oturum bulunamadı!')
                return
            }

            console.log('Approving payment:', { paymentId, userId, plan })

            // Update payment request status
            // @ts-expect-error - Supabase types not up to date
            const { error: paymentError } = await supabase
                .from('payment_requests')
                .update({
                    status: 'approved',
                    approved_by: session.user.id,
                    approved_at: new Date().toISOString()
                })
                .eq('id', paymentId)

            if (paymentError) {
                console.error('Payment update error:', paymentError)
                throw paymentError
            }

            console.log('Payment request updated successfully')

            // Update or create subscription
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

            const maxDevices = plan === 'lite' ? 1 : plan === 'pro' ? 5 : 999

            console.log('Creating/updating subscription:', {
                user_id: userId,
                plan,
                max_devices: maxDevices,
                expires_at: expiresAt.toISOString()
            })

            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: plan,
                    status: 'active',
                    max_devices: maxDevices,
                    expires_at: expiresAt.toISOString()
                } as any, { // Type cast to fix build error
                    onConflict: 'user_id'
                })

            if (subError) {
                console.error('Subscription error:', subError)
                console.error('Subscription error details:', {
                    code: subError.code,
                    message: subError.message,
                    details: subError.details,
                    hint: subError.hint
                })
                throw subError
            }

            console.log('Subscription created/updated successfully:', subData)

            // Log admin action
            const { logAdminAction, LOG_ACTIONS } = await import('@/lib/supabase/logs')
            await logAdminAction({
                action: LOG_ACTIONS.PAYMENT_APPROVE,
                target_type: 'payment_request',
                target_id: paymentId,
                details: { plan, amount: payments.find(p => p.id === paymentId)?.amount }
            })

            showToast('Ödeme onaylandı ve paket aktif edildi!', 'success')
            loadPayments()
        } catch (error: any) {
            console.error('Error approving payment:', error)
            showToast(`Hata: ${error?.message || 'Onaylama sırasında hata oluştu'}`, 'error')
        }
    }

    const handleReject = async (paymentId: string) => {
        const reason = await showConfirm({
            title: 'Ödemeyi Reddet',
            message: 'Bu ödemeyi reddetmek istediğinizden emin misiniz?',
            confirmText: 'Reddet',
            cancelText: 'İptal',
            type: 'danger'
        })

        if (!reason) return

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { error } = await supabase
                .from('payment_requests')
                .update({
                    status: 'rejected',
                    admin_notes: reason || 'Reddedildi',
                    approved_by: session.user.id,
                    approved_at: new Date().toISOString()
                } as any) // Type cast to fix build error
                .eq('id', paymentId)

            if (error) throw error

            // Log admin action
            const { logAdminAction, LOG_ACTIONS } = await import('@/lib/supabase/logs')
            await logAdminAction({
                action: LOG_ACTIONS.PAYMENT_REJECT,
                target_type: 'payment_request',
                target_id: paymentId,
                details: { reason: 'Reddedildi' }
            })

            showToast('Ödeme reddedildi', 'success')
            loadPayments()
        } catch (error) {
            console.error('Error rejecting payment:', error)
            showToast('Reddetme sırasında hata oluştu', 'error')
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-orange-100 text-orange-700 border-orange-300'
            case 'approved':
                return 'bg-green-100 text-green-700 border-green-300'
            case 'rejected':
                return 'bg-red-100 text-red-700 border-red-300'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Beklemede'
            case 'approved':
                return 'Onaylandı'
            case 'rejected':
                return 'Reddedildi'
            default:
                return status
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Ödeme Onayları</h1>
                    <p className="text-gray-600">EFT/Havale ödeme bildirimlerini yönetin</p>
                </div>
                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekleyenler' : f === 'approved' ? 'Onaylananlar' : 'Reddedilenler'}
                        </button>
                    ))}
                    <button
                        onClick={loadPayments}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Yenile
                    </button>
                    <button
                        onClick={() => alert('Test butonu çalışıyor!')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-all"
                    >
                        🧪 Test
                    </button>
                </div>

                {/* Payments List */}
                <div className="space-y-4">
                    {payments.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center">
                            <p className="text-gray-500">Ödeme bildirimi bulunamadı</p>
                        </div>
                    ) : (
                        payments.map((payment) => (
                            <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold">{payment.users?.full_name || 'İsimsiz'}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(payment.status)}`}>
                                                {getStatusText(payment.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-600">{payment.users?.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-blue-600">₺{payment.amount}</p>
                                        <p className="text-sm text-gray-600">{payment.plan.toUpperCase()} Paket</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <User className="w-4 h-4" />
                                        <div>
                                            <p className="text-xs text-gray-500">Ödeme Yapan</p>
                                            <p className="font-semibold">{payment.payer_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4" />
                                        <div>
                                            <p className="text-xs text-gray-500">Ödeme Tarihi</p>
                                            <p className="font-semibold">{new Date(payment.payment_date).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Clock className="w-4 h-4" />
                                        <div>
                                            <p className="text-xs text-gray-500">Bildirim Tarihi</p>
                                            <p className="font-semibold">{new Date(payment.created_at).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                </div>

                                {payment.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleApprove(payment.id, payment.user_id, payment.plan)}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Onayla ve Paketi Aktifleştir
                                        </button>
                                        <button
                                            onClick={() => handleReject(payment.id)}
                                            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Reddet
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
