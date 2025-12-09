'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Blacklist } from '@/lib/supabase/blacklist-types'
import { Ban, Plus, AlertTriangle, Users, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BlacklistPanel() {
    const [blacklist, setBlacklist] = useState<Blacklist[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newNumber, setNewNumber] = useState({
        phone: '',
        reason: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, contributors: 0 })

    const supabase = createBrowserClient()

    useEffect(() => {
        loadBlacklist()

        // Real-time subscription
        const channel = supabase
            .channel('blacklist-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'blacklist' },
                () => loadBlacklist()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadBlacklist = async () => {
        try {
            const { data, error } = await supabase
                .from('blacklist')
                .select('*')
                .eq('is_active', true)
                .order('added_at', { ascending: false })

            if (error) throw error

            setBlacklist(data || [])
            setStats({
                total: data?.length || 0,
                contributors: new Set(data?.map(b => b.added_by_user_id)).size
            })
        } catch (err: any) {
            console.error('Error loading blacklist:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToBlacklist = async (e: React.FormEvent) => {
        e.preventDefault()
        setAdding(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase
                .from('blacklist')
                .insert({
                    phone_number: newNumber.phone,
                    added_by_user_id: user.id,
                    reason: newNumber.reason || null
                })

            if (error) throw error

            setNewNumber({ phone: '', reason: '' })
            setShowAddForm(false)
            loadBlacklist()
        } catch (err: any) {
            setError(err.message || 'Eklenemedi')
        } finally {
            setAdding(false)
        }
    }

    const formatPhoneNumber = (phone: string) => {
        // Format: +90 555 123 4567
        const digits = phone.replace(/\D/g, '')
        if (digits.startsWith('90') && digits.length === 12) {
            return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
        }
        return phone
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header & Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Ban className="w-7 h-7 text-red-600" />
                        Kara Liste Havuzu
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Tüm kullanıcılar için ortak kara liste
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Numara Ekle
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                            <Ban className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Toplam Kara Liste</p>
                            <p className="text-2xl font-bold text-red-600">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Katkıda Bulunan</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.contributors}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Kara Listeye Ekle
                        </h3>
                        <form onSubmit={handleAddToBlacklist} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefon Numarası *
                                </label>
                                <input
                                    type="tel"
                                    value={newNumber.phone}
                                    onChange={(e) => setNewNumber({ ...newNumber, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    placeholder="05551234567"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Sebep (Opsiyonel)
                                </label>
                                <textarea
                                    value={newNumber.reason}
                                    onChange={(e) => setNewNumber({ ...newNumber, reason: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    placeholder="Spam, dolandırıcılık, taciz vb."
                                    rows={3}
                                />
                            </div>
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {adding ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Ekleniyor...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Kara Listeye Ekle
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                        <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Kara listeye eklenen numaralar silinemez, sadece devre dışı bırakılabilir.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blacklist Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Telefon Numarası
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Sebep
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                    Eklenme Tarihi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {blacklist.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                        Henüz kara listede numara yok
                                    </td>
                                </tr>
                            ) : (
                                blacklist.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Ban className="w-4 h-4 text-red-600" />
                                                <span className="font-mono font-semibold text-gray-900">
                                                    {formatPhoneNumber(item.phone_number)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">
                                                {item.reason || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(item.added_at)}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
