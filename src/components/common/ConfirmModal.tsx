'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    type = 'warning',
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    if (!isOpen) return null

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-600',
                    button: 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg'
                }
            case 'warning':
                return {
                    icon: 'text-orange-600',
                    button: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg'
                }
            case 'info':
                return {
                    icon: 'text-blue-600',
                    button: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
                }
        }
    }

    const colors = getColors()

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-gray-100 ${colors.icon}`}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-gray-600">{message}</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white rounded-xl font-semibold transition-all ${colors.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
