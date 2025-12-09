'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface Purchase {
    id: string
    user_id: string
    plan: string
    amount: number
    currency: string
    payment_method: string
    status: 'completed' | 'pending' | 'failed'
    created_at: string
    expires_at: string | null
}

export default function PurchaseHistoryPanel() {
    const supabase = createBrowserClient()
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPurchases()
    }, [])

    const loadPurchases = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get purchase history from subscriptions table
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            // Transform to purchase format
            const purchaseData: Purchase[] = data?.map(sub => ({
                id: sub.id,
                user_id: sub.user_id,
                plan: sub.plan,
                amount: getPlanPrice(sub.plan),
                currency: 'TRY',
                payment_method: 'Kredi Kartı',
                status: sub.status === 'active' ? 'completed' : sub.status === 'cancelled' ? 'failed' : 'pending',
                created_at: sub.created_at,
                expires_at: sub.expires_at
            })) || []

            setPurchases(purchaseData)
        } catch (error) {
            console.error('Error loading purchases:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPlanPrice = (plan: string): number => {
        switch (plan) {
            case 'lite': return 0
            case 'pro': return 99
            case 'enterprise': return 299
            default: return 0
        }
    }

    const getPlanName = (plan: string): string => {
        switch (plan) {
            case 'lite': return 'Lite'
            case 'pro': return 'Pro'
            case 'enterprise': return 'Enterprise'
            default: return plan
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-600" />
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-600" />
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />
            default:
                return null
        }
    }

    const getStatusText = (status: string): string => {
        switch (status) {
            case 'completed': return 'Tamamlandı'
            case 'failed': return 'Başarısız'
            case 'pending': return 'Beklemede'
            default: return status
        }
    }

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700'
            case 'failed': return 'bg-red-100 text-red-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
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
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    Satın Alma Geçmişi
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {purchases.length} işlem
                </p>
            </div>

            {/* Purchase List */}
            {purchases.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz satın alma geçmişi yok</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Tarih
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Plan
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Tutar
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Ödeme Yöntemi
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Durum
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Bitiş Tarihi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchases.map((purchase, index) => (
                                    <motion.tr
                                        key={purchase.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {formatDate(purchase.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {getPlanName(purchase.plan)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg font-bold text-gray-900">
                                                {purchase.amount} {purchase.currency}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">
                                                    {purchase.payment_method}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
                                                {getStatusIcon(purchase.status)}
                                                {getStatusText(purchase.status)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {purchase.expires_at ? formatDate(purchase.expires_at) : '-'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
