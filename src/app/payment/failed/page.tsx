'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentFailedPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full"
            >
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <XCircle className="w-12 h-12 text-white" />
                    </motion.div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Ödeme Başarısız
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/pricing')}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Tekrar Dene
                        </button>

                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Dashboard'a Dön
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
