// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Settings, Save, Download, Package } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

interface AppSetting {
    key: string
    value: string
    description: string
}

export default function AdminAppSettingsPage() {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState<Record<string, string>>({
        apk_download_url: '',
        apk_version: '',
        apk_size_mb: ''
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('*')
                .in('key', ['apk_download_url', 'apk_version', 'apk_size_mb'])

            if (error) throw error

            const settingsObj: Record<string, string> = {}
            data?.forEach((item: AppSetting) => {
                settingsObj[item.key] = item.value
            })

            setSettings(settingsObj)
            setLoading(false)
        } catch (error) {
            console.error('Error loading settings:', error)
            toast.error('Ayarlar yüklenirken hata oluştu')
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)

        try {
            for (const [key, value] of Object.entries(settings)) {
                const { error } = await supabase
                    .from('app_settings')
                    .upsert({
                        key,
                        value,
                        updated_at: new Date().toISOString()
                    } as any) // Type cast to fix build error

                if (error) throw error
            }

            toast.success('Ayarlar başarıyla kaydedildi!')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Ayarlar kaydedilirken hata oluştu')
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
            <Toaster />
            <div className="p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Uygulama Ayarları</h1>
                            <p className="text-gray-600">APK indirme ve uygulama ayarları</p>
                        </div>
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
                    {/* APK Settings */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Download className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">APK İndirme Ayarları</h2>
                                <p className="text-sm text-gray-600">Android uygulama indirme linki</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    APK İndirme URL
                                </label>
                                <input
                                    type="url"
                                    value={settings.apk_download_url}
                                    onChange={(e) => setSettings({ ...settings, apk_download_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://yourdomain.com/app.apk"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    APK dosyasının tam URL'si (public klasöründe veya CDN'de)
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        APK Versiyonu
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.apk_version}
                                        onChange={(e) => setSettings({ ...settings, apk_version: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="1.0.0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        APK Boyutu (MB)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.apk_size_mb}
                                        onChange={(e) => setSettings({ ...settings, apk_size_mb: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-6">
                        <h3 className="text-lg font-bold mb-4 text-blue-900">Önizleme</h3>
                        <div className="bg-white rounded-xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Çağrı Yönetimi APK</p>
                                <p className="text-sm text-gray-600">
                                    Versiyon: {settings.apk_version || 'Belirtilmedi'} •
                                    Boyut: {settings.apk_size_mb || '?'} MB
                                </p>
                            </div>
                            <a
                                href={settings.apk_download_url || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                İndir
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}
