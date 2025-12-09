'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)
    const [isInstallable, setIsInstallable] = useState(false)

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setShowInstallPrompt(true)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false)
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) {
            // Fallback for browsers that don't support install prompt
            alert('PWA yüklemek için:\n\nChrome: Adres çubuğundaki "Yükle" ikonuna tıklayın\nEdge: Ayarlar > Uygulamalar > Bu siteyi uygulama olarak yükle\nMobile: Menü > Ana ekrana ekle')
            return
        }

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setShowInstallPrompt(false)
            setIsInstallable(false)
        }
    }

    const handleDismiss = () => {
        setShowInstallPrompt(false)
    }

    // Show manual install button in header if installable
    if (isInstallable && !showInstallPrompt) {
        return (
            <button
                onClick={() => setShowInstallPrompt(true)}
                className="fixed top-4 right-20 z-40 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                title="Uygulamayı İndir"
            >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Uygulamayı İndir</span>
            </button>
        )
    }

    return (
        <AnimatePresence>
            {showInstallPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-4 right-4 z-50 max-w-sm"
                >
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                                    <Smartphone className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Uygulamayı İndir</h3>
                                    <p className="text-sm text-gray-600">Masaüstüne ekle</p>
                                </div>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Çağrı Yönetim Sistemi'ni masaüstü uygulaması gibi kullanın.
                            Hızlı erişim ve offline çalışma desteği.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleInstall}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Şimdi İndir
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Daha Sonra
                            </button>
                        </div>

                        {/* Development mode notice */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-xs text-yellow-800">
                                    <strong>Dev Mode:</strong> PWA sadece production build'de çalışır.
                                    Test için: <code className="bg-yellow-100 px-1 rounded">npm run build && npm start</code>
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
