'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ShoppingCart, DollarSign, Wallet, Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react'

export default function MarketplaceSettingsPage() {
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
        loadSettings()
    }, [])

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
        } catch (error: any) {
            console.error('Error saving settings:', error)
            toast.error(error.message || 'Ayarlar kaydedilirken hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-600" />
                        İş Havuzu Ayarları
                    </h1>
                    <p className="text-gray-600">
                        İş havuzu sistemini yönetin ve ayarları düzenleyin
                    </p>
                </motion.div>

                {/* Settings Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-8 space-y-8"
                >
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                        <div className="flex items-center gap-4">
                            {settings.enabled ? (
                                <ToggleRight className="w-12 h-12 text-green-600" />
                            ) : (
                                <ToggleLeft className="w-12 h-12 text-gray-400" />
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    İş Havuzu Sistemi
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {settings.enabled
                                        ? 'Sistem aktif - Kullanıcılar iş paylaşabilir'
                                        : 'Sistem kapalı - Kullanıcılar iş paylaşamaz'}
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
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                            />
                            <div className="text-4xl font-bold text-blue-600">
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
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
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
                                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                            />
                            <div className="text-4xl font-bold text-orange-600">
                                {settings.cancellation_hours}h
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            İş başlangıcından kaç saat önce iptal edilebilir
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Bilgi:</strong> Ayarları değiştirdikten sonra "Kaydet" butonuna tıklamayı unutmayın.
                            Değişiklikler anında tüm kullanıcılar için geçerli olacaktır.
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
