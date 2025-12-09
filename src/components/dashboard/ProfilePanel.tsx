'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { User, Mail, Lock, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'

export default function ProfilePanel() {
    const supabase = createBrowserClient()
    const { showToast } = useNotification()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [profile, setProfile] = useState({
        fullName: '',
        email: ''
    })

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data: userData } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', session.user.id)
                .single()

            if (userData) {
                setProfile({
                    fullName: userData.full_name || '',
                    email: userData.email || session.user.email || ''
                })
            }
            setLoading(false)
        } catch (error) {
            console.error('Error loading profile:', error)
            setLoading(false)
        }
    }

    const handleUpdateProfile = async () => {
        setSaving(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { error } = await supabase
                .from('users')
                .update({ full_name: profile.fullName })
                .eq('id', session.user.id)

            if (error) throw error

            showToast('Profil başarıyla güncellendi!', 'success')
        } catch (error) {
            console.error('Error updating profile:', error)
            showToast('Profil güncellenirken hata oluştu', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            showToast('Yeni şifreler eşleşmiyor', 'error')
            return
        }

        if (passwords.new.length < 6) {
            showToast('Şifre en az 6 karakter olmalıdır', 'error')
            return
        }

        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            })

            if (error) throw error

            showToast('Şifre başarıyla değiştirildi!', 'success')
            setPasswords({ current: '', new: '', confirm: '' })
        } catch (error) {
            console.error('Error changing password:', error)
            showToast('Şifre değiştirilirken hata oluştu', 'error')
        } finally {
            setSaving(false)
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
            {/* Profile Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Profil Bilgileri
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ad Soyad
                        </label>
                        <input
                            type="text"
                            value={profile.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Email adresi değiştirilemez</p>
                    </div>

                    <button
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Kaydediliyor...' : 'Profili Güncelle'}
                    </button>
                </div>
            </motion.div>

            {/* Change Password */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-blue-600" />
                    Şifre Değiştir
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yeni Şifre
                        </label>
                        <input
                            type="password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="En az 6 karakter"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Yeni Şifre (Tekrar)
                        </label>
                        <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Şifrenizi tekrar girin"
                        />
                    </div>

                    <button
                        onClick={handleChangePassword}
                        disabled={saving || !passwords.new || !passwords.confirm}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Lock className="w-5 h-5" />
                        {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
