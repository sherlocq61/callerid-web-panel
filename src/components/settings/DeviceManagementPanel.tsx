'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Smartphone, User, Wifi, WifiOff, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNotification } from '@/components/notifications/NotificationProvider'

interface Device {
    device_id: string
    device_name: string
    platform: string
    is_online: boolean
    last_seen: string
    assigned_to?: string
    assigned_user_name?: string
}

interface TeamMember {
    user_id: string
    user_email: string
    user_name: string
}

export default function DeviceManagementPanel() {
    const supabase = createBrowserClient()
    const { showToast } = useNotification()
    const [devices, setDevices] = useState<Device[]>([])
    const [members, setMembers] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()

        // Auto-refresh every 30 seconds to update device status
        const interval = setInterval(() => {
            updateDeviceStatus()
            loadDevices()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const updateDeviceStatus = async () => {
        try {
            await fetch('/api/devices/update-status', { method: 'POST' })
        } catch (error) {
            console.error('Error updating device status:', error)
        }
    }

    const loadData = async () => {
        await updateDeviceStatus() // Update status before loading
        await Promise.all([loadDevices(), loadMembers()])
    }

    const loadDevices = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user's team
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (!teamMember) {
                // Solo user - get only their devices
                const { data } = await supabase
                    .from('devices')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('last_seen', { ascending: false })

                setDevices(data || [])
            } else {
                // Team - get all team devices
                const { data: teamMembers } = await supabase
                    .from('team_members')
                    .select('user_id')
                    .eq('team_id', teamMember.team_id)

                const userIds = teamMembers?.map(m => m.user_id) || []

                const { data } = await supabase
                    .from('devices')
                    .select(`
                        *,
                        users:user_id (
                            full_name
                        )
                    `)
                    .in('user_id', userIds)
                    .order('last_seen', { ascending: false })

                const enrichedDevices = data?.map(d => ({
                    ...d,
                    assigned_to: d.user_id,
                    assigned_user_name: (d.users as any)?.full_name
                })) || []

                setDevices(enrichedDevices)
            }
        } catch (error) {
            console.error('Error loading devices:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadMembers = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: teamMember } = await supabase
                .from('team_members')
                .select('team_id')
                .eq('user_id', user.id)
                .single()

            if (!teamMember) return

            const { data } = await supabase
                .from('team_members')
                .select(`
                    user_id,
                    users:user_id (
                        email,
                        full_name
                    )
                `)
                .eq('team_id', teamMember.team_id)

            const enrichedMembers = data?.map(m => ({
                user_id: m.user_id,
                user_email: (m.users as any)?.email || '',
                user_name: (m.users as any)?.full_name || ''
            })) || []

            setMembers(enrichedMembers)
        } catch (error) {
            console.error('Error loading members:', error)
        }
    }

    const assignDevice = async (deviceId: string, userId: string) => {
        try {
            const { error } = await supabase
                .from('devices')
                .update({ user_id: userId })
                .eq('device_id', deviceId)

            if (error) throw error

            showToast('Cihaz atandı', 'success')
            loadDevices()
        } catch (error) {
            console.error('Error assigning device:', error)
            showToast('Cihaz atanırken hata oluştu', 'error')
        }
    }

    const formatLastSeen = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Şimdi'
        if (minutes < 60) return `${minutes} dk önce`
        if (hours < 24) return `${hours} saat önce`
        if (days < 7) return `${days} gün önce`

        return date.toLocaleDateString('tr-TR')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    Cihaz Yönetimi
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    {devices.length} kayıtlı cihaz
                </p>
            </div>

            {/* Devices List */}
            {devices.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Henüz kayıtlı cihaz yok</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {devices.map((device, index) => (
                            <motion.div
                                key={device.device_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${device.is_online ? 'bg-green-100' : 'bg-gray-100'
                                            }`}>
                                            <Smartphone className={`w-6 h-6 ${device.is_online ? 'text-green-600' : 'text-gray-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-900">
                                                    {device.device_name}
                                                </p>
                                                {device.is_online ? (
                                                    <Wifi className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <WifiOff className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-gray-600">
                                                    {device.platform === 'android' ? '📱 Android' : '🍎 iOS'}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-sm text-gray-500">
                                                    {formatLastSeen(device.last_seen)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {members.length > 0 ? (
                                            <select
                                                value={device.assigned_to || ''}
                                                onChange={(e) => assignDevice(device.device_id, e.target.value)}
                                                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Atanmamış</option>
                                                {members.map(member => (
                                                    <option key={member.user_id} value={member.user_id}>
                                                        {member.user_name || member.user_email}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                                {device.assigned_user_name || 'Siz'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
