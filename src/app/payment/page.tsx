'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Lock, ArrowLeft, Loader2, CheckCircle, Building2, Calendar, User } from 'lucide-react'
import { useNotification } from '@/components/notifications/NotificationProvider'

function PaymentContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createBrowserClient()
    const { showToast } = useNotification()

    const [loading, setLoading] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [userName, setUserName] = useState('')
    const [userId, setUserId] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'paytr' | 'bank_transfer'>('paytr')
    const [paymentFrame, setPaymentFrame] = useState<string | null>(null)

    // Bank transfer form
    const [bankTransferForm, setBankTransferForm] = useState({
        payerName: '',
        paymentDate: ''
    })

    const plan = searchParams.get('plan') || 'lite'
    const price = searchParams.get('price') || '99'

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }
        setUserId(session.user.id)
        setUserEmail(session.user.email || '')
        setUserName(session.user.user_metadata?.full_name || '')
        setBankTransferForm(prev => ({
            ...prev,
            payerName: session.user.user_metadata?.full_name || ''
        }))
    }

    const getPlanDetails = () => {
        switch (plan) {
            case 'lite':
                return { name: 'Lite', price: '99.00', maxDevices: 1 }
            case 'pro':
                return { name: 'Pro', price: '249.00', maxDevices: 5 }
            default:
                return { name: 'Lite', price: '99.00', maxDevices: 1 }
        }
    }

    const handlePayTRPayment = async () => {
        setLoading(true)

        try {
            const planDetails = getPlanDetails()

            const response = await fetch('/api/paytr/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: userEmail,
                    name: userName,
                    plan: plan,
                    price: planDetails.price,
                    maxDevices: planDetails.maxDevices
                }),
            })

            const data = await response.json()

            if (data.status === 'success' && data.token) {
                setPaymentFrame(data.token)
            } else {
                showToast('Ödeme başlatılamadı: ' + (data.reason || 'Bilinmeyen hata'), 'error')
            }
        } catch (error) {
            console.error('Payment error:', error)
            showToast('Ödeme işlemi sırasında bir hata oluştu', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleBankTransferSubmit = async () => {
        if (!bankTransferForm.payerName || !bankTransferForm.paymentDate) {
            showToast('Lütfen tüm alanları doldurun', 'warning')
            return
        }

        setLoading(true)

        try {
            const planDetails = getPlanDetails()

            const { error } = await supabase
                .from('payment_requests')
                .insert({
                    user_id: userId,
                    plan: plan,
                    amount: parseFloat(planDetails.price),
                    payment_method: 'bank_transfer',
                    payer_name: bankTransferForm.payerName,
                    payment_date: bankTransferForm.paymentDate,
                    status: 'pending'
                })

            if (error) throw error

            // Redirect to pending page
            router.push('/payment/pending')
        } catch (error) {
            console.error('Bank transfer error:', error)
            showToast('Ödeme bildirimi gönderilemedi', 'error')
        } finally {
            setLoading(false)
        }
    }

    const planDetails = getPlanDetails()

    if (paymentFrame) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <div className="bg-white rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Ödeme</h2>
                            <button
                                onClick={() => setPaymentFrame(null)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ✕
                            </button>
                        </div>
                        <iframe
                            src={`https://www.paytr.com/odeme/guvenli/${paymentFrame}`}
                            id="paytriframe"
                            frameBorder="0"
                            scrolling="no"
                            style={{ width: '100%', height: '600px' }}
                        ></iframe>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => router.push('/pricing')}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Paketlere Dön
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Ödeme Yöntemi Seçin
                        </span>
                    </h1>
                    <p className="text-gray-600">Güvenli ödeme için tercih ettiğiniz yöntemi seçin</p>
                </div>

                {/* Payment Method Selection */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod('paytr')}
                        className={`p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'paytr'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'paytr' ? 'bg-blue-600' : 'bg-gray-100'
                                }`}>
                                <CreditCard className={`w-6 h-6 ${paymentMethod === 'paytr' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">Kredi/Banka Kartı</h3>
                                <p className="text-sm text-gray-600">PayTR ile güvenli ödeme</p>
                            </div>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`p-6 rounded-2xl border-2 transition-all ${paymentMethod === 'bank_transfer'
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'bank_transfer' ? 'bg-green-600' : 'bg-gray-100'
                                }`}>
                                <Building2 className={`w-6 h-6 ${paymentMethod === 'bank_transfer' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg">EFT/Havale</h3>
                                <p className="text-sm text-gray-600">Banka havalesi ile ödeme</p>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Payment Content */}
                <AnimatePresence mode="wait">
                    {paymentMethod === 'paytr' ? (
                        <motion.div
                            key="paytr"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 gap-8"
                        >
                            {/* Order Summary */}
                            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold mb-6">Sipariş Özeti</h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <span className="text-gray-600">Paket</span>
                                        <span className="font-semibold">{planDetails.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-4 border-b">
                                        <span className="text-gray-600">Süre</span>
                                        <span className="font-semibold">1 Ay</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4">
                                        <span className="text-xl font-bold">Toplam</span>
                                        <span className="text-3xl font-bold text-blue-600">₺{planDetails.price}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayTRPayment}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Yükleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Ödemeye Geç
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Payment Info */}
                            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold mb-6">Güvenli Ödeme</h2>
                                <div className="space-y-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        <span>256-bit SSL şifreleme</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>PCI DSS uyumlu</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>14 gün ücretsiz deneme</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="bank"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid md:grid-cols-2 gap-8"
                        >
                            {/* Bank Info */}
                            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold mb-6">Banka Hesap Bilgileri</h2>

                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Banka</p>
                                            <p className="font-bold text-lg">Ziraat Bankası</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Hesap Sahibi</p>
                                            <p className="font-bold">Çağrı Yönetimi Ltd. Şti.</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">IBAN</p>
                                            <p className="font-mono font-bold">TR00 0000 0000 0000 0000 0000 00</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tutar</p>
                                            <p className="font-bold text-2xl text-green-600">₺{planDetails.price}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                                    <p className="font-semibold mb-2">⚠️ Önemli Bilgilendirme</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>Ödeme açıklamasına kullanıcı email'inizi yazın</li>
                                        <li>Ödeme sonrası bildirim formunu doldurun</li>
                                        <li>Onay süreci 1-2 iş günü sürebilir</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Payment Notification Form */}
                            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
                                <h2 className="text-2xl font-bold mb-6">Ödeme Bildirimi</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Ödeme Yapan Adı Soyadı *
                                            </div>
                                        </label>
                                        <input
                                            type="text"
                                            value={bankTransferForm.payerName}
                                            onChange={(e) => setBankTransferForm({ ...bankTransferForm, payerName: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            placeholder="Ahmet Yılmaz"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Ödeme Tarihi *
                                            </div>
                                        </label>
                                        <input
                                            type="date"
                                            value={bankTransferForm.paymentDate}
                                            onChange={(e) => setBankTransferForm({ ...bankTransferForm, paymentDate: e.target.value })}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-sm text-gray-600 mb-2">Seçilen Paket</p>
                                        <p className="font-bold text-lg">{planDetails.name} - ₺{planDetails.price}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBankTransferSubmit}
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Ödeme Bildirimini Gönder
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center mt-4">
                                    Bildiriminiz admin onayına gönderilecektir
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        }>
            <PaymentContent />
        </Suspense>
    )
}
