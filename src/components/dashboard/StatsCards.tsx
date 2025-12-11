'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Phone, Shield, Users, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
    totalCalls: number
    blockedCalls: number
    totalContacts: number
    activeDevices: number
    maxDevices: number
}

export default function StatsCards() {
    const [stats, setStats] = useState<Stats>({
        totalCalls: 0,
        blockedCalls: 0,
        totalContacts: 0,
        activeDevices: 0,
        maxDevices: 1
    })
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        loadStats()

        // Subscribe to realtime changes on devices table
        const setupRealtimeSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const channel = supabase
                .channel('devices-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'devices',
                        filter: `user_id=eq.${session.user.id}`
                    },
                    () => {
                        // Reload stats when devices table changes
                        loadStats()
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        setupRealtimeSubscription()
    }, [])

    const loadStats = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Get subscription info for max devices
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('max_devices')
                .eq('user_id', session.user.id)
                .single()

            // Get total calls count
            const { count: callsCount } = await supabase
                .from('calls')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)

            // Get blocked calls count (calls from blacklisted numbers)
            const { data: blacklistNumbers } = await supabase
                .from('blacklist')
                .select('phone_number')
                .eq('is_active', true)

            const blacklistedPhones = blacklistNumbers?.map(b => b.phone_number) || []

            const { count: blockedCount } = await supabase
                .from('calls')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .in('phone_number', blacklistedPhones.length > 0 ? blacklistedPhones : ['__none__'])

            // Get total contacts count
            const { count: contactsCount } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)

            // Get active devices count
            const { count: devicesCount } = await supabase
                .from('devices')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('is_active', true)

            setStats({
                totalCalls: callsCount || 0,
                blockedCalls: blockedCount || 0,
                totalContacts: contactsCount || 0,
                activeDevices: devicesCount || 0,
                maxDevices: subData?.max_devices || 1
            })
            setLoading(false)
        } catch (error) {
            console.error('Error loading stats:', error)
            setLoading(false)
        }
    }

    const cards = [
        {
            title: 'Toplam Aramalar',
            value: stats.totalCalls,
            icon: Phone,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Engellenen Aramalar',
            value: stats.blockedCalls,
            icon: Shield,
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600'
        },
        {
            title: 'Kayıtlı Kişiler',
            value: stats.totalContacts,
            icon: Users,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Aktif Cihazlar',
            value: `${stats.activeDevices}/${stats.maxDevices}`,
            icon: Smartphone,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        }
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                        <div className="h-12 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${card.bgColor}`}>
                            <card.icon className={`w-6 h-6 ${card.textColor}`} />
                        </div>
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-2">{card.title}</h3>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                        {card.value}
                    </p>
                </motion.div>
            ))}
        </div>
    )
}
