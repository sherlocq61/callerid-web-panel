'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, User } from 'lucide-react'

interface ShareIBANModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (iban: string, accountName: string) => void
    paymentType: 'cash' | 'prepaid'
}

export default function ShareIBANModal({ isOpen, onClose, onSubmit, paymentType }: ShareIBANModalProps) {
    const [iban, setIban] = useState('')
    const [accountName, setAccountName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onSubmit(iban, accountName)
            setIban('')
            setAccountName('')
            onClose()
        } catch (error) {
            console.error('Error sharing IBAN:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatIBAN = (value: string) => {
        // Remove spaces and convert to uppercase
        const cleaned = value.replace(/\s/g, '').toUpperCase()
        // Add space every 4 characters
        return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
    }

    const handleIBANChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatIBAN(e.target.value)
        setIban(formatted)
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
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold">IBAN Bilgisi Paylaş</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-blue-100 text-sm">
                                {paymentType === 'cash'
                                    ? 'Müşteriden aldığınız nakiti bu hesaba yatırın'
                                    : 'Müşteriye ödeme yapacağınız hesap bilgileri'}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Account Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Hesap Sahibi (Ad Soyad)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                    placeholder="Ahmet Yılmaz"
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* IBAN */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <CreditCard className="w-4 h-4 inline mr-2" />
                                    IBAN Numarası
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={iban}
                                    onChange={handleIBANChange}
                                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                                    maxLength={32}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono transition-all"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    IBAN otomatik olarak formatlanacaktır
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>ℹ️ Bilgi:</strong> IBAN bilgileriniz sadece işi alan/veren kişi ile paylaşılacaktır.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !iban || !accountName}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Paylaşılıyor...' : 'Paylaş'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
