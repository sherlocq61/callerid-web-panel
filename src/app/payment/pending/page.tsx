'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

export default function PaymentPendingPage() {
    const router = useRouter()
    const supabase = createBrowserClient()
    const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkPaymentStatus()
        subscribeToPaymentUpdates()
    }, [])

    const checkPaymentStatus = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            // Get latest payment request
            const { data, error } = await supabase
                .from('payment_requests')
                .select('status')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error) {
                console.error('Error fetching payment status:', error)
                return
            }

            if (data) {
                setStatus(data.status)

                // If approved, redirect to success
                if (data.status === 'approved') {
                    setTimeout(() => {
                        router.push('/payment/success')
                    }, 2000)
                }

                // If rejected, redirect to failed
                if (data.status === 'rejected') {
                    setTimeout(() => {
                        router.push('/payment/failed')
                    }, 2000)
                }
            }

            setLoading(false)
        } catch (error) {
            console.error('Error:', error)
            setLoading(false)
        }
    }

    const subscribeToPaymentUpdates = () => {
        const getUserId = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            return session?.user.id
        }

        getUserId().then(userId => {
            if (!userId) return

            console.log('🔄 Real-time subscription başlatılıyor...', userId)

            const channel = supabase
                .channel(`payment-status-${userId}-${Date.now()}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'payment_requests',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('✅ Real-time güncelleme alındı:', payload)
                        const newStatus = payload.new.status
                        setStatus(newStatus)

                        if (newStatus === 'approved') {
                            console.log('🎉 Ödeme onaylandı!')
                            setTimeout(() => router.push('/payment/success'), 2000)
                        } else if (newStatus === 'rejected') {
                            console.log('❌ Ödeme reddedildi!')
                            setTimeout(() => router.push('/payment/failed'), 2000)
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('📡 Subscription durumu:', status)
                    if (status === 'SUBSCRIBED') {
                        console.log('✅ Real-time bağlantı kuruldu!')
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Real-time bağlantı hatası!')
                    }
                })

            return () => {
                console.log('🔌 Real-time bağlantı kapatılıyor...')
                supabase.removeChannel(channel)
            }
        })
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
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {status === 'pending' && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <Clock className="w-12 h-12 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Ödemeniz Kontrol Ediliyor
                            </h1>

                            <p className="text-gray-600 mb-8">
                                Ödeme bildiriminiz alındı. Admin onayı bekleniyor...
                            </p>

                            <div className="bg-orange-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <RefreshCw className="w-5 h-5 text-orange-600 animate-spin" />
                                    <p className="text-orange-800 font-semibold">
                                        Gerçek Zamanlı Kontrol Aktif
                                    </p>
                                </div>
                                <p className="text-sm text-orange-700">
                                    Admin onayladığında otomatik olarak dashboard'a yönlendirileceksiniz
                                </p>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                <p>⏱️ Ortalama onay süresi: 1-2 iş günü</p>
                                <p>📧 Onay sonucu email ile bildirilecektir</p>
                            </div>
                        </>
                    )}

                    {status === 'approved' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-12 h-12 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Ödeme Onaylandı! 🎉
                            </h1>

                            <p className="text-gray-600 mb-6">
                                Dashboard'a yönlendiriliyorsunuz...
                            </p>
                        </>
                    )}

                    {status === 'rejected' && (
                        <>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                                className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <XCircle className="w-12 h-12 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Ödeme Reddedildi
                            </h1>

                            <p className="text-gray-600 mb-6">
                                Ödeme bildiriminiz onaylanmadı. Lütfen bilgileri kontrol edip tekrar deneyin.
                            </p>
                        </>
                    )}

                    <button
                        onClick={() => router.push('/pricing')}
                        className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    >
                        ← Paketlere Dön
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
