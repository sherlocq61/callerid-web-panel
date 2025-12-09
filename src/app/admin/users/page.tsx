'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import AdminLayout from '@/components/admin/AdminLayout'
import { Search, Edit, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'

interface User {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

export default function AdminUsersPage() {
    const supabase = createBrowserClient()
    const { showToast, showConfirm, showPrompt } = useNotification()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
            setLoading(false)
        } catch (error) {
            console.error('Error loading users:', error)
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        const confirmed = await showConfirm({
            title: 'Rol Değiştir',
            message: `Kullanıcının rolünü ${newRole} olarak değiştirmek istediğinizden emin misiniz?`,
            confirmText: 'Değiştir',
            type: 'warning'
        })

        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId)

            if (error) throw error

            // Log admin action
            const { logAdminAction, LOG_ACTIONS } = await import('@/lib/supabase/logs')
            await logAdminAction({
                action: LOG_ACTIONS.USER_ROLE_UPDATE,
                target_type: 'user',
                target_id: userId,
                details: { new_role: newRole }
            })

            showToast('Rol başarıyla güncellendi!', 'success')
            loadUsers()
        } catch (error) {
            console.error('Error updating role:', error)
            showToast('Rol güncellenirken hata oluştu', 'error')
        }
    }

    const handleEditUser = async (userId: string) => {
        const user = users.find(u => u.id === userId)
        if (!user) return

        const newName = await showPrompt({
            title: 'Kullanıcı Adını Düzenle',
            message: 'Yeni kullanıcı adını girin:',
            defaultValue: user.full_name || '',
            confirmText: 'Kaydet'
        })

        if (!newName) return

        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: newName })
                .eq('id', userId)

            if (error) throw error

            showToast('Kullanıcı adı güncellendi!', 'success')
            loadUsers()
        } catch (error) {
            console.error('Error updating user:', error)
            showToast('Kullanıcı güncellenirken hata oluştu', 'error')
        }
    }

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(search.toLowerCase())
    )

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanıcı Yönetimi</h1>
                    <p className="text-gray-600">Tüm kullanıcıları görüntüleyin ve yönetin</p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Email veya isim ile ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kullanıcı</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rol</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kayıt Tarihi</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                                <UserIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-medium text-gray-900">{user.full_name || 'İsimsiz'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditUser(user.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    Toplam {filteredUsers.length} kullanıcı
                </div>
            </div>
        </AdminLayout>
    )
}
