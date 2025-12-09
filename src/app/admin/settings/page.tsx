// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Save, DollarSign, Building2, Globe, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'

interface PricingPlan {
    monthly: number
    yearly: number
    yearlyOriginal: number
    discount: number
}

interface Pricing {
    lite: PricingPlan
    pro: PricingPlan
}

interface Settings {
    paytr_merchant_id: string
    paytr_merchant_key: string
    paytr_merchant_salt: string
    bank_name: string
    bank_account_holder: string
    bank_iban: string
    site_name: string
    site_description: string
    support_email: string
    pricing: Pricing
}

export default function AdminSettingsPage() {
    const supabase = createBrowserClient()
    const { showToast } = useNotification()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<Settings>({
        paytr_merchant_id: '',
        paytr_merchant_key: '',
        paytr_merchant_salt: '',
        bank_name: '',
        bank_account_holder: '',
        bank_iban: '',
        site_name: '',
        site_description: '',
        support_email: '',
        pricing: {
            lite: { monthly: 99, yearly: 990, yearlyOriginal: 1188, discount: 17 },
            pro: { monthly: 249, yearly: 2490, yearlyOriginal: 2988, discount: 17 }
        }
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('settings')
                .select('key, value')

            if (error) throw error

            const settingsObj: any = {}
            data?.forEach((item) => {
                try {
                    settingsObj[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value
                } catch (e) {
                    settingsObj[item.key] = item.value
                }
            })

            setSettings(settingsObj)
            setLoading(false)
        } catch (error) {
            console.error('Error loading settings:', error)
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)

        try {
            // Helper to determine category based on key
            const getCategoryForKey = (key: string): string => {
                if (key.startsWith('paytr_')) return 'payment'
                if (key.startsWith('bank_')) return 'payment'
                if (key.startsWith('site_') || key === 'support_email') return 'site'
                if (key === 'pricing') return 'pricing'
                return 'site'
            }

            const updates = Object.entries(settings).map(([key, value]) => ({
                key,
                value: JSON.stringify(value),
                category: getCategoryForKey(key)
            }))

            for (const update of updates) {
                const { error } = await supabase
                    .from('settings')
                    .upsert({
                        key: update.key,
                        value: update.value,
                        category: update.category
                    }, {
                        onConflict: 'key'
                    })

                if (error) throw error
            }

            showToast('Ayarlar başarıyla kaydedildi!', 'success')
        } catch (error) {
            console.error('Error saving settings:', error)
            showToast('Ayarlar kaydedilirken hata oluştu', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Ayarları</h1>
                        <p className="text-gray-600">Sistem ayarlarını yönetin</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* PayTR Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">PayTR API Bilgileri</h2>
                                <p className="text-sm text-gray-600">Kredi kartı ödeme entegrasyonu</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                                <input
                                    type="text"
                                    value={settings.paytr_merchant_id}
                                    onChange={(e) => setSettings({ ...settings, paytr_merchant_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="123456"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Key</label>
                                <input
                                    type="password"
                                    value={settings.paytr_merchant_key}
                                    onChange={(e) => setSettings({ ...settings, paytr_merchant_key: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Salt</label>
                                <input
                                    type="password"
                                    value={settings.paytr_merchant_salt}
                                    onChange={(e) => setSettings({ ...settings, paytr_merchant_salt: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Bank Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Banka Hesap Bilgileri</h2>
                                <p className="text-sm text-gray-600">EFT/Havale için banka bilgileri</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Banka Adı</label>
                                <input
                                    type="text"
                                    value={settings.bank_name}
                                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                    placeholder="Ziraat Bankası"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Sahibi</label>
                                <input
                                    type="text"
                                    value={settings.bank_account_holder}
                                    onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                    placeholder="Çağrı Yönetimi Ltd. Şti."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                                <input
                                    type="text"
                                    value={settings.bank_iban}
                                    onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Site Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                                <Globe className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Site Genel Ayarları</h2>
                                <p className="text-sm text-gray-600">Site başlığı ve açıklaması</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı</label>
                                <input
                                    type="text"
                                    value={settings.site_name}
                                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    placeholder="Çağrı Yönetimi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Site Açıklaması</label>
                                <textarea
                                    value={settings.site_description}
                                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    rows={3}
                                    placeholder="Profesyonel çağrı yönetim sistemi"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Destek Email</label>
                                <input
                                    type="email"
                                    value={settings.support_email}
                                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    placeholder="info@cagri-yonetimi.com"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Pricing */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Paket Fiyatları</h2>
                                <p className="text-sm text-gray-600">Aylık ve yıllık paket fiyatları (TL)</p>
                            </div>
                        </div>

                        {/* Lite Paket */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Lite Paket</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Aylık Fiyat</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.lite.monthly}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                lite: { ...settings.pricing.lite, monthly: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yıllık Fiyat</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.lite.yearly}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                lite: { ...settings.pricing.lite, yearly: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="990"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yıllık Orijinal Fiyat (Üstü Çizili)</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.lite.yearlyOriginal}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                lite: { ...settings.pricing.lite, yearlyOriginal: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="1188"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Oranı (%)</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.lite.discount}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                lite: { ...settings.pricing.lite, discount: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="17"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pro Paket */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pro Paket</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Aylık Fiyat</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.pro.monthly}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                pro: { ...settings.pricing.pro, monthly: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="249"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yıllık Fiyat</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.pro.yearly}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                pro: { ...settings.pricing.pro, yearly: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="2490"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Yıllık Orijinal Fiyat (Üstü Çizili)</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.pro.yearlyOriginal}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                pro: { ...settings.pricing.pro, yearlyOriginal: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="2988"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Oranı (%)</label>
                                    <input
                                        type="number"
                                        value={settings.pricing.pro.discount}
                                        onChange={(e) => setSettings({
                                            ...settings,
                                            pricing: {
                                                ...settings.pricing,
                                                pro: { ...settings.pricing.pro, discount: Number(e.target.value) }
                                            }
                                        })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500"
                                        placeholder="17"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    )
}

