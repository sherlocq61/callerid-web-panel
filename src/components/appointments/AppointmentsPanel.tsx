'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Calendar, Clock, User, Trash2, Edit, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import AppointmentModal from '../appointments/AppointmentModal'

interface Appointment {
    id: string
    phone_number: string
    contact_name: string | null
    appointment_date: string
    notes: string | null
    reminder_sent: boolean
    status: 'scheduled' | 'completed' | 'cancelled'
    created_at: string
}

export default function AppointmentsPanel() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('scheduled')
    const supabase = createBrowserClient()

    useEffect(() => {
        loadAppointments()
    }, [filter])

    const loadAppointments = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let query = supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .order('appointment_date', { ascending: true })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }

    const cancelAppointment = async (id: string) => {
        if (!confirm('Randevuyu iptal etmek istediğinizden emin misiniz?')) return

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id)

            if (error) throw error
            loadAppointments()
        } catch (error) {
            console.error('Error cancelling appointment:', error)
            alert('Randevu iptal edilirken hata oluştu')
        }
    }

    const completeAppointment = async (id: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', id)

            if (error) throw error
            loadAppointments()
        } catch (error) {
            console.error('Error completing appointment:', error)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getTimeUntil = (dateString: string) => {
        const now = new Date()
        const appointmentDate = new Date(dateString)
        const diffMs = appointmentDate.getTime() - now.getTime()
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)

        if (diffMs < 0) return 'Geçmiş'
        if (diffDays > 0) return `${diffDays} gün sonra`
        if (diffHours > 0) return `${diffHours} saat sonra`
        return 'Yakında'
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
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Randevular</h2>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('scheduled')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'scheduled'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Planlanmış
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'completed'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Tamamlanan
                    </button>
                    <button
                        onClick={() => setFilter('cancelled')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'cancelled'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        İptal
                    </button>
                </div>
            </div>

            {/* Appointments List */}
            {appointments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Henüz randevu yok</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {appointments.map((appointment) => (
                        <motion.div
                            key={appointment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Contact Info */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {appointment.contact_name || appointment.phone_number}
                                            </p>
                                            {appointment.contact_name && (
                                                <p className="text-sm text-gray-500">{appointment.phone_number}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="flex items-center gap-6 mb-3">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">{formatDate(appointment.appointment_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{formatTime(appointment.appointment_date)}</span>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {appointment.notes && (
                                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                                            {appointment.notes}
                                        </p>
                                    )}

                                    {/* Status Badges */}
                                    <div className="flex items-center gap-2">
                                        {appointment.status === 'scheduled' && (
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                {getTimeUntil(appointment.appointment_date)}
                                            </span>
                                        )}
                                        {appointment.reminder_sent && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                ✓ Hatırlatma Gönderildi
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {appointment.status === 'scheduled' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => completeAppointment(appointment.id)}
                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Tamamlandı olarak işaretle"
                                        >
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        </button>
                                        <button
                                            onClick={() => cancelAppointment(appointment.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="İptal et"
                                        >
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
