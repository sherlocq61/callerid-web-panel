'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'

interface PermissionStatus {
    name: string
    description: string
    isGranted: boolean
    isRequired: boolean
    settingsUrl?: string
}

export default function DevicePermissionsPanel() {
    const [permissions, setPermissions] = useState<PermissionStatus[]>([
        {
            name: 'Telefon İzni',
            description: 'Gelen aramaları tespit etmek için gerekli',
            isGranted: false,
            isRequired: true,
            settingsUrl: 'android.settings.APPLICATION_DETAILS_SETTINGS'
        },
        {
            name: 'Arama Kaydı',
            description: 'Arama geçmişini kaydetmek için gerekli',
            isGranted: false,
            isRequired: true,
            settingsUrl: 'android.settings.APPLICATION_DETAILS_SETTINGS'
        },
        {
            name: 'Kişiler',
            description: 'Arayan kişi bilgilerini göstermek için',
            isGranted: false,
            isRequired: true,
            settingsUrl: 'android.settings.APPLICATION_DETAILS_SETTINGS'
        },
        {
            name: 'Bildirimler',
            description: 'Kara liste uyarıları için gerekli',
            isGranted: false,
            isRequired: true,
            settingsUrl: 'android.settings.APP_NOTIFICATION_SETTINGS'
        },
        {
            name: 'Pil Optimizasyonu',
            description: 'Arka planda çalışmaya devam etmek için kapatılmalı',
            isGranted: false,
            isRequired: true,
            settingsUrl: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS'
        },
        {
            name: 'Arka Plan Servisi',
            description: 'Uygulama arka planda çalışıyor mu?',
            isGranted: false,
            isRequired: true
        }
    ])

    const grantedCount = permissions.filter(p => p.isGranted).length
    const totalCount = permissions.length
    const allGranted = grantedCount === totalCount

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-7 h-7 text-blue-600" />
                        Cihaz İzinleri
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Uygulamanın düzgün çalışması için gerekli izinler
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                        {grantedCount}/{totalCount}
                    </div>
                    <div className="text-sm text-gray-600">İzin Verildi</div>
                </div>
            </div>

            {/* Warning if not all granted */}
            {!allGranted && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-900">Eksik İzinler Var!</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Uygulamanın düzgün çalışması için tüm izinlerin verilmesi gerekiyor.
                            Eksik izinler için kartlara tıklayarak ayarlara gidebilirsiniz.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Success message if all granted */}
            {allGranted && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
                >
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-green-900">Tüm İzinler Verildi!</h3>
                        <p className="text-sm text-green-700 mt-1">
                            Uygulama tüm gerekli izinlere sahip ve düzgün çalışıyor.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Permission Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission, index) => (
                    <motion.div
                        key={permission.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                            relative rounded-xl p-5 border-2 transition-all
                            ${permission.isGranted
                                ? 'bg-green-50 border-green-200 hover:border-green-300'
                                : 'bg-red-50 border-red-200 hover:border-red-300 cursor-pointer hover:shadow-lg'
                            }
                        `}
                        onClick={() => {
                            if (!permission.isGranted && permission.settingsUrl) {
                                alert(`Ayarlar sayfasına yönlendiriliyor...\n${permission.settingsUrl}`)
                                // In real app: Open Android settings
                            }
                        }}
                    >
                        {/* Status Icon */}
                        <div className="absolute top-4 right-4">
                            {permission.isGranted ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-600" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="pr-8">
                            <h3 className="font-bold text-gray-900 mb-1">
                                {permission.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                {permission.description}
                            </p>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2">
                                <span className={`
                                    text-xs font-semibold px-2 py-1 rounded-full
                                    ${permission.isGranted
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }
                                `}>
                                    {permission.isGranted ? 'Aktif' : 'Pasif'}
                                </span>
                                {permission.isRequired && (
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                        Gerekli
                                    </span>
                                )}
                            </div>

                            {/* Settings Link */}
                            {!permission.isGranted && permission.settingsUrl && (
                                <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
                                    <ExternalLink className="w-3 h-3" />
                                    Ayarlara Git
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    <strong>Not:</strong> Bu izinler Android cihazınızdan verilmelidir.
                    Web panelinden izin durumunu görebilir, eksik izinler için cihazınızın
                    ayarlar sayfasına yönlendirilebilirsiniz.
                </p>
            </div>
        </div>
    )
}
