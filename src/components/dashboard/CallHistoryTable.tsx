'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Phone, Clock, User, Ban, PhoneIncoming, PhoneOutgoing, PhoneMissed, Calendar, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import AppointmentModal from '../appointments/AppointmentModal'
import AppointmentButton from '../appointments/AppointmentButton'

interface CallDetail {
    id: string
    phone_number: string
    contact_name: string | null
    call_type: 'incoming' | 'outgoing' | 'missed'
    duration: number
    timestamp: string
    is_blacklisted: boolean
    blacklist_reason?: string | null
    last_destination?: string | null
}

export default function CallHistoryTable() {
    const [calls, setCalls] = useState<CallDetail[]>([])
    const [loading, setLoading] = useState(true)
    const [appointmentModal, setAppointmentModal] = useState<{
        isOpen: boolean
        phoneNumber: string
        contactName: string | null
    }>({ isOpen: false, phoneNumber: '', contactName: null })
    const [saveContactModal, setSaveContactModal] = useState<{
        isOpen: boolean
        phoneNumber: string
        defaultName: string
    }>({ isOpen: false, phoneNumber: '', defaultName: '' })
    const supabase = createBrowserClient()

    useEffect(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission)
            })
        }

        loadCalls()

        // Real-time subscription
        const channel = supabase
            .channel('calls-changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'calls' },
                (payload) => {
                    console.log('New call received:', payload)
                    loadCalls()

                    // Show browser notification
                    const call = payload.new as any
                    showCallNotification(call)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const showCallNotification = async (call: any) => {
        try {
            // Check if number is blacklisted
            const { data: blacklistEntry } = await supabase
                .from('blacklist')
                .select('reason')
                .eq('phone_number', call.phone_number)
                .eq('is_active', true)
                .single()

            const displayName = call.contact_name || call.phone_number

            if (blacklistEntry) {
                // Show blacklist warning
                toast.error(
                    `⚠️ KARA LİSTE - ${displayName}\nSebep: ${blacklistEntry.reason || 'Belirtilmemiş'}`,
                    {
                        duration: 8000,
                        icon: '🚫',
                        style: {
                            background: '#ef4444',
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    }
                )
            } else {
                // Show normal notification
                toast.success(
                    `Gelen Çağrı: ${displayName}`,
                    {
                        duration: 5000,
                        icon: '📞'
                    }
                )
            }

            // Request browser notification permission and show
            if ('Notification' in window && Notification.permission === 'granted') {
                const title = blacklistEntry
                    ? `⚠️ KARA LİSTE - Gelen Çağrı`
                    : 'Gelen Çağrı'
                const body = blacklistEntry
                    ? `${displayName}\nSebep: ${blacklistEntry.reason || 'Belirtilmemiş'}`
                    : `${displayName} numarasından çağrı geldi`

                new Notification(title, {
                    body,
                    icon: '/icon.png',
                    badge: '/badge.png'
                })
            }
        } catch (error) {
            console.error('Error showing notification:', error)
        }
    }

    const loadCalls = async () => {
        try {
            const { data: callsData, error: callsError } = await supabase
                .from('calls')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50)

            if (callsError) throw callsError

            // Check blacklist for each number
            const { data: blacklistData } = await supabase
                .from('blacklist')
                .select('phone_number, reason')
                .eq('is_active', true)

            const blacklistMap = new Map(
                blacklistData?.map(b => [b.phone_number, b.reason]) || []
            )

            // Auto-populate last_destination from previous calls
            const enrichedCalls: CallDetail[] = (callsData || []).map(call => {
                // If no destination, try to get from previous call with same number
                let lastDestination = call.last_destination
                if (!lastDestination) {
                    const previousCall = callsData?.find(
                        c => c.phone_number === call.phone_number &&
                            c.id !== call.id &&
                            c.last_destination
                    )
                    lastDestination = previousCall?.last_destination || null
                }

                return {
                    ...call,
                    last_destination: lastDestination,
                    is_blacklisted: blacklistMap.has(call.phone_number),
                    blacklist_reason: blacklistMap.get(call.phone_number)
                }
            })

            setCalls(enrichedCalls)
        } catch (err) {
            console.error('Error loading calls:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatPhoneNumber = (phone: string) => {
        const digits = phone.replace(/\D/g, '')
        if (digits.startsWith('90') && digits.length === 12) {
            return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
        }
        if (digits.length === 10) {
            return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
        }
        return phone
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
        // Android sends timestamp in local time, just format it
        const date = new Date(dateString)
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getCallTypeIcon = (type: string) => {
        switch (type) {
            case 'incoming':
                return <PhoneIncoming className="w-5 h-5 text-green-600" />
            case 'outgoing':
                return <PhoneOutgoing className="w-5 h-5 text-blue-600" />
            case 'missed':
                return <PhoneMissed className="w-5 h-5 text-red-600" />
            default:
                return <Phone className="w-5 h-5 text-gray-600" />
        }
    }


    const getCallTypeText = (type: string) => {
        switch (type) {
            case 'incoming':
                return 'Gelen'
            case 'outgoing':
                return 'Giden'
            case 'missed':
                return 'Cevapsız'
            default:
                return type
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <>
            <Toaster />
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Phone className="w-7 h-7 text-blue-600" />
                        Arama Geçmişi
                    </h2>
                    <div className="text-sm text-gray-600">
                        Toplam {calls.length} arama
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Tür
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Kişi / Numara
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Tarih
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Saat
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Süre
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Son Güzergah
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Durum
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {calls.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            Henüz arama kaydı yok
                                        </td>
                                    </tr>
                                ) : (
                                    calls.map((call, index) => (
                                        <motion.tr
                                            key={call.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`hover:bg-gray-50 transition-colors ${call.is_blacklisted ? 'bg-red-50/50' : ''
                                                }`}
                                        >
                                            {/* Call Type */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getCallTypeIcon(call.call_type)}
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {getCallTypeText(call.call_type)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contact / Number */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    {call.contact_name ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <User className="w-4 h-4 text-gray-400" />
                                                                <span className="font-semibold text-gray-900">
                                                                    {call.contact_name}
                                                                </span>
                                                            </div>
                                                            <span className="text-sm text-gray-600 font-mono ml-6">
                                                                {formatPhoneNumber(call.phone_number)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-semibold text-gray-900">
                                                                {formatPhoneNumber(call.phone_number)}
                                                            </span>
                                                            <button
                                                                onClick={() => setSaveContactModal({
                                                                    isOpen: true,
                                                                    phoneNumber: call.phone_number,
                                                                    defaultName: call.last_destination || ''
                                                                })}
                                                                className="p-1 hover:bg-blue-50 rounded-full transition-colors"
                                                                title="Rehbere Kaydet"
                                                            >
                                                                <UserPlus className="w-4 h-4 text-blue-600" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(call.timestamp)}
                                            </td>

                                            {/* Time */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-mono text-gray-700">
                                                        {formatTime(call.timestamp)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Duration */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono font-semibold text-gray-900">
                                                    {formatDuration(call.duration)}
                                                </span>
                                            </td>

                                            {/* Last Destination */}
                                            <td className="px-6 py-4">
                                                <input
                                                    key={`dest-${call.id}-${call.last_destination || 'empty'}`}
                                                    type="text"
                                                    placeholder="Güzergah girin..."
                                                    defaultValue={call.last_destination || ''}
                                                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const destination = e.currentTarget.value.trim()
                                                            if (destination) {
                                                                // Save destination to database
                                                                supabase
                                                                    .from('calls')
                                                                    .update({ last_destination: destination })
                                                                    .eq('id', call.id)
                                                                    .then(({ error }) => {
                                                                        if (error) {
                                                                            console.error('Destination save error:', error)
                                                                            toast.error('Güzergah kaydedilemedi: ' + error.message)
                                                                        } else {
                                                                            toast.success('Güzergah kaydedildi')
                                                                            loadCalls()
                                                                        }
                                                                    })
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const destination = e.target.value.trim()
                                                        if (destination && destination !== call.last_destination) {
                                                            // Save destination to database
                                                            supabase
                                                                .from('calls')
                                                                .update({ last_destination: destination })
                                                                .eq('id', call.id)
                                                                .then(({ error }) => {
                                                                    if (error) {
                                                                        console.error('Destination save error:', error)
                                                                        toast.error('Güzergah kaydedilemedi: ' + error.message)
                                                                    } else {
                                                                        toast.success('Güzergah kaydedildi')
                                                                        loadCalls()
                                                                    }
                                                                })
                                                        }
                                                    }}
                                                />
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                {call.is_blacklisted && (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                            <Ban className="w-3 h-3" />
                                                            Kara Liste
                                                        </div>
                                                        {call.blacklist_reason && (
                                                            <span className="text-xs text-red-600 italic">
                                                                {call.blacklist_reason}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    {/* Appointment Button - Always show */}
                                                    <AppointmentButton
                                                        phoneNumber={call.phone_number}
                                                        contactName={call.contact_name}
                                                    />

                                                    {/* Save to Contacts Button - Only if not saved and has destination */}
                                                    {!call.contact_name && call.last_destination && (
                                                        <button
                                                            onClick={() => {
                                                                // Save to contacts with last destination
                                                                const contactData = {
                                                                    phone_number: call.phone_number,
                                                                    name: call.last_destination,
                                                                    notes: `Eklendi: ${new Date().toLocaleDateString('tr-TR')}`
                                                                }

                                                                supabase
                                                                    .from('contacts')
                                                                    .insert(contactData)
                                                                    .then(({ error }) => {
                                                                        if (error) {
                                                                            toast.error('Rehbere eklenemedi')
                                                                        } else {
                                                                            toast.success('Rehbere eklendi!')
                                                                            loadCalls()
                                                                        }
                                                                    })
                                                            }}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                        >
                                                            📇 Rehbere Kaydet
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                            <PhoneIncoming className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700">Gelen</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {calls.filter(c => c.call_type === 'incoming').length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                            <PhoneOutgoing className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">Giden</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {calls.filter(c => c.call_type === 'outgoing').length}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-1">
                            <PhoneMissed className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-gray-700">Cevapsız</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            {calls.filter(c => c.call_type === 'missed').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={appointmentModal.isOpen}
                onClose={() => setAppointmentModal({ isOpen: false, phoneNumber: '', contactName: null })}
                phoneNumber={appointmentModal.phoneNumber}
                contactName={appointmentModal.contactName}
                onSuccess={() => {
                    toast.success('Randevu oluşturuldu!')
                    loadCalls()
                }}
            />

            {/* Save Contact Modal */}
            {saveContactModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Rehbere Kaydet</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            const name = formData.get('name') as string
                            const notes = formData.get('notes') as string

                            if (!name.trim()) {
                                toast.error('İsim gerekli')
                                return
                            }

                            // Get current user
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session) {
                                toast.error('Oturum bulunamadı')
                                return
                            }

                            // Use UPSERT to handle duplicates (phone normalization may create duplicates)
                            supabase
                                .from('contacts')
                                .upsert({
                                    user_id: session.user.id,
                                    phone_number: saveContactModal.phoneNumber,
                                    name: name.trim(),
                                    notes: notes.trim() || null
                                }, {
                                    onConflict: 'user_id,phone_number'
                                })
                                .then(({ error }) => {
                                    if (error) {
                                        console.error('Contact save error:', error)
                                        toast.error('Rehbere eklenemedi')
                                    } else {
                                        toast.success('Rehbere eklendi!')
                                        setSaveContactModal({ isOpen: false, phoneNumber: '', defaultName: '' })
                                        loadCalls()
                                    }
                                })
                        }}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Telefon Numarası
                                    </label>
                                    <input
                                        type="text"
                                        value={saveContactModal.phoneNumber}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        İsim *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        defaultValue={saveContactModal.defaultName}
                                        placeholder="Kişi adı"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notlar
                                    </label>
                                    <textarea
                                        name="notes"
                                        placeholder="Ek bilgiler (opsiyonel)"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setSaveContactModal({ isOpen: false, phoneNumber: '', defaultName: '' })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
