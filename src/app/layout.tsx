import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NotificationProvider } from '@/components/notifications/NotificationProvider'
import InstallPWA from '@/components/pwa/InstallPWA'
import Script from 'next/script'

// Force dynamic rendering for entire app (required for auth/cookies)
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

const inter = Inter({ subsets: ['latin'] })

// Static metadata (no async calls)
export const metadata: Metadata = {
    title: 'Çağrı Yönetimi',
    description: 'Profesyonel çağrı yönetim sistemi',
    manifest: '/manifest.json',
    themeColor: '#3b82f6',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Çağrı Yönetim'
    },
    icons: {
        icon: '/icon-192.png',
        apple: '/icon-192.png'
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {

    return (
        <html lang="tr">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#3b82f6" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Çağrı Yönetim" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={inter.className}>
                <NotificationProvider>
                    {children}
                    <InstallPWA />
                </NotificationProvider>
                <Script id="register-sw" strategy="afterInteractive">
                    {`
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js').then(
                                    function(registration) {
                                        console.log('Service Worker registered:', registration.scope);
                                    },
                                    function(err) {
                                        console.log('Service Worker registration failed:', err);
                                    }
                                );
                            });
                        }
                    `}
                </Script>
            </body>
        </html>
    )
}
