// @ts-nocheck
'use client'

// Force dynamic rendering (required for cookies/auth)
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { usePermissions } from '@/hooks/usePermissions'
import CallHistoryTable from '@/components/dashboard/CallHistoryTable'
import BlacklistPanel from '@/components/blacklist/BlacklistPanel'
import ContactsPanel from '@/components/contacts/ContactsPanel'
import StatsCards from '@/components/dashboard/StatsCards'
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments'
import ProfilePanel from '@/components/dashboard/ProfilePanel'
import SettingsPanel from '@/components/dashboard/SettingsPanel'
import SubscriptionPanel from '@/components/dashboard/SubscriptionPanel'
import AppointmentsPanel from '@/components/appointments/AppointmentsPanel'
import TeamManagementPanel from '@/components/team/TeamManagementPanel'
import ActivityLogsPanel from '@/components/team/ActivityLogsPanel'
import JobMarketplace from '@/components/jobs/JobMarketplace'
import BalancePanel from '@/components/balance/BalancePanel'
import { AlertTriangle, Calendar, Crown, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface Subscription {
    plan: 'lite' | 'pro' | 'enterprise'
    status: 'active' | 'cancelled' | 'expired'
    expires_at: string | null
}

export default function DashboardPage() {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab') as 'calls' | 'blacklist' | 'contacts' | 'appointments' | 'marketplace' | 'balance' | 'team' | 'activity' | 'subscription' | 'profile' | 'settings' | null

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'calls' | 'blacklist' | 'contacts' | 'appointments' | 'marketplace' | 'balance' | 'team' | 'activity' | 'subscription' | 'profile' | 'settings'>(tabParam || 'calls')
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
    const [marketplaceEnabled, setMarketplaceEnabled] = useState(true)
    const router = useRouter()
    const supabase = createBrowserClient()
    const { hasPermission, isSubAccount, loading: permLoading } = usePermissions()

    // Update URL when tab changes
    const updateTab = (tab: typeof activeTab) => {
        setActiveTab(tab)
        router.push(`/dashboard?tab=${tab}`, { scroll: false })
    }

    useEffect(() => {
        checkAuthAndSubscription()
        loadMarketplaceSettings()
    }, [])

    useEffect(() => {
        // Update days remaining every hour
        const interval = setInterval(() => {
            if (subscription?.expires_at) {
                const expiryDate = new Date(subscription.expires_at)
                const today = new Date()
                const diffTime = expiryDate.getTime() - today.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                setDaysRemaining(diffDays)
            }
        }, 1000 * 60 * 60) // Update every hour

        return () => clearInterval(interval)
    }, [subscription?.expires_at])

    const checkAuthAndSubscription = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('plan, status, expires_at')
                .eq('user_id', session.user.id)
                .single()

            if (subError || !subData) {
                router.push('/pricing')
                return
            }

            if (subData.status !== 'active') {
                router.push('/pricing')
                return
            }

            setSubscription(subData)

            if (subData.expires_at) {
                const expiryDate = new Date(subData.expires_at)
                const today = new Date()
                const diffTime = expiryDate.getTime() - today.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                setDaysRemaining(diffDays)
            }

            setLoading(false)
        } catch (error) {
            console.error('Error checking subscription:', error)
            router.push('/pricing')
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const loadMarketplaceSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_settings')
                .select('value')
                .eq('key', 'marketplace_config')
                .single()

            if (data && !error) {
                const settings = data.value as any
                setMarketplaceEnabled(settings.enabled || false)
            }
        } catch (error) {
            console.error('Error loading marketplace settings:', error)
        }
    }

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'lite': return 'from-orange-500 to-amber-500'
            case 'pro': return 'from-blue-500 to-cyan-500'
            case 'enterprise': return 'from-purple-500 to-pink-500'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const getPlanName = (plan: string) => {
        switch (plan) {
            case 'lite': return 'Lite'
            case 'pro': return 'Pro'
            case 'enterprise': return 'Enterprise'
            default: return plan
        }
    }

    const getDaysRemainingColor = (days: number | null) => {
        if (!days) return 'bg-gray-100 text-gray-700'
        if (days <= 3) return 'bg-red-100 text-red-700 border-red-300'
        if (days <= 7) return 'bg-orange-100 text-orange-700 border-orange-300'
        return 'bg-green-100 text-green-700 border-green-300'
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Çağrı Yönetim Sistemi
                            </h1>
                            {isSubAccount && (
                                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    Personel Hesabı
                                </div>
                            )}
                            {subscription && !isSubAccount && (
                                <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPlanColor(subscription.plan)} text-white text-sm font-semibold flex items-center gap-1`}>
                                    <Crown className="w-4 h-4" />
                                    {getPlanName(subscription.plan)}
                                </div>
                            )}
                        </div>
                        <button onClick={handleSignOut} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            {daysRemaining !== null && daysRemaining <= 7 && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className={`rounded-xl p-4 border-2 ${getDaysRemainingColor(daysRemaining)} flex items-center gap-3`}>
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold">
                                {daysRemaining <= 0 ? 'Paketinizin süresi doldu!' : daysRemaining === 1 ? 'Paketinizin süresi yarın doluyor!' : `Paketinizin süresine ${daysRemaining} gün kaldı`}
                            </p>
                            <p className="text-sm opacity-90">
                                {subscription?.expires_at && `Bitiş tarihi: ${new Date(subscription.expires_at).toLocaleDateString('tr-TR')}`}
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-white rounded-lg font-semibold hover:shadow-md transition-all">Yenile</button>
                    </div>
                </motion.div>
            )}

            {daysRemaining !== null && daysRemaining > 7 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200 flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>
                            Paketinizin süresine <strong>{daysRemaining} gün</strong> kaldı
                            {subscription?.expires_at && ` (${new Date(subscription.expires_at).toLocaleDateString('tr-TR')} tarihinde sona erecek)`}
                        </span>
                    </div>
                </div>
            )}

            {/* Tab Buttons */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    {hasPermission('view_calls') && (
                        <button onClick={() => updateTab('calls')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'calls' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                            Arama Geçmişi
                        </button>
                    )}
                    {hasPermission('view_blacklist') && (
                        <button onClick={() => updateTab('blacklist')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'blacklist' ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                            Kara Liste
                        </button>
                    )}
                    {hasPermission('view_contacts') && (
                        <button onClick={() => updateTab('contacts')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'contacts' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                            Kişiler
                        </button>
                    )}
                    {hasPermission('view_appointments') && (
                        <button onClick={() => updateTab('appointments')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'appointments' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                            Randevular
                        </button>
                    )}
                    {!isSubAccount && (
                        <>
                            {marketplaceEnabled && (subscription?.plan === 'pro' || subscription?.plan === 'enterprise') && (
                                <>
                                    <button onClick={() => updateTab('marketplace')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'marketplace' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                        İş Havuzu
                                    </button>
                                    <button onClick={() => updateTab('balance')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'balance' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                        Bakiye
                                    </button>
                                </>
                            )}
                            <button onClick={() => updateTab('team')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                Ekip Yönetimi
                            </button>
                            <button onClick={() => updateTab('activity')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'activity' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                Aktivite Logları
                            </button>
                            <button onClick={() => updateTab('subscription')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'subscription' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                Abonelik
                            </button>
                        </>
                    )}
                    <button onClick={() => updateTab('profile')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        Profil
                    </button>
                    {hasPermission('view_settings') && (
                        <button onClick={() => updateTab('settings')} className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                            Ayarlar
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                {activeTab === 'calls' && (
                    <>
                        <StatsCards />
                        <div className="mt-6">
                            <UpcomingAppointments />
                        </div>
                    </>
                )}

                <div className="space-y-6">
                    {activeTab === 'calls' && <CallHistoryTable />}
                    {activeTab === 'blacklist' && <BlacklistPanel />}
                    {activeTab === 'contacts' && <ContactsPanel />}
                    {activeTab === 'appointments' && <AppointmentsPanel />}
                    {activeTab === 'marketplace' && <JobMarketplace />}
                    {activeTab === 'balance' && <BalancePanel />}
                    {activeTab === 'team' && <TeamManagementPanel />}
                    {activeTab === 'activity' && <ActivityLogsPanel />}
                    {activeTab === 'subscription' && <SubscriptionPanel />}
                    {activeTab === 'profile' && <ProfilePanel />}
                    {activeTab === 'settings' && <SettingsPanel />}
                </div>
            </div>
        </div>
    )
}

