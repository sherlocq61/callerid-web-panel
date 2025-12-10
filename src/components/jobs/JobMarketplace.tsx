'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Plus, Search, Filter } from 'lucide-react'
import { toast } from 'react-hot-toast'
import JobCard from './JobCard'
import CreateJobModal from './CreateJobModal'
import ShareIBANModal from './ShareIBANModal'
import CompleteJobModal from './CompleteJobModal'

interface Job {
    id: string
    from_location: string
    to_location: string
    vehicle_type: string
    buyer_profit: number
    customer_total: number
    seller_profit: number
    commission_percentage: number
    commission_amount: number
    payment_type: string
    status: string
    buyer_phone: string
    buyer_phone_revealed: boolean
    seller_iban: string | null
    buyer_iban: string | null
    seller_account_name: string | null
    buyer_account_name: string | null
    iban_revealed: boolean
    description: string | null
    job_datetime: string
    seller_id: string
    buyer_id: string | null
}

export default function JobMarketplace() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string>('')
    const [userBalance, setUserBalance] = useState(0)
    const [marketplaceSettings, setMarketplaceSettings] = useState({
        enabled: true,
        commission_percentage: 10,
        minimum_balance: 100,
        cancellation_hours: 3
    })
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showShareIBANModal, setShowShareIBANModal] = useState(false)
    const [selectedJob, setSelectedJob] = useState<Job | null>(null)
    const [showCompleteModal, setShowCompleteModal] = useState(false)

    const supabase = createBrowserClient()

    useEffect(() => {
        loadUserData()
        loadMarketplaceSettings()
        loadJobs()

        // Subscribe to job changes
        const channel = supabase
            .channel('marketplace_jobs_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'marketplace_jobs'
            }, () => {
                loadJobs()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadUserData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            setCurrentUserId(session.user.id)

            // Load balance
            const { data: balanceData } = await supabase
                .from('user_balances')
                .select('balance')
                .eq('user_id', session.user.id)
                .single()

            if (balanceData) {
                setUserBalance(balanceData.balance)
            }
        } catch (error) {
            console.error('Error loading user data:', error)
        }
    }

    const loadMarketplaceSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_settings')
                .select('value')
                .eq('key', 'marketplace_config')
                .single()

            if (data && !error) {
                setMarketplaceSettings(data.value as any)
            }
        } catch (error) {
            console.error('Error loading marketplace settings:', error)
        }
    }

    const loadJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('marketplace_jobs')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setJobs(data || [])
        } catch (error) {
            console.error('Error loading jobs:', error)
            toast.error('İşler yüklenirken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handlePurchase = async (job: Job) => {
        console.log('handlePurchase called with job:', job)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            console.log('Session:', session)
            if (!session) {
                toast.error('Oturum bulunamadı!')
                return
            }

            // Check balance
            console.log('User balance:', userBalance, 'Commission:', job.commission_amount)
            if (userBalance < job.commission_amount) {
                toast.error('Yetersiz bakiye!')
                return
            }

            // Update job
            console.log('Updating job...')
            const { error } = await supabase
                .from('marketplace_jobs')
                .update({
                    buyer_id: session.user.id,
                    status: 'pending_approval',
                    purchased_at: new Date().toISOString()
                })
                .eq('id', job.id)

            if (error) {
                console.error('Update error:', error)
                throw error
            }

            console.log('Job purchased successfully!')
            toast.success('İş alındı! Satıcı onayı bekleniyor...')
            loadJobs()
            loadUserData()
        } catch (error: any) {
            console.error('Error purchasing job:', error)
            toast.error(error.message || 'İş alınırken hata oluştu')
        }
    }

    const handleApprove = async (job: Job) => {
        try {
            // Deduct commission from buyer
            const { error: balanceError } = await supabase.rpc('deduct_balance', {
                p_user_id: job.buyer_id,
                p_amount: job.commission_amount
            })

            if (balanceError) throw balanceError

            // Update job
            const { error } = await supabase
                .from('marketplace_jobs')
                .update({
                    status: 'approved',
                    buyer_phone_revealed: true,
                    approved_at: new Date().toISOString()
                })
                .eq('id', job.id)

            if (error) throw error

            // Create transaction
            await supabase
                .from('balance_transactions')
                .insert({
                    user_id: job.buyer_id,
                    amount: -job.commission_amount,
                    type: 'commission',
                    description: `İş komisyonu: ${job.from_location} → ${job.to_location}`,
                    job_id: job.id,
                    status: 'completed'
                })

            toast.success('İş onaylandı! Müşteri telefonu açıldı.')
            loadJobs()
        } catch (error: any) {
            console.error('Error approving job:', error)
            toast.error(error.message || 'İş onaylanırken hata oluştu')
        }
    }

    const handleReject = async (job: Job) => {
        try {
            const { error } = await supabase
                .from('marketplace_jobs')
                .update({
                    status: 'available',
                    buyer_id: null,
                    purchased_at: null
                })
                .eq('id', job.id)

            if (error) throw error

            toast.success('İş reddedildi. Tekrar havuza düştü.')
            loadJobs()
        } catch (error: any) {
            console.error('Error rejecting job:', error)
            toast.error(error.message || 'İş reddedilirken hata oluştu')
        }
    }

    const handleCancel = async (job: Job) => {
        try {
            const { error } = await supabase
                .from('marketplace_jobs')
                .update({
                    status: 'available',
                    buyer_id: null,
                    purchased_at: null
                })
                .eq('id', job.id)

            if (error) throw error

            toast.success('İş iptal edildi.')
            loadJobs()
        } catch (error: any) {
            console.error('Error cancelling job:', error)
            toast.error(error.message || 'İş iptal edilirken hata oluştu')
        }
    }

    const handleShareIBAN = async (job: Job) => {
        setSelectedJob(job)
        setShowShareIBANModal(true)
    }

    const submitIBAN = async (iban: string, accountName: string) => {
        if (!selectedJob) return

        try {
            const updateData = selectedJob.payment_type === 'cash'
                ? {
                    seller_iban: iban,
                    seller_account_name: accountName,
                    iban_revealed: true
                }
                : {
                    buyer_iban: iban,
                    buyer_account_name: accountName,
                    iban_revealed: true
                }

            const { error } = await supabase
                .from('marketplace_jobs')
                .update(updateData)
                .eq('id', selectedJob.id)

            if (error) throw error

            toast.success('IBAN paylaşıldı!')
            loadJobs()
        } catch (error: any) {
            console.error('Error sharing IBAN:', error)
            toast.error(error.message || 'IBAN paylaşılırken hata oluştu')
            throw error
        }
    }

    const handleComplete = async (job: Job) => {
        setSelectedJob(job)
        setShowCompleteModal(true)
    }

    const completeJob = async () => {
        if (!selectedJob) return

        try {
            const { error } = await supabase
                .from('marketplace_jobs')
                .update({ status: 'completed' })
                .eq('id', selectedJob.id)

            if (error) throw error

            toast.success('İş tamamlandı!')
            loadJobs()
        } catch (error: any) {
            console.error('Error completing job:', error)
            toast.error(error.message || 'İş tamamlanırken hata oluştu')
            throw error
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.to_location.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'my_jobs' && (job.seller_id === currentUserId || job.buyer_id === currentUserId)) ||
            job.status === filterStatus

        return matchesSearch && matchesFilter
    })

    if (!marketplaceSettings.enabled) {
        return (
            <div className="text-center py-20">
                <p className="text-xl text-gray-600">İş Havuzu şu anda kapalı</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-4"></div>
                        <div className="h-24 bg-gray-200 rounded mb-4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">İş Havuzu</h1>
                    <p className="text-gray-600">Transfer işlerini paylaş ve kazan</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Yeni İş İlanı
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Konum ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">Tüm İşler</option>
                    <option value="my_jobs">İşlerim</option>
                    <option value="available">Müsait</option>
                    <option value="pending_approval">Onay Bekliyor</option>
                    <option value="approved">Onaylandı</option>
                </select>
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-600">Henüz iş bulunmuyor</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            currentUserId={currentUserId}
                            onPurchase={handlePurchase}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onCancel={handleCancel}
                            onShareIBAN={handleShareIBAN}
                            onComplete={handleComplete}
                        />
                    ))}
                </div>
            )}

            {/* Create Job Modal */}
            <CreateJobModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    loadJobs()
                    loadUserData()
                }}
                marketplaceSettings={marketplaceSettings}
                userBalance={userBalance}
            />

            {/* Share IBAN Modal */}
            <ShareIBANModal
                isOpen={showShareIBANModal}
                onClose={() => {
                    setShowShareIBANModal(false)
                    setSelectedJob(null)
                }}
                onSubmit={submitIBAN}
                paymentType={selectedJob?.payment_type as 'cash' | 'prepaid' || 'cash'}
            />

            {/* Complete Job Modal */}
            <CompleteJobModal
                isOpen={showCompleteModal}
                onClose={() => {
                    setShowCompleteModal(false)
                    setSelectedJob(null)
                }}
                onConfirm={completeJob}
                paymentType={selectedJob?.payment_type as 'cash' | 'prepaid' || 'cash'}
                ibanInfo={selectedJob ? {
                    iban: selectedJob.payment_type === 'cash' ? (selectedJob.seller_iban || '') : (selectedJob.buyer_iban || ''),
                    accountName: selectedJob.payment_type === 'cash' ? (selectedJob.seller_account_name || '') : (selectedJob.buyer_account_name || '')
                } : null}
            />
        </div>
    )
}
