'use client'

import { useState } from 'react'
import { X, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface CreateSubAccountModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const PERMISSION_GROUPS = {
    'Çağrı Geçmişi': [
        { id: 'view_calls', label: 'Çağrıları Görüntüle' }
    ],
    'Kara Liste': [
        { id: 'view_blacklist', label: 'Kara Listeyi Görüntüle' },
        { id: 'manage_blacklist', label: 'Kara Liste Yönet' }
    ],
    'Kişiler': [
        { id: 'view_contacts', label: 'Kişileri Görüntüle' },
        { id: 'manage_contacts', label: 'Kişi Ekle/Düzenle' }
    ],
    'Randevular': [
        { id: 'view_appointments', label: 'Randevuları Görüntüle' },
        { id: 'manage_appointments', label: 'Randevu Oluştur/İptal' }
    ],
    'Ayarlar': [
        { id: 'view_settings', label: 'Ayarları Görüntüle' },
        { id: 'manage_settings', label: 'Ayarları Değiştir' }
    ]
}

export default function CreateSubAccountModal({ isOpen, onClose, onSuccess }: CreateSubAccountModalProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'member' as 'admin' | 'member' | 'viewer'
    })
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
        let password = ''
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData({ ...formData, password })
    }

    const togglePermission = (permission: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/team/create-sub-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    permissions: selectedPermissions
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create sub-account')
            }

            onSuccess()
            onClose()

            // Reset form
            setFormData({ email: '', password: '', full_name: '', role: 'member' })
            setSelectedPermissions([])
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900">Yeni Personel Oluştur</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ad Soyad
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ahmet Yılmaz"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                E-posta
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="ahmet@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Şifre
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Oluştur
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rol
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="admin">Yönetici</option>
                                <option value="member">Üye</option>
                                <option value="viewer">İzleyici</option>
                            </select>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">İzinler</h3>
                        <div className="space-y-4">
                            {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => (
                                <div key={group} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">{group}</h4>
                                    <div className="space-y-2">
                                        {permissions.map(perm => (
                                            <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermissions.includes(perm.id)}
                                                    onChange={() => togglePermission(perm.id)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Personel Oluştur'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
