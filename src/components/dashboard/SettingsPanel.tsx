'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Bell, Shield, Smartphone, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'
import DeviceManagementPanel from '../settings/DeviceManagementPanel'
import PurchaseHistoryPanel from '../settings/PurchaseHistoryPanel'

interface Preferences {
    push_notifications: boolean
    email_notifications: boolean
    sms_notifications: boolean
    save_call_history: boolean
    auto_delete_days: number
}

interface Device {
    id: string
    device_name: string
    device_type: string
    last_active: string
    created_at: string
}

export default function SettingsPanel() {
    const supabase = createBrowserClient()
    const { showToast, showConfirm } = useNotification()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [preferences, setPreferences] = useState<Preferences>({
        push_notifications: true,
        email_notifications: true,
        sms_notifications: false,
        save_call_history: true,
        auto_delete_days: 90
    })

    const [devices, setDevices] = useState<Device[]>([])

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Load preferences
            const { data: prefData } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', session.user.id)
                .single()

            if (prefData) {
                setPreferences(prefData)
            }

            // Load devices
            const { data: devicesData } = await supabase
                .from('user_devices')
                .select('*')
                .eq('user_id', session.user.id)
                .order('last_active', { ascending: false })

            if (devicesData) {
                setDevices(devicesData)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error loading settings:', error)
            setLoading(false)
        }
    }

    const handleSavePreferences = async () => {
        setSaving(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: session.user.id,
                    ...preferences
                })

            if (error) throw error

            showToast('Ayarlar başarıyla kaydedildi!', 'success')
        } catch (error) {
            console.error('Error saving preferences:', error)
            showToast('Ayarlar kaydedilirken hata oluştu', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
        const confirmed = await showConfirm({
            title: 'Cihazı Kaldır',
            message: `"${deviceName}" cihazını kaldırmak istediğinizden emin misiniz?`,
            confirmText: 'Kaldır',
            type: 'danger'
        })

        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('user_devices')
                .delete()
                .eq('id', deviceId)

            if (error) throw error

            showToast('Cihaz başarıyla kaldırıldı!', 'success')
            loadSettings()
        } catch (error) {
            console.error('Error deleting device:', error)
            showToast('Cihaz kaldırılırken hata oluştu', 'error')
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Notification Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    Bildirim Tercihleri
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <h3 className="font-semibold text-gray-900">Push Bildirimleri</h3>
                            <p className="text-sm text-gray-600">Mobil uygulama bildirimleri</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.push_notifications}
                                onChange={(e) => setPreferences({ ...preferences, push_notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <h3 className="font-semibold text-gray-900">Email Bildirimleri</h3>
                            <p className="text-sm text-gray-600">Önemli güncellemeler için email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.email_notifications}
                                onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <h3 className="font-semibold text-gray-900">SMS Bildirimleri</h3>
                            <p className="text-sm text-gray-600">Kritik uyarılar için SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.sms_notifications}
                                onChange={(e) => setPreferences({ ...preferences, sms_notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </motion.div>

            {/* Privacy Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-blue-600" />
                    Gizlilik Ayarları
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                            <h3 className="font-semibold text-gray-900">Arama Geçmişi Kaydet</h3>
                            <p className="text-sm text-gray-600">Tüm aramaları kaydet</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.save_call_history}
                                onChange={(e) => setPreferences({ ...preferences, save_call_history: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-semibold text-gray-900 mb-2">Otomatik Silme Süresi</h3>
                        <p className="text-sm text-gray-600 mb-3">Eski kayıtları otomatik sil</p>
                        <select
                            value={preferences.auto_delete_days}
                            onChange={(e) => setPreferences({ ...preferences, auto_delete_days: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={30}>30 gün</option>
                            <option value={60}>60 gün</option>
                            <option value={90}>90 gün</option>
                            <option value={180}>180 gün</option>
                            <option value={365}>1 yıl</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Save Button */}
            <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>

            {/* Device Management Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <DeviceManagementPanel />
            </motion.div>

            {/* Purchase History Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <PurchaseHistoryPanel />
            </motion.div>
        </div>
    )
}
