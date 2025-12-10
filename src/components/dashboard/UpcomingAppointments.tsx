'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Calendar, Clock, Phone, User, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Appointment {
    id: string
    phone_number: string
    appointment_date: string
    notes: string | null
    contact_name?: string
}

export default function UpcomingAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()
    const router = useRouter()

    useEffect(() => {
        loadAppointments()
    }, [])

    const loadAppointments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get current time in UTC (appointments are stored in UTC+3 but we need to compare in UTC)
            const now = new Date()
            const utcNow = new Date(now.getTime() - (3 * 60 * 60 * 1000)) // Subtract 3 hours to get UTC
            const nowISO = utcNow.toISOString()

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    phone_number,
                    appointment_date,
                    notes,
                    contacts:phone_number (
                        name
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'scheduled')
                .gte('appointment_date', nowISO)
                .order('appointment_date', { ascending: true })
                .limit(3)

            if (error) throw error

            const enriched = data?.map(apt => ({
                ...apt,
                contact_name: (apt.contacts as any)?.name
            })) || []

            setAppointments(enriched)
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const isToday = date.toDateString() === today.toDateString()
        const isTomorrow = date.toDateString() === tomorrow.toDateString()

        if (isToday) return 'Bugün'
        if (isTomorrow) return 'Yarın'

        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-100 rounded"></div>
                        <div className="h-16 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (appointments.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Yaklaşan Randevular</h3>
                </div>
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Yaklaşan randevu yok</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Yaklaşan Randevular</h3>
                </div>
                <button
                    onClick={() => router.push('/dashboard?tab=appointments')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    Tümünü Gör
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3">
                {appointments.map((apt, index) => (
                    <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push('/dashboard?tab=appointments')}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="font-semibold text-gray-900">
                                        {apt.contact_name || apt.phone_number}
                                    </span>
                                </div>
                                {apt.notes && (
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                        {apt.notes}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-blue-600">
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-medium">{formatDate(apt.appointment_date)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-purple-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">{formatTime(apt.appointment_date)}</span>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={`tel:${apt.phone_number}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Phone className="w-5 h-5 text-blue-600" />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
