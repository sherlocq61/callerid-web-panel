'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ConfirmOptions {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
}

interface PromptOptions {
    title: string
    message: string
    placeholder?: string
    defaultValue?: string
    confirmText?: string
    cancelText?: string
}

interface NotificationContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void
    showConfirm: (options: ConfirmOptions) => Promise<boolean>
    showPrompt: (options: PromptOptions) => Promise<string | null>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider')
    }
    return context
}

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        options: ConfirmOptions
        resolve: (value: boolean) => void
    } | null>(null)
    const [promptDialog, setPromptDialog] = useState<{
        isOpen: boolean
        options: PromptOptions
        resolve: (value: string | null) => void
    } | null>(null)
    const [promptValue, setPromptValue] = useState('')

    const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9)
        const toast: Toast = { id, type, message, duration }

        setToasts((prev) => [...prev, toast])

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, duration)
        }
    }

    const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmDialog({ isOpen: true, options, resolve })
        })
    }

    const showPrompt = (options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setPromptValue(options.defaultValue || '')
            setPromptDialog({ isOpen: true, options, resolve })
        })
    }

    const handleConfirm = (result: boolean) => {
        if (confirmDialog) {
            confirmDialog.resolve(result)
            setConfirmDialog(null)
        }
    }

    const handlePrompt = (result: string | null) => {
        if (promptDialog) {
            promptDialog.resolve(result)
            setPromptDialog(null)
            setPromptValue('')
        }
    }

    const getToastIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />
            case 'error':
                return <XCircle className="w-5 h-5" />
            case 'warning':
                return <AlertCircle className="w-5 h-5" />
            case 'info':
                return <Info className="w-5 h-5" />
        }
    }

    const getToastColor = (type: ToastType) => {
        switch (type) {
            case 'success':
                return 'from-green-500 to-emerald-500'
            case 'error':
                return 'from-red-500 to-pink-500'
            case 'warning':
                return 'from-orange-500 to-amber-500'
            case 'info':
                return 'from-blue-500 to-cyan-500'
        }
    }

    return (
        <NotificationContext.Provider value={{ showToast, showConfirm, showPrompt }}>
            {children}

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[9999] space-y-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            className={`bg-gradient-to-r ${getToastColor(toast.type)} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}
                        >
                            {getToastIcon(toast.type)}
                            <p className="flex-1 font-medium">{toast.message}</p>
                            <button
                                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirmDialog?.isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                            onClick={() => handleConfirm(false)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {confirmDialog.options.title}
                                </h3>
                                <p className="text-gray-600 mb-6">{confirmDialog.options.message}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleConfirm(false)}
                                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                    >
                                        {confirmDialog.options.cancelText || 'İptal'}
                                    </button>
                                    <button
                                        onClick={() => handleConfirm(true)}
                                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors text-white ${confirmDialog.options.type === 'danger'
                                                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg'
                                                : confirmDialog.options.type === 'warning'
                                                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
                                            }`}
                                    >
                                        {confirmDialog.options.confirmText || 'Onayla'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* Prompt Dialog */}
            <AnimatePresence>
                {promptDialog?.isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                            onClick={() => handlePrompt(null)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                            >
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {promptDialog.options.title}
                                </h3>
                                <p className="text-gray-600 mb-4">{promptDialog.options.message}</p>
                                <input
                                    type="text"
                                    value={promptValue}
                                    onChange={(e) => setPromptValue(e.target.value)}
                                    placeholder={promptDialog.options.placeholder}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handlePrompt(promptValue)
                                        if (e.key === 'Escape') handlePrompt(null)
                                    }}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handlePrompt(null)}
                                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                                    >
                                        {promptDialog.options.cancelText || 'İptal'}
                                    </button>
                                    <button
                                        onClick={() => handlePrompt(promptValue)}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white rounded-xl font-semibold transition-colors"
                                    >
                                        {promptDialog.options.confirmText || 'Tamam'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    )
}
