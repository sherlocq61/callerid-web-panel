'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { CreditCard, Package, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface Subscription {
    id: string
    plan: string
    status: string
    created_at: string
    expires_at: string
    max_devices: number
}

interface Payment {
    id: string
    amount: number
    status: string
    payment_method: string
    created_at: string
    subscription_id: string
    subscriptions?: {
        plan: string
    }
}

export default function SubscriptionPanel() {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
    const [savedCard, setSavedCard] = useState<any>(null)

    useEffect(() => {
        loadSubscriptionData()
    }, [])

    const loadSubscriptionData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Get current subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('status', 'active')
                .single()

            if (subData) {
                setCurrentSubscription(subData)
            }

            // Get payment history
            const { data: paymentsData } = await supabase
                .from('payments')
                .select(`
                    *,
                    subscriptions (plan)
                `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (paymentsData) {
                setPaymentHistory(paymentsData)
            }

            // Get saved card info (if exists)
            // This would come from your payment provider
            // For now, we'll check if there's a successful card payment
            const cardPayment = paymentsData?.find(p => p.payment_method === 'credit_card' && p.status === 'completed')
            if (cardPayment) {
                setSavedCard({
                    last4: '****', // This should come from payment provider
                    brand: 'Visa', // This should come from payment provider
                    expiry: '12/25' // This should come from payment provider
                })
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading subscription data:', error)
            setLoading(false)
        }
    }

    const getPlanName = (plan: string) => {
        switch (plan) {
            case 'lite': return 'Lite'
            case 'pro': return 'Pro'
            case 'enterprise': return 'Enterprise'
            default: return plan
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'lite': return 'from-orange-500 to-amber-500'
            case 'pro': return 'from-blue-500 to-cyan-500'
            case 'enterprise': return 'from-purple-500 to-pink-500'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const getPaymentMethodIcon = (method: string) => {
        if (method === 'credit_card') return '💳'
        if (method === 'bank_transfer') return '🏦'
        if (method === 'paytr') return '💰'
        return '💵'
    }

    const getStatusBadge = (status: string) => {
        if (status === 'completed') {
            return (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    Tamamlandı
                </span>
            )
        }
        if (status === 'pending') {
            return (
                <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                    <Clock className="w-4 h-4" />
                    Beklemede
                </span>
            )
        }
        return (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                <XCircle className="w-4 h-4" />
                İptal
            </span>
        )
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Current Subscription */}
            {currentSubscription && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-6 h-6 text-blue-600" />
                        Aktif Paketiniz
                    </h2>

                    <div className={`bg-gradient-to-r ${getPlanColor(currentSubscription.plan)} rounded-2xl p-6 text-white mb-6`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-white/80 text-sm">Paket</p>
                                <h3 className="text-3xl font-bold">{getPlanName(currentSubscription.plan)}</h3>
                            </div>
                            <Package className="w-12 h-12 text-white/80" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
                            <div>
                                <p className="text-white/80 text-sm">Bitiş Tarihi</p>
                                <p className="font-semibold">{new Date(currentSubscription.expires_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Kalan Gün</p>
                                <p className="font-semibold">
                                    {Math.ceil((new Date(currentSubscription.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Gün
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-gray-600 text-sm mb-1">Maksimum Cihaz</p>
                            <p className="text-2xl font-bold text-gray-900">{currentSubscription.max_devices}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-gray-600 text-sm mb-1">Durum</p>
                            <p className="text-2xl font-bold text-green-600">Aktif</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Saved Card */}
            {savedCard && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        Kayıtlı Kart
                    </h2>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
                        <div className="flex items-center justify-between mb-8">
                            <CreditCard className="w-12 h-12 text-white/80" />
                            <p className="text-white/80 font-semibold">{savedCard.brand}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-white/60 text-sm">Kart Numarası</p>
                            <p className="text-2xl font-mono tracking-wider">**** **** **** {savedCard.last4}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <div>
                                <p className="text-white/60 text-xs">Son Kullanma</p>
                                <p className="font-semibold">{savedCard.expiry}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Payment History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Satın Alma Geçmişi
                </h2>

                {paymentHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Henüz satın alma geçmişi yok</p>
                ) : (
                    <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl">{getPaymentMethodIcon(payment.payment_method)}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {payment.subscriptions?.plan ? getPlanName(payment.subscriptions.plan) : 'Paket'} Paketi
                                            </h3>
                                            {getStatusBadge(payment.status)}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {new Date(payment.created_at).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ödeme Yöntemi: {payment.payment_method === 'credit_card' ? 'Kredi Kartı' :
                                                payment.payment_method === 'bank_transfer' ? 'Banka Havalesi' :
                                                    payment.payment_method === 'paytr' ? 'PayTR' : payment.payment_method}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">{payment.amount} ₺</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* No Active Subscription */}
            {!currentSubscription && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-12 text-center"
                >
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Aktif Paketiniz Yok</h3>
                    <p className="text-gray-600 mb-6">Hizmetlerimizden yararlanmak için bir paket satın alın</p>
                    <button
                        onClick={() => window.location.href = '/pricing'}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                        Paketleri Görüntüle
                    </button>
                </motion.div>
            )}
        </div>
    )
}
