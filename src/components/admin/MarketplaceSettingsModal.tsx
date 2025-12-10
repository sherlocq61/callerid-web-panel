'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingCart, DollarSign, Wallet, Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react'

interface MarketplaceSettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function MarketplaceSettingsModal({ isOpen, onClose }: MarketplaceSettingsModalProps) {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        enabled: true,
        commission_percentage: 10,
        minimum_balance: 100,
        cancellation_hours: 3
    })

    const supabase = createBrowserClient()

    useEffect(() => {
        if (isOpen) {
            loadSettings()
        }
    }, [isOpen])

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_settings')
                .select('value')
                .eq('key', 'marketplace_config')
                .single()

            if (data && !error) {
                setSettings(data.value as any)
            }
        } catch (error) {
            console.error('Error loading settings:', error)
            toast.error('Ayarlar yüklenirken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('marketplace_settings')
                .update({ value: settings })
                .eq('key', 'marketplace_config')

            if (error) throw error

            toast.success('Ayarlar kaydedildi!')
            onClose()
        } catch (error: any) {
            console.error('Error saving settings:', error)
            toast.error(error.message || 'Ayarlar kaydedilirken hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0 z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <ShoppingCart className="w-8 h-8" />
                                    <h2 className="text-2xl font-bold">İş Havuzu Ayarları</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-indigo-100 text-sm">
                                İş havuzu sistemini yönetin ve ayarları düzenleyin
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                {/* Enable/Disable */}
                                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        {settings.enabled ? (
                                            <ToggleRight className="w-12 h-12 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="w-12 h-12 text-gray-400" />
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                Sistem Durumu
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {settings.enabled
                                                    ? 'Aktif - Kullanıcılar iş paylaşabilir'
                                                    : 'Kapalı - Kullanıcılar iş paylaşamaz'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                                        className={`px-8 py-4 rounded-xl font-semibold transition-all ${settings.enabled
                                                ? 'bg-green-600 text-white hover:bg-green-700'
                                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                            }`}
                                    >
                                        {settings.enabled ? 'Aktif' : 'Kapalı'}
                                    </button>
                                </div>

                                {/* Commission Percentage */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <DollarSign className="w-5 h-5 inline mr-2" />
                                        Komisyon Oranı (%)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={settings.commission_percentage}
                                            onChange={(e) => setSettings({ ...settings, commission_percentage: parseFloat(e.target.value) })}
                                            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                                        />
                                        <div className="text-4xl font-bold text-indigo-600">
                                            %{settings.commission_percentage}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Her iş satışından alınacak komisyon oranı
                                    </p>
                                </div>

                                {/* Minimum Balance */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <Wallet className="w-5 h-5 inline mr-2" />
                                        Minimum Bakiye (₺)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            value={settings.minimum_balance}
                                            onChange={(e) => setSettings({ ...settings, minimum_balance: parseFloat(e.target.value) })}
                                            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                                        />
                                        <div className="text-4xl font-bold text-green-600">
                                            ₺{settings.minimum_balance}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        İş oluşturmak için gereken minimum bakiye
                                    </p>
                                </div>

                                {/* Cancellation Hours */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        <Clock className="w-5 h-5 inline mr-2" />
                                        İptal Süresi (Saat)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="48"
                                            step="1"
                                            value={settings.cancellation_hours}
                                            onChange={(e) => setSettings({ ...settings, cancellation_hours: parseInt(e.target.value) })}
                                            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
                                        />
                                        <div className="text-4xl font-bold text-orange-600">
                                            {settings.cancellation_hours}h
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        İş başlangıcından kaç saat önce iptal edilebilir
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
