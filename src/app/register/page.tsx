'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Phone, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createBrowserClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            console.log('Starting signup with:', formData.email)

            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            })

            console.log('Signup response:', { data, error })

            if (error) {
                console.error('Signup error:', error)
                throw error
            }

            // Check if email confirmation is required
            if (data.user && !data.session) {
                // Email confirmation required
                console.log('Email confirmation required')
                setSuccess(true)
            } else {
                // User is already logged in
                console.log('User logged in, redirecting')
                router.push('/dashboard')
            }
        } catch (err: any) {
            console.error('Caught error:', err)
            setError(err.message || 'Kayıt başarısız')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4"
                    >
                        <Phone className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Çağrı Yönetimi
                    </h1>
                    <p className="text-gray-600 mt-2">Hesap oluşturun ve başlayın</p>
                </div>

                {/* Register Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100"
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ad Soyad
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Ahmet Yılmaz"
                                    required
                                    disabled={loading || success}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="ornek@email.com"
                                    required
                                    disabled={loading || success}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={loading || success}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">En az 6 karakter</p>
                        </div>

                        {/* Success Message - Email Verification */}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500 rounded-xl p-6"
                            >
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-blue-900 font-bold text-xl mb-2">
                                        Email Doğrulama Gerekli 📧
                                    </h3>
                                    <p className="text-blue-800 mb-4">
                                        <strong>{formData.email}</strong> adresine bir doğrulama linki gönderdik.
                                    </p>
                                    <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm text-gray-700">
                                        <p className="flex items-start gap-2">
                                            <span className="text-blue-600 font-bold">1.</span>
                                            Email kutunuzu kontrol edin
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="text-blue-600 font-bold">2.</span>
                                            "Confirm your email" linkine tıklayın
                                        </p>
                                        <p className="flex items-start gap-2">
                                            <span className="text-blue-600 font-bold">3.</span>
                                            Doğruladıktan sonra giriş yapabilirsiniz
                                        </p>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-4">
                                        💡 Email gelmedi mi? Spam klasörünü kontrol edin
                                    </p>
                                    <Link
                                        href="/login"
                                        className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                    >
                                        Giriş Sayfasına Dön
                                    </Link>
                                </div>
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Hesap Oluşturuluyor...
                                </>
                            ) : success ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Başarılı!
                                </>
                            ) : (
                                <>
                                    Hesap Oluştur
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    {!success && (
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                Zaten hesabınız var mı?{' '}
                                <Link
                                    href="/login"
                                    className="text-blue-600 font-semibold hover:text-purple-600 transition-colors"
                                >
                                    Giriş Yap
                                </Link>
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Back to Home */}
                {!success && (
                    <div className="text-center mt-6">
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
                        >
                            ← Ana Sayfaya Dön
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
