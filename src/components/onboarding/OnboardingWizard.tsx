'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Download,
    Smartphone,
    LogIn,
    Shield,
    Wifi,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Loader2,
    QrCode
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

interface OnboardingStep {
    id: number
    title: string
    description: string
    icon: any
    action?: string
    actionLabel?: string
}

const STEPS: OnboardingStep[] = [
    {
        id: 1,
        title: 'Hoş Geldiniz! 🎉',
        description: 'Çağrı Yönetimi sistemine hoş geldiniz! Şimdi Android uygulamasını kurarak başlayalım.',
        icon: CheckCircle,
        actionLabel: 'Başlayalım'
    },
    {
        id: 2,
        title: 'APK İndir 📱',
        description: 'Android uygulamasını indirmek için aşağıdaki butona tıklayın veya QR kodu telefonunuzla tarayın.',
        icon: Download,
        action: 'download',
        actionLabel: 'APK İndir'
    },
    {
        id: 3,
        title: 'Uygulamayı Yükle 📲',
        description: 'İndirdiğiniz APK dosyasını açın ve kurulum adımlarını takip edin. "Bilinmeyen kaynaklardan yükleme" iznini vermeniz gerekebilir.',
        icon: Smartphone,
        actionLabel: 'Yükledim'
    },
    {
        id: 4,
        title: 'Giriş Yap 🔐',
        description: 'Uygulamayı açın ve web paneline giriş yaptığınız email ve şifre ile giriş yapın.',
        icon: LogIn,
        actionLabel: 'Giriş Yaptım'
    },
    {
        id: 5,
        title: 'İzinleri Ver ✅',
        description: 'Uygulamanın düzgün çalışması için gerekli izinleri verin: Telefon, Kişiler, Bildirimler.',
        icon: Shield,
        actionLabel: 'İzinleri Verdim'
    },
    {
        id: 6,
        title: 'Cihaz Çevrimiçi Bekleniyor ⏳',
        description: 'Uygulamaya giriş yaptıktan sonra cihazınız otomatik olarak çevrimiçi olacak. Lütfen bekleyin...',
        icon: Wifi
    },
    {
        id: 7,
        title: 'Tamamlandı! 🎊',
        description: 'Harika! Kurulum tamamlandı. Artık tüm aramalarınızı web panelinden takip edebilirsiniz.',
        icon: CheckCircle,
        actionLabel: 'Dashboard\'a Git'
    }
]

export default function OnboardingWizard() {
    const router = useRouter()
    const supabase = createBrowserClient()
    const { width, height } = useWindowSize()

    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [deviceOnline, setDeviceOnline] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [apkUrl, setApkUrl] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        loadOnboardingState()
        loadApkUrl()
    }, [])

    useEffect(() => {
        if (userId && currentStep === 6) {
            subscribeToDeviceStatus()
        }
    }, [currentStep, userId])

    const loadOnboardingState = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setUserId(user.id)

            const { data, error } = await supabase
                .from('user_onboarding')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error) {
                // Create onboarding record if it doesn't exist
                await supabase
                    .from('user_onboarding')
                    .insert({ user_id: user.id })
            } else if (data.completed) {
                // Already completed, redirect to dashboard
                router.push('/dashboard')
                return
            } else {
                setCurrentStep(data.current_step)
            }

            setLoading(false)
        } catch (err) {
            console.error('Error loading onboarding:', err)
            setLoading(false)
        }
    }

    const loadApkUrl = async () => {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'apk_download_url')
            .single()

        if (data) {
            setApkUrl(data.value)
        }
    }

    const subscribeToDeviceStatus = () => {
        const channel = supabase
            .channel('device-status')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'devices',
                filter: `user_id=eq.${userId}`
            }, (payload: any) => {
                if (payload.new.is_online) {
                    setDeviceOnline(true)
                    handleNext()
                }
            })
            .subscribe()

        // Also check current status
        checkDeviceStatus()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const checkDeviceStatus = async () => {
        const { data } = await supabase
            .from('devices')
            .select('is_online')
            .eq('user_id', userId)
            .maybeSingle()

        if (data?.is_online) {
            setDeviceOnline(true)
            handleNext()
        }
    }

    const handleNext = async () => {
        const nextStep = currentStep + 1

        if (nextStep > STEPS.length) {
            // Mark as completed
            await supabase
                .from('user_onboarding')
                .update({
                    completed: true,
                    completed_at: new Date().toISOString(),
                    current_step: nextStep
                })
                .eq('user_id', userId)

            setShowConfetti(true)
            setTimeout(() => {
                router.push('/dashboard')
            }, 3000)
            return
        }

        setCurrentStep(nextStep)

        // Update database
        await supabase
            .from('user_onboarding')
            .update({ current_step: nextStep })
            .eq('user_id', userId)
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleDownloadApk = () => {
        if (apkUrl) {
            window.open(apkUrl, '_blank')
        }
        handleNext()
    }

    const handleAction = () => {
        const step = STEPS[currentStep - 1]

        if (step.action === 'download') {
            handleDownloadApk()
        } else if (currentStep === 7) {
            router.push('/dashboard')
        } else {
            handleNext()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        )
    }

    const step = STEPS[currentStep - 1]
    const Icon = step.icon
    const progress = (currentStep / STEPS.length) * 100

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            {showConfetti && <Confetti width={width} height={height} />}

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                            Adım {currentStep} / {STEPS.length}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                            %{Math.round(progress)}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                        />
                    </div>
                </div>

                {/* Main Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                                <Icon className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
                            {step.title}
                        </h2>

                        {/* Description */}
                        <p className="text-lg text-center text-gray-600 mb-8">
                            {step.description}
                        </p>

                        {/* Step-specific content */}
                        {currentStep === 2 && (
                            <div className="mb-8 flex flex-col items-center gap-4">
                                <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <QrCode className="w-32 h-32 text-gray-400" />
                                    <div className="absolute text-xs text-gray-500">QR Kod</div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Telefonunuzla QR kodu tarayın veya butona tıklayın
                                </p>
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="mb-8 flex flex-col items-center">
                                {deviceOnline ? (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </motion.div>
                                ) : (
                                    <div className="relative">
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center"
                                        >
                                            <Wifi className="w-10 h-10 text-orange-600" />
                                        </motion.div>
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 bg-orange-200 rounded-full"
                                        />
                                    </div>
                                )}
                                <p className="mt-4 text-sm text-gray-500">
                                    {deviceOnline ? 'Cihaz çevrimiçi! ✓' : 'Cihazınız çevrimiçi olması bekleniyor...'}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4">
                            {currentStep > 1 && currentStep < 7 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Geri
                                </button>
                            )}

                            {step.actionLabel && currentStep !== 6 && (
                                <button
                                    onClick={handleAction}
                                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    {step.actionLabel}
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
