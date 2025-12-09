'use client'

import { useCalls } from '@/hooks/useCalls'
import { CallItem } from './CallItem'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

/**
 * Component: CallList
 * Displays list of calls with real-time updates
 */
export function CallList() {
    const { calls, loading, error } = useCalls()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800">Hata: {error.message}</p>
            </div>
        )
    }

    if (calls.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Henüz arama kaydı bulunmuyor.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {calls.map((call, index) => (
                <CallItem key={call.id} call={call} index={index} />
            ))}
        </div>
    )
}
