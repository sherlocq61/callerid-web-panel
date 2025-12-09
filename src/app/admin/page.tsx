'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Users, CreditCard, Package, TrendingUp, Clock, CheckCircle, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
    totalUsers: number
    activeSubscriptions: number
    pendingPayments: number
    totalRevenue: number
    newUsersToday: number
    approvedPaymentsToday: number
}

export default function AdminDashboardPage() {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeSubscriptions: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        newUsersToday: 0,
        approvedPaymentsToday: 0
    })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            // Total users
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })

            // Active subscriptions
            const { count: activeSubscriptions } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active')

            // Pending payments
            const { count: pendingPayments } = await supabase
                .from('payment_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')

            // Total revenue (approved payments)
            const { data: revenueData } = await supabase
                .from('payment_requests')
                .select('amount')
                .eq('status', 'approved')

            const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0

            // New users today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { count: newUsersToday } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString())

            // Approved payments today
            const { count: approvedPaymentsToday } = await supabase
                .from('payment_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved')
                .gte('approved_at', today.toISOString())

            setStats({
                totalUsers: totalUsers || 0,
                activeSubscriptions: activeSubscriptions || 0,
                pendingPayments: pendingPayments || 0,
                totalRevenue,
                newUsersToday: newUsersToday || 0,
                approvedPaymentsToday: approvedPaymentsToday || 0
            })

            setLoading(false)
        } catch (error) {
            console.error('Error loading stats:', error)
            setLoading(false)
        }
    }

    const statCards = [
        {
            title: 'Toplam Kullanıcı',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Aktif Paket',
            value: stats.activeSubscriptions,
            icon: Package,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Bekleyen Ödeme',
            value: stats.pendingPayments,
            icon: Clock,
            color: 'from-orange-500 to-amber-500',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600'
        },
        {
            title: 'Toplam Gelir',
            value: `₺${stats.totalRevenue.toLocaleString('tr-TR')}`,
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            title: 'Bugün Yeni Üye',
            value: stats.newUsersToday,
            icon: Users,
            color: 'from-indigo-500 to-blue-500',
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600'
        },
        {
            title: 'Bugün Onaylanan',
            value: stats.approvedPaymentsToday,
            icon: CheckCircle,
            color: 'from-teal-500 to-cyan-500',
            bgColor: 'bg-teal-50',
            textColor: 'text-teal-600'
        }
    ]

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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                    <p className="text-gray-600">Sistem genel bakış ve istatistikler</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-xs font-semibold`}>
                                        Canlı
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Hızlı Erişim</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a
                            href="/admin/users"
                            className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">Kullanıcılar</p>
                        </a>
                        <a
                            href="/admin/payments"
                            className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <CreditCard className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">Ödemeler</p>
                        </a>
                        <a
                            href="/admin/subscriptions"
                            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">Paketler</p>
                        </a>
                        <a
                            href="/admin/settings"
                            className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <CreditCard className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">Ayarlar</p>
                        </a>
                        <a
                            href="/admin/seo"
                            className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <Settings className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">SEO</p>
                        </a>
                        <a
                            href="/admin/app-settings"
                            className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all text-center"
                        >
                            <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="font-semibold text-gray-900">Uygulama</p>
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
