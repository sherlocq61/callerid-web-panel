'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react'

interface CompleteJobModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    paymentType: 'cash' | 'prepaid'
    ibanInfo: {
        iban: string
        accountName: string
    } | null
}

export default function CompleteJobModal({
    isOpen,
    onClose,
    onConfirm,
    paymentType,
    ibanInfo
}: CompleteJobModalProps) {
    const [confirmed, setConfirmed] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        if (!confirmed) return

        setLoading(true)
        try {
            await onConfirm()
            setConfirmed(false)
            onClose()
        } catch (error) {
            console.error('Error completing job:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setConfirmed(false)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <CheckCircle className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-2xl font-bold">İşi Tamamla</h2>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Warning */}
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-900 mb-1">
                                        Dikkat!
                                    </p>
                                    <p className="text-sm text-amber-800">
                                        İşi tamamlamadan önce ödeme işlemini gerçekleştirdiğinizden emin olun.
                                    </p>
                                </div>
                            </div>

                            {/* IBAN Info */}
                            {ibanInfo && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-5 h-5 text-blue-600" />
                                        <p className="font-semibold text-blue-900">Ödeme Bilgileri</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-blue-600 mb-1">Hesap Sahibi</p>
                                            <p className="font-semibold text-blue-900">{ibanInfo.accountName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 mb-1">IBAN</p>
                                            <p className="font-mono text-sm text-blue-900">{ibanInfo.iban}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Confirmation */}
                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900">
                                    {paymentType === 'cash'
                                        ? '📤 Yukarıdaki IBAN\'a ödemeyi yaptınız mı?'
                                        : '📥 Yukarıdaki IBAN\'dan ödemeyi aldınız mı?'}
                                </p>

                                <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={confirmed}
                                        onChange={(e) => setConfirmed(e.target.checked)}
                                        className="w-5 h-5 mt-0.5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">
                                            {paymentType === 'cash'
                                                ? 'Evet, ödemeyi yaptım'
                                                : 'Evet, ödemeyi aldım'}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {paymentType === 'cash'
                                                ? 'Belirtilen IBAN\'a ödemeyi gerçekleştirdim ve işi tamamlamak istiyorum.'
                                                : 'Belirtilen IBAN\'dan ödemeyi aldım ve işi tamamlamak istiyorum.'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-sm text-gray-700">
                                    <strong>ℹ️ Not:</strong> İşi tamamladıktan sonra geri alamazsınız.
                                    Ödeme işlemini gerçekleştirmeden onaylamayın.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!confirmed || loading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Tamamlanıyor...' : 'İşi Tamamla'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
