'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Wallet, TrendingUp, TrendingDown, Clock, Plus } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Balance {
    balance: number
    currency: string
}

interface Transaction {
    id: string
    amount: number
    type: string
    description: string
    created_at: string
    status: string
}

export default function BalancePanel() {
    const [balance, setBalance] = useState<Balance | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        loadBalance()
        loadTransactions()
    }, [])

    const loadBalance = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from('user_balances')
                .select('balance, currency')
                .eq('user_id', session.user.id)
                .single()

            if (error && error.code === 'PGRST116') {
                // Balance doesn't exist, create it
                const { data: newBalance } = await supabase
                    .from('user_balances')
                    .insert({ user_id: session.user.id, balance: 0, currency: 'TRY' })
                    .select()
                    .single()

                setBalance(newBalance || { balance: 0, currency: 'TRY' })
            } else if (data) {
                setBalance(data)
            }
        } catch (error) {
            console.error('Error loading balance:', error)
            toast.error('Bakiye yüklenirken hata oluştu')
        }
    }

    const loadTransactions = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from('balance_transactions')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error loading transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <TrendingUp className="w-5 h-5 text-green-500" />
            case 'withdrawal':
            case 'commission':
            case 'job_purchase':
                return <TrendingDown className="w-5 h-5 text-red-500" />
            case 'refund':
                return <TrendingUp className="w-5 h-5 text-blue-500" />
            default:
                return <Clock className="w-5 h-5 text-gray-500" />
        }
    }

    const getTransactionLabel = (type: string) => {
        const labels: Record<string, string> = {
            deposit: 'Para Yükleme',
            withdrawal: 'Para Çekme',
            commission: 'İş Komisyonu',
            refund: 'İade',
            job_purchase: 'İş Satın Alma'
        }
        return labels[type] || type
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-24 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Hesap Bakiyesi</p>
                            <h2 className="text-4xl font-bold">
                                ₺{balance?.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => toast.success('Bakiye yükleme özelliği yakında eklenecek!')}
                        className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Bakiye Yükle
                    </button>
                </div>
            </motion.div>

            {/* Transactions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-6">İşlem Geçmişi</h3>

                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Henüz işlem bulunmuyor</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {getTransactionIcon(transaction.type)}
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {getTransactionLabel(transaction.type)}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(transaction.created_at)}
                                        </p>
                                        {transaction.description && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {transaction.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.amount > 0 ? '+' : ''}
                                        ₺{Math.abs(transaction.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${transaction.status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : transaction.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                        {transaction.status === 'completed' ? 'Tamamlandı' :
                                            transaction.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
