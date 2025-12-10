'use client'

import { motion } from 'framer-motion'
import { MapPin, Car, DollarSign, Users, Calendar, Phone, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Job {
    id: string
    from_location: string
    to_location: string
    vehicle_type: string
    buyer_profit: number
    customer_total: number
    seller_profit: number
    commission_percentage: number
    commission_amount: number
    payment_type: string
    status: string
    buyer_phone: string
    buyer_phone_revealed: boolean
    seller_iban: string | null
    buyer_iban: string | null
    seller_account_name: string | null
    buyer_account_name: string | null
    iban_revealed: boolean
    description: string | null
    job_datetime: string
    seller_id: string
    buyer_id: string | null
}

interface JobCardProps {
    job: Job
    currentUserId: string
    onPurchase?: (job: Job) => void
    onApprove?: (job: Job) => void
    onReject?: (job: Job) => void
    onCancel?: (job: Job) => void
    onShareIBAN?: (job: Job) => void
    onComplete?: (job: Job) => void
}

export default function JobCard({
    job,
    currentUserId,
    onPurchase,
    onApprove,
    onReject,
    onCancel,
    onShareIBAN,
    onComplete
}: JobCardProps) {
    const isSeller = job.seller_id === currentUserId
    const isBuyer = job.buyer_id === currentUserId
    const isAvailable = job.status === 'available'
    const isPendingApproval = job.status === 'pending_approval'
    const isApproved = job.status === 'approved'

    const getVehicleLabel = (type: string) => {
        const labels: Record<string, string> = {
            sedan: 'Binek',
            commercial: 'Ticari',
            vito: 'Vito',
            minibus: 'Minibüs',
            other: 'Diğer'
        }
        return labels[type] || type
    }

    const maskPhone = (phone: string) => {
        if (!phone) return ''
        const cleaned = phone.replace(/\D/g, '')
        if (cleaned.length < 10) return phone
        return `+90 ${cleaned.slice(2, 3)}** *** ** **`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = () => {
        switch (job.status) {
            case 'available':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Müsait</span>
            case 'pending_approval':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Onay Bekliyor</span>
            case 'approved':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Onaylandı</span>
            case 'cancelled':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">İptal Edildi</span>
            case 'completed':
                return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">Tamamlandı</span>
            default:
                return null
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
        >
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {job.from_location} → {job.to_location}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                {getVehicleLabel(job.vehicle_type)}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Pricing Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-sm text-green-600 mb-1">Kazancınız</p>
                        <p className="text-2xl font-bold text-green-700">
                            ₺{job.buyer_profit.toLocaleString('tr-TR')}
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-sm text-blue-600 mb-1">Müşteri Tutarı</p>
                        <p className="text-2xl font-bold text-blue-700">
                            ₺{job.customer_total.toLocaleString('tr-TR')}
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Komisyon
                        </span>
                        <span className="font-semibold text-gray-900">
                            %{job.commission_percentage} (₺{job.commission_amount.toLocaleString('tr-TR')})
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Ödeme Tipi
                        </span>
                        <span className="font-semibold text-gray-900">
                            {job.payment_type === 'cash' ? 'Nakit' : 'Ön Ödeme'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            İş Tarihi
                        </span>
                        <span className="font-semibold text-gray-900">
                            {formatDate(job.job_datetime)}
                        </span>
                    </div>

                    {/* Phone Number (for buyer) */}
                    {isBuyer && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Müşteri Tel
                            </span>
                            <span className="font-semibold text-gray-900">
                                {job.buyer_phone_revealed ? job.buyer_phone : maskPhone(job.buyer_phone)}
                            </span>
                        </div>
                    )}

                    {/* IBAN Info */}
                    {isApproved && job.iban_revealed && (
                        <div className="bg-yellow-50 rounded-xl p-3">
                            <p className="text-sm text-yellow-700 font-semibold mb-1">IBAN Bilgisi</p>
                            <p className="text-xs text-yellow-600 font-mono">
                                {job.payment_type === 'cash' ? job.seller_iban : job.buyer_iban}
                            </p>
                        </div>
                    )}
                </div>

                {/* Description */}
                {job.description && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <p className="text-sm text-gray-600">{job.description}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {/* Available - Anyone can purchase */}
                    {isAvailable && !isSeller && (
                        <button
                            onClick={() => onPurchase?.(job)}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            İşi Al
                        </button>
                    )}

                    {/* Pending Approval - Seller can approve/reject */}
                    {isPendingApproval && isSeller && (
                        <>
                            <button
                                onClick={() => onApprove?.(job)}
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Onayla
                            </button>
                            <button
                                onClick={() => onReject?.(job)}
                                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <XCircle className="w-5 h-5" />
                                Reddet
                            </button>
                        </>
                    )}

                    {/* Pending Approval - Buyer can cancel */}
                    {isPendingApproval && isBuyer && (
                        <button
                            onClick={() => onCancel?.(job)}
                            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                        >
                            İptal Et
                        </button>
                    )}

                    {/* Approved - Share IBAN */}
                    {isApproved && !job.iban_revealed && (
                        <>
                            {(job.payment_type === 'cash' && isSeller) || (job.payment_type === 'prepaid' && isBuyer) ? (
                                <button
                                    onClick={() => onShareIBAN?.(job)}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    IBAN Paylaş
                                </button>
                            ) : (
                                <div className="flex-1 bg-yellow-50 text-yellow-700 py-3 rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    {job.payment_type === 'cash' ? 'Satıcının IBAN\'ı bekleniyor' : 'Alıcının IBAN\'ı bekleniyor'}
                                </div>
                            )}
                        </>
                    )}

                    {/* Approved - Mark as completed */}
                    {isApproved && job.iban_revealed && (
                        <button
                            onClick={() => onComplete?.(job)}
                            className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                        >
                            Tamamlandı İşaretle
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
