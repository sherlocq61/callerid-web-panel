'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Calendar, Clock, FileText, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AppointmentModalProps {
    isOpen: boolean
    onClose: () => void
    phoneNumber: string
    contactName: string | null
    onSuccess: () => void
}

export default function AppointmentModal({
    isOpen,
    onClose,
    phoneNumber,
    contactName,
    onSuccess
}: AppointmentModalProps) {
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createBrowserClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Combine date and time
            const appointmentDate = new Date(`${date}T${time}`)

            // Validate future date
            if (appointmentDate <= new Date()) {
                alert('Randevu tarihi gelecekte olmalıdır!')
                setLoading(false)
                return
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Oturum açmanız gerekiyor')
                setLoading(false)
                return
            }

            // Create appointment
            const { error } = await supabase
                .from('appointments')
                .insert({
                    user_id: user.id,
                    phone_number: phoneNumber,
                    contact_name: contactName,
                    appointment_date: appointmentDate.toISOString(),
                    notes: notes || null
                })

            if (error) throw error

            alert('Randevu başarıyla oluşturuldu!')
            onSuccess()
            onClose()

            // Reset form
            setDate('')
            setTime('')
            setNotes('')
        } catch (error) {
            console.error('Error creating appointment:', error)
            alert('Randevu oluşturulurken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Randevu Oluştur</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-600 mb-1">Müşteri</p>
                        <p className="font-semibold text-gray-900">
                            {contactName || phoneNumber}
                        </p>
                        {contactName && (
                            <p className="text-sm text-gray-600">{phoneNumber}</p>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-2" />
                                Tarih
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Time */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock className="w-4 h-4 inline mr-2" />
                                Saat
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4 inline mr-2" />
                                Not (Opsiyonel)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Randevu detayları..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-amber-800">
                                📱 Randevu saatinden 1 saat önce WhatsApp ile hatırlatma gönderilecektir.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                            >
                                {loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
