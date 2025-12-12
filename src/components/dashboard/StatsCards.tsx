'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Phone, Shield, Users, Smartphone, Calendar, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface Stats {
    totalCalls: number
    blockedCalls: number
    totalContacts: number
    activeDevices: number
    maxDevices: number
}

interface StatsCardsProps {
    selectedDate: string | null
    onDateChange: (date: string | null) => void
}

export default function StatsCards({ selectedDate, onDateChange }: StatsCardsProps) {
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
    }, [selectedDate]) // Reload when date changes

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

            // Calculate date range for filtering
            const targetDate = selectedDate || new Date().toISOString().split('T')[0] // Today if null
            const startOfDay = `${targetDate}T00:00:00`
            const endOfDay = `${targetDate}T23:59:59`

            // Get total calls count for selected date
            let callsQuery = supabase
                .from('calls')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .gte('timestamp', startOfDay)
                .lte('timestamp', endOfDay)

            const { count: callsCount } = await callsQuery

            // Get blocked calls count (calls from blacklisted numbers)
            const { data: blacklistNumbers } = await supabase
                .from('blacklist')
                .select('phone_number')
                .eq('is_active', true)

            const blacklistedPhones = blacklistNumbers?.map(b => b.phone_number) || []

            let blockedQuery = supabase
                .from('calls')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .gte('timestamp', startOfDay)
                .lte('timestamp', endOfDay)
                .in('phone_number', blacklistedPhones.length > 0 ? blacklistedPhones : ['__none__'])

            const { count: blockedCount } = await blockedQuery

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
        <>
            {/* Date Picker for Total Calls */}
            <div className="mb-4 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg p-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <input
                        type="date"
                        value={selectedDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => onDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]} // Disable future dates
                        className="border-none outline-none text-sm font-medium text-gray-700"
                    />
                    {selectedDate && (
                        <button
                            onClick={() => onDateChange(null)}
                            className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            title="Bugüne dön"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
                <span className="text-sm text-gray-600">
                    {selectedDate ? 'Seçili tarih' : 'Bugün'}
                </span>
            </div>

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
        </>
    )
}
