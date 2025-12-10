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
        // Load pricing first (before auth redirect)
        loadPricing()

        // Wait for Electron session restore to complete
        if (!electronLoading) {
            checkAuthAndRedirect()
        }
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
            console.log('Loading pricing from database...')
            const { data, error } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'pricing')
                .single()

            console.log('Pricing data:', data)
            console.log('Pricing error:', error)

            if (data && !error) {
                const pricing = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
                console.log('Parsed pricing:', pricing)

                setPlans(prev => prev.map(plan => {
                    if (plan.name === 'Lite' && pricing.lite) {
                        console.log('Updating Lite plan:', pricing.lite)
                        return {
                            ...plan,
                            monthly: pricing.lite.monthly,
                            yearly: pricing.lite.yearly,
                            yearlyOriginal: pricing.lite.yearlyOriginal
                        }
                    }
                    if (plan.name === 'Pro' && pricing.pro) {
                        console.log('Updating Pro plan:', pricing.pro)
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
                            <div className="relative bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 overflow-hidden p-6">
                                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl" style={{ aspectRatio: '16/14' }}>
                                    <img
                                        src="/dashboard-screenshot.png"
                                        alt="Çağrı Yönetim Sistemi Dashboard"
                                        className="w-full h-full object-cover rounded-2xl"
                                        style={{ objectPosition: 'center 5%' }}
                                    />
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
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-5xl font-bold mb-6">
                                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Güçlü Özellikler
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                İhtiyacınız olan her şey, tek bir platformda. Modern teknoloji ile güçlendirilmiş.
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-gray-100 overflow-hidden"
                            >
                                {/* Gradient Background on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {/* Content */}
                                <div className="relative z-10">
                                    {/* Icon with Animated Gradient */}
                                    <motion.div
                                        className="w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow"
                                        whileHover={{ rotate: 5, scale: 1.1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <feature.icon className="w-8 h-8 text-white" />
                                    </motion.div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>

                                {/* Decorative Corner Element */}
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
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


            {/* Footer */}
            <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Phone className="w-7 h-7 text-white" />
                                </div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Çağrı Yönetimi
                                </span>
                            </div>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Modern çağrı yönetim sistemi ile işletmenizi bir üst seviyeye taşıyın.
                                Tüm aramalarınızı tek platformda yönetin.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gradient-to-br hover:from-blue-600 hover:to-purple-600 rounded-lg flex items-center justify-center transition-all">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" /></svg>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-white">Hızlı Bağlantılar</h3>
                            <ul className="space-y-3">
                                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Fiyatlandırma</Link></li>
                                <li><Link href="/downloads" className="text-gray-400 hover:text-white transition-colors">İndir</Link></li>
                                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Giriş Yap</Link></li>
                                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Kayıt Ol</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-white">Destek</h3>
                            <ul className="space-y-3">
                                <li><a href="mailto:info@cagri-yonetimi.com" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Yardım Merkezi</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik Politikası</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kullanım Koşulları</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-500 text-sm">
                            © 2024 Çağrı Yönetimi. Tüm hakları saklıdır.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Made with</span>
                            <span className="text-red-500">❤️</span>
                            <span>in Turkey</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
