'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Check, Crown, Zap, Shield, AlertCircle, XCircle, LogOut } from 'lucide-react'

interface Subscription {
    plan: 'lite' | 'pro' | 'enterprise'
    status: 'active' | 'cancelled' | 'expired'
    expires_at: string | null
}

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
    const [loading, setLoading] = useState(true)
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [userEmail, setUserEmail] = useState<string>('')
    const [message, setMessage] = useState<{ type: 'info' | 'warning' | 'error', text: string } | null>(null)
    const [plans, setPlans] = useState([
        {
            name: 'Lite',
            monthly: 99,
            yearly: 990,
            yearlyOriginal: 1188,
            icon: Zap,
            features: [
                '1 Cihaz',
                'Sınırsız Arama Kaydı',
                'Web Panel Erişimi',
                'Kara Liste Havuzu',
                'Email Destek'
            ],
            color: 'from-orange-500 to-amber-500',
            popular: false
        },
        {
            name: 'Pro',
            monthly: 249,
            yearly: 2490,
            yearlyOriginal: 2988,
            icon: Crown,
            features: [
                '5 Cihaz',
                'Sınırsız Arama Kaydı',
                'Web Panel Erişimi',
                'Kara Liste Havuzu',
                'Öncelikli Destek',
                'Gelişmiş Raporlama',
                'API Erişimi'
            ],
            color: 'from-blue-500 to-cyan-500',
            popular: true
        },
        {
            name: 'Enterprise',
            monthly: null,
            yearly: null,
            yearlyOriginal: null,
            icon: Shield,
            features: [
                'Sınırsız Cihaz',
                'Özel Sunucu',
                'Özel Entegrasyon',
                '7/24 Destek',
                'Özel Eğitim',
                'SLA Garantisi',
                'Özel Geliştirme'
            ],
            color: 'from-purple-500 to-pink-500',
            popular: false
        }
    ])
    const router = useRouter()
    const supabase = createBrowserClient()

    useEffect(() => {
        checkAuthAndSubscription()
        loadPricing()
    }, [])

    const loadPricing = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'pricing')
                .single()

            if (data && !error) {
                const pricing = typeof data.value === 'string' ? JSON.parse(data.value) : data.value

                setPlans(prev => prev.map(plan => {
                    if (plan.name === 'Lite' && pricing.lite) {
                        return {
                            ...plan,
                            monthly: pricing.lite.monthly,
                            yearly: pricing.lite.yearly,
                            yearlyOriginal: pricing.lite.yearlyOriginal
                        }
                    }
                    if (plan.name === 'Pro' && pricing.pro) {
                        return {
                            ...plan,
                            monthly: pricing.pro.monthly,
                            yearly: pricing.pro.yearly,
                            yearlyOriginal: pricing.pro.yearlyOriginal
                        }
                    }
                    return plan
                }))
            }
        } catch (error) {
            console.error('Error loading pricing:', error)
        }
    }

    const checkAuthAndSubscription = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            setUserEmail(session.user.email || '')

            // Check subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('plan, status, expires_at')
                .eq('user_id', session.user.id)
                .single()

            if (subData) {
                setSubscription(subData)

                // Set message based on subscription status
                if (subData.status === 'expired') {
                    setMessage({
                        type: 'error',
                        text: 'Paketinizin süresi doldu! Dashboard\'a erişmek için yeni bir paket satın almanız gerekiyor.'
                    })
                } else if (subData.status === 'cancelled') {
                    setMessage({
                        type: 'warning',
                        text: 'Paketiniz iptal edildi. Dashboard\'a erişmek için yeni bir paket satın almanız gerekiyor.'
                    })
                } else if (subData.status === 'active') {
                    setMessage({
                        type: 'info',
                        text: 'Mevcut paketinizi yükseltmek veya değiştirmek için aşağıdaki paketlerden birini seçin.'
                    })
                }
            } else {
                setMessage({
                    type: 'info',
                    text: 'Henüz bir paketiniz yok. Dashboard\'a erişmek için aşağıdaki paketlerden birini satın alın.'
                })
            }

            setLoading(false)
        } catch (error) {
            console.error('Error:', error)
            router.push('/login')
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const handleSelectPlan = async (planName: string, price: string) => {
        if (planName === 'Enterprise') {
            // For enterprise, redirect to contact
            window.location.href = 'mailto:info@cagri-yonetimi.com?subject=Enterprise Plan'
            return
        }

        // Redirect to payment page with plan info
        router.push(`/payment?plan=${planName.toLowerCase()}&price=${price}`)
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Çağrı Yönetimi
                            </h1>
                            {subscription && subscription.status === 'active' && (
                                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${subscription.plan === 'lite' ? 'from-orange-500 to-amber-500' :
                                    subscription.plan === 'pro' ? 'from-blue-500 to-cyan-500' :
                                        'from-purple-500 to-pink-500'
                                    } text-white text-sm font-semibold flex items-center gap-1`}>
                                    <Crown className="w-4 h-4" />
                                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{userEmail}</span>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Message Banner */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 rounded-xl p-4 border-2 flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
                            message.type === 'warning' ? 'bg-orange-50 border-orange-300 text-orange-800' :
                                'bg-blue-50 border-blue-300 text-blue-800'
                            }`}
                    >
                        {message.type === 'error' ? (
                            <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-semibold text-lg mb-1">
                                {message.type === 'error' ? 'Paket Süresi Doldu' :
                                    message.type === 'warning' ? 'Paket İptal Edildi' :
                                        subscription ? 'Paket Yükseltme' : 'Paket Seçimi'}
                            </p>
                            <p>{message.text}</p>
                        </div>
                    </motion.div>
                )}

                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold mb-4">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {subscription?.status === 'active' ? 'Paket Yükseltme' : 'Paket Seçin'}
                        </span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        İhtiyacınıza uygun planı seçin ve hemen başlayın
                    </p>

                    {/* Billing Period Toggle */}
                    <div className="inline-flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setBillingPeriod('monthly')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${billingPeriod === 'monthly'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Aylık
                        </button>
                        <button
                            onClick={() => setBillingPeriod('yearly')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${billingPeriod === 'yearly'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Yıllık
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                %17 İndirim
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 ${plan.popular ? 'border-blue-600 scale-105' : 'border-gray-100'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Popüler
                                    </span>
                                </div>
                            )}

                            <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6`}>
                                <plan.icon className="w-8 h-8 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                {plan.monthly === null ? (
                                    <span className="text-4xl font-bold">Özel</span>
                                ) : (
                                    <>
                                        {billingPeriod === 'yearly' && plan.yearlyOriginal && (
                                            <div className="text-sm text-gray-500 line-through mb-1">
                                                ₺{plan.yearlyOriginal}/yıl
                                            </div>
                                        )}
                                        <span className="text-4xl font-bold">
                                            ₺{billingPeriod === 'monthly' ? plan.monthly : plan.yearly}
                                        </span>
                                        <span className="text-gray-600">
                                            /{billingPeriod === 'monthly' ? 'ay' : 'yıl'}
                                        </span>
                                    </>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan.name, billingPeriod === 'monthly' ? String(plan.monthly) : String(plan.yearly))}
                                className={`w-full text-center py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                            >
                                {plan.name === 'Enterprise' ? 'İletişime Geç' : 'Satın Al'}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Back to Dashboard (if active subscription) */}
                {subscription?.status === 'active' && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
                        >
                            ← Dashboard'a Dön
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
