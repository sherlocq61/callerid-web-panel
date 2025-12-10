'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Car, DollarSign, Calendar, Phone, CreditCard, Info } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CreateJobModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    marketplaceSettings: {
        commission_percentage: number
        minimum_balance: number
    }
    userBalance: number
}

export default function CreateJobModal({
    isOpen,
    onClose,
    onSuccess,
    marketplaceSettings,
    userBalance
}: CreateJobModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        from_location: '',
        to_location: '',
        vehicle_type: 'sedan',
        buyer_profit: '',
        customer_total: '',
        payment_type: 'cash',
        job_date: '',
        job_time: '',
        description: '',
        buyer_phone: ''
    })

    const supabase = createBrowserClient()

    const calculateSellerProfit = () => {
        const buyer = parseFloat(formData.buyer_profit) || 0
        const total = parseFloat(formData.customer_total) || 0
        return total - buyer
    }

    const calculateCommission = () => {
        const buyer = parseFloat(formData.buyer_profit) || 0
        return (buyer * marketplaceSettings.commission_percentage) / 100
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                toast.error('Oturum bulunamadı')
                return
            }

            // Validate
            const buyerProfit = parseFloat(formData.buyer_profit)
            const customerTotal = parseFloat(formData.customer_total)

            if (buyerProfit >= customerTotal) {
                toast.error('Alıcı kazancı müşteri tutarından küçük olmalı')
                return
            }

            const commission = calculateCommission()
            if (userBalance < commission) {
                toast.error(`Yetersiz bakiye! Komisyon: ₺${commission.toFixed(2)}`)
                return
            }

            // Combine date and time
            const jobDatetime = new Date(`${formData.job_date}T${formData.job_time}`)

            // Create job
            const { error } = await supabase
                .from('marketplace_jobs')
                .insert({
                    seller_id: session.user.id,
                    from_location: formData.from_location,
                    to_location: formData.to_location,
                    vehicle_type: formData.vehicle_type,
                    buyer_profit: buyerProfit,
                    customer_total: customerTotal,
                    seller_profit: calculateSellerProfit(),
                    commission_percentage: marketplaceSettings.commission_percentage,
                    commission_amount: commission,
                    payment_type: formData.payment_type,
                    buyer_phone: formData.buyer_phone,
                    description: formData.description || null,
                    job_datetime: jobDatetime.toISOString(),
                    status: 'available'
                })

            if (error) throw error

            toast.success('İş ilanı oluşturuldu!')
            onSuccess()
            onClose()

            // Reset form
            setFormData({
                from_location: '',
                to_location: '',
                vehicle_type: 'sedan',
                buyer_profit: '',
                customer_total: '',
                payment_type: 'cash',
                job_date: '',
                job_time: '',
                description: '',
                buyer_phone: ''
            })
        } catch (error: any) {
            console.error('Error creating job:', error)
            toast.error(error.message || 'İş ilanı oluşturulurken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Yeni İş İlanı Oluştur</h2>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Location */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        Nereden
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.from_location}
                                        onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                                        placeholder="İstanbul Havalimanı"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-2" />
                                        Nereye
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.to_location}
                                        onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                                        placeholder="Ankara Esenboğa"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Vehicle Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Car className="w-4 h-4 inline mr-2" />
                                    Araç Tipi
                                </label>
                                <select
                                    value={formData.vehicle_type}
                                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="sedan">Binek</option>
                                    <option value="commercial">Ticari</option>
                                    <option value="vito">Vito</option>
                                    <option value="minibus">Minibüs</option>
                                    <option value="other">Diğer</option>
                                </select>
                            </div>

                            {/* Pricing */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-2" />
                                        Alıcı Kazancı (₺)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.buyer_profit}
                                        onChange={(e) => setFormData({ ...formData, buyer_profit: e.target.value })}
                                        placeholder="1500"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <DollarSign className="w-4 h-4 inline mr-2" />
                                        Müşteri Tutarı (₺)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.customer_total}
                                        onChange={(e) => setFormData({ ...formData, customer_total: e.target.value })}
                                        placeholder="2500"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Calculated Values */}
                            {formData.buyer_profit && formData.customer_total && (
                                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-700">Satıcı Kazancı:</span>
                                        <span className="font-bold text-blue-900">₺{calculateSellerProfit().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-blue-700">Komisyon (%{marketplaceSettings.commission_percentage}):</span>
                                        <span className="font-bold text-blue-900">₺{calculateCommission().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Payment Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <CreditCard className="w-4 h-4 inline mr-2" />
                                    Ödeme Tipi
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            value="cash"
                                            checked={formData.payment_type === 'cash'}
                                            onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                            className="sr-only peer"
                                        />
                                        <div className="px-4 py-3 border-2 border-gray-300 rounded-xl peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center">
                                            <p className="font-semibold">Nakit</p>
                                            <p className="text-xs text-gray-600">Müşteriden nakit alacaksınız</p>
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_type"
                                            value="prepaid"
                                            checked={formData.payment_type === 'prepaid'}
                                            onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                                            className="sr-only peer"
                                        />
                                        <div className="px-4 py-3 border-2 border-gray-300 rounded-xl peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center">
                                            <p className="font-semibold">Ön Ödeme</p>
                                            <p className="text-xs text-gray-600">Müşteriye ödeme yapacaksınız</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        İş Tarihi
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.job_date}
                                        onChange={(e) => setFormData({ ...formData, job_date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        İş Saati
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formData.job_time}
                                        onChange={(e) => setFormData({ ...formData, job_time: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Müşteri Telefonu
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.buyer_phone}
                                    onChange={(e) => setFormData({ ...formData, buyer_phone: e.target.value })}
                                    placeholder="+90 532 123 45 67"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Açıklama (Opsiyonel)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="İş hakkında ek bilgiler..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Balance Warning */}
                            {formData.buyer_profit && calculateCommission() > userBalance && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                    <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-700">
                                        <p className="font-semibold mb-1">Yetersiz Bakiye!</p>
                                        <p>Komisyon: ₺{calculateCommission().toFixed(2)}</p>
                                        <p>Mevcut Bakiye: ₺{userBalance.toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || (formData.buyer_profit && calculateCommission() > userBalance)}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Oluşturuluyor...' : 'İlanı Yayınla'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
