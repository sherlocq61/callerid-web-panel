'use client'

import { useEffect, useState } from 'react'
import { Activity, Database, Shield, Server, RefreshCw } from 'lucide-react'

interface ServiceStatus {
    status: 'online' | 'offline' | 'degraded'
    responseTime: number
    message?: string
}

interface SystemStatus {
    status: 'operational' | 'degraded' | 'down'
    services: {
        database: ServiceStatus
        auth: ServiceStatus
        api: ServiceStatus
    }
    timestamp: string
}

export default function StatusPage() {
    const [status, setStatus] = useState<SystemStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/status')
            const data = await response.json()
            setStatus(data)
            setLastUpdate(new Date())
        } catch (error) {
            console.error('Error fetching status:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [])

    const getStatusColor = (status: 'online' | 'offline' | 'degraded') => {
        switch (status) {
            case 'online': return 'bg-green-500'
            case 'degraded': return 'bg-yellow-500'
            case 'offline': return 'bg-red-500'
        }
    }

    const getStatusText = (status: 'online' | 'offline' | 'degraded') => {
        switch (status) {
            case 'online': return 'Çevrimiçi'
            case 'degraded': return 'Yavaş'
            case 'offline': return 'Çevrimdışı'
        }
    }

    const getSystemStatusText = (status: 'operational' | 'degraded' | 'down') => {
        switch (status) {
            case 'operational': return 'Tüm Sistemler Çalışıyor'
            case 'degraded': return 'Bazı Sistemler Yavaş'
            case 'down': return 'Sistem Çalışmıyor'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Durum kontrol ediliyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Sistem Durumu</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gerçek zamanlı sistem sağlık göstergesi
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={fetchStatus}
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Yenile
                            </button>
                            <a
                                href="/"
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                ← Ana Sayfa
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Overall Status */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="flex items-center justify-center">
                        <div className={`w-4 h-4 rounded-full ${status?.status === 'operational' ? 'bg-green-500' :
                                status?.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            } animate-pulse mr-4`}></div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            {status && getSystemStatusText(status.status)}
                        </h2>
                    </div>
                    <p className="text-center text-gray-500 mt-2">
                        Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
                    </p>
                </div>

                {/* Service Status */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Servis Durumu</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {/* Database */}
                        <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Database className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">Veritabanı</h4>
                                        <p className="text-sm text-gray-500">Supabase Database</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {status?.services.database.responseTime}ms
                                        </p>
                                        <p className="text-xs text-gray-500">Yanıt süresi</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.services.database.status || 'offline')}`}></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {getStatusText(status?.services.database.status || 'offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auth */}
                        <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <Shield className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">Kimlik Doğrulama</h4>
                                        <p className="text-sm text-gray-500">Supabase Auth</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {status?.services.auth.responseTime}ms
                                        </p>
                                        <p className="text-xs text-gray-500">Yanıt süresi</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.services.auth.status || 'offline')}`}></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {getStatusText(status?.services.auth.status || 'offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* API */}
                        <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Server className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900">API Sunucusu</h4>
                                        <p className="text-sm text-gray-500">Next.js API</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {status?.services.api.responseTime}ms
                                        </p>
                                        <p className="text-xs text-gray-500">Yanıt süresi</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status?.services.api.status || 'offline')}`}></div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {getStatusText(status?.services.api.status || 'offline')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <Activity className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                        <div>
                            <h4 className="text-sm font-medium text-blue-900">Otomatik Güncelleme</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Bu sayfa her 30 saniyede bir otomatik olarak güncellenir. Manuel güncelleme için "Yenile" butonunu kullanabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
