'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase/client'
import { useElectronAuth } from '@/hooks/useElectronAuth'
import {
    Phone,
    Shield,
    Zap,
    Users,
    CheckCircle,
    ArrowRight,
    Smartphone,
    Globe,
    TrendingUp
} from 'lucide-react'

export default function LandingPage() {
    const supabase = createBrowserClient()
    const { loading: electronLoading, session: electronSession } = useElectronAuth()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
    const [loading, setLoading] = useState(true)
    const [plans, setPlans] = useState([
        {
            name: 'Lite',
            monthly: 99,
            yearly: 990,
            yearlyOriginal: 1188,
            features: [
                '1 Cihaz',
                'Sınırsız Arama Kaydı',
                'Web Panel Erişimi',
                'Email Destek'
            ],
            color: 'from-orange-500 to-amber-500'
        },
        {
            name: 'Pro',
            monthly: 249,
            yearly: 2490,
            yearlyOriginal: 2988,
            features: [
                '5 Cihaz',
                'Sınırsız Arama Kaydı',
                'Web Panel Erişimi',
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
            features: [
                'Sınırsız Cihaz',
                'Özel Sunucu',
                'Özel Entegrasyon',
                '7/24 Destek',
                'Özel Eğitim',
                'SLA Garantisi'
            ],
            color: 'from-purple-500 to-pink-500'
        }
    ])

    useEffect(() => {
        // Wait for Electron session restore to complete
        if (!electronLoading) {
            checkAuthAndRedirect()
        }
        loadPricing()
    }, [electronLoading, electronSession])

    const checkAuthAndRedirect = async () => {
        try {
            // If Electron session is restored, redirect immediately
            if (electronSession) {
                console.log('Electron session found, redirecting to dashboard...')
                window.location.href = '/dashboard'
                return
            }

            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // User is logged in, redirect to dashboard
                console.log('Supabase session found, redirecting to dashboard...')
                window.location.href = '/dashboard'
            } else {
                setLoading(false)
            }
        } catch (error) {
            console.error('Error checking auth:', error)
            setLoading(false)
        }
    }

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
    const features = [
        {
            icon: Phone,
            title: 'Akıllı Çağrı Yönetimi',
            description: 'Tüm aramalarınızı otomatik olarak kaydeder ve düzenler'
        },
        {
            icon: Shield,
            title: 'Güvenli ve Özel',
            description: 'Verileriniz end-to-end şifreleme ile korunur'
        },
        {
            icon: Zap,
            title: 'Gerçek Zamanlı Senkronizasyon',
            description: 'Web ve mobil arasında anlık veri paylaşımı'
        },
        {
            icon: Users,
            title: 'Ekip Yönetimi',
            description: 'Çoklu cihaz desteği ve ekip üyeleri yönetimi'
        },
        {
            icon: Globe,
            title: 'Her Yerden Erişim',
            description: 'Web paneli ile her yerden aramalarınızı görüntüleyin'
        },
        {
            icon: TrendingUp,
            title: 'Detaylı Raporlama',
            description: 'Arama istatistikleri ve analiz raporları'
        }
    ]

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
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Çağrı Yönetimi
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/downloads"
                                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                            >
                                İndirmeler
                            </Link>
                            <Link
                                href="/status"
                                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                            >
                                Durum
                            </Link>
                            <Link
                                href="/login"
                                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                            >
                                Giriş Yap
                            </Link>
                            <Link
                                href="/register"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                            >
                                Başlayın
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Aramalarınızı
                            </span>
                            <br />
                            <span className="text-gray-900">Profesyonelce Yönetin</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Modern çağrı yönetim sistemi ile tüm aramalarınızı takip edin,
                            analiz edin ve ekibinizle paylaşın.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                            >
                                Ücretsiz Deneyin
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/login"
                                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all border border-gray-200"
                            >
                                Demo İzle
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-16"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-3xl opacity-20 rounded-3xl"></div>
                            <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200">
                                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                    <Smartphone className="w-32 h-32 text-blue-600/30" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 bg-white/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Güçlü Özellikler
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            İhtiyacınız olan her şey, tek bir platformda
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Fiyatlandırma
                            </span>
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            İhtiyacınıza uygun planı seçin
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

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
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
                                    <Phone className="w-8 h-8 text-white" />
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
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/register"
                                    className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all ${plan.popular
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    Başlayın
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl"
                    >
                        <h2 className="text-4xl font-bold mb-4">
                            Hemen Başlayın
                        </h2>
                        <p className="text-xl mb-8 opacity-90">
                            14 gün ücretsiz deneme. Kredi kartı gerekmez.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all"
                        >
                            Ücretsiz Deneyin
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">Çağrı Yönetimi</span>
                    </div>
                    <p className="text-gray-400 mb-4">
                        Modern çağrı yönetim sistemi
                    </p>
                    <p className="text-gray-500 text-sm">
                        © 2024 Çağrı Yönetimi. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    )
}
