'use client'

import { Call } from '@/lib/supabase/types'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react'

interface CallItemProps {
    call: Call
    index: number
}

/**
 * Component: CallItem
 * Displays a single call in the list
 * Follows Single Responsibility Principle
 */
export function CallItem({ call, index }: CallItemProps) {
    const getCallIcon = () => {
        switch (call.call_type) {
            case 'incoming':
                return <PhoneIncoming className="w-5 h-5 text-green-500" />
            case 'outgoing':
                return <PhoneOutgoing className="w-5 h-5 text-blue-500" />
            case 'missed':
                return <PhoneMissed className="w-5 h-5 text-red-500" />
            default:
                return <Phone className="w-5 h-5 text-gray-500" />
        }
    }

    const getCallTypeLabel = () => {
        switch (call.call_type) {
            case 'incoming':
                return 'Gelen Arama'
            case 'outgoing':
                return 'Giden Arama'
            case 'missed':
                return 'Cevapsız Arama'
            default:
                return 'Bilinmeyen'
        }
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg">
                        {getCallIcon()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {call.contact_name || call.phone_number}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {call.contact_name && (
                                <span className="text-gray-400">{call.phone_number} • </span>
                            )}
                            {getCallTypeLabel()}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                        {formatDuration(call.duration)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(call.timestamp), {
                            addSuffix: true,
                            locale: tr,
                        })}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
