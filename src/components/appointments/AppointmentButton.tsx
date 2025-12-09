'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import AppointmentModal from './AppointmentModal'

interface AppointmentButtonProps {
    phoneNumber: string
    contactName: string | null
}

export default function AppointmentButton({ phoneNumber, contactName }: AppointmentButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:shadow-md"
                title="Randevu Oluştur"
            >
                <Calendar className="w-4 h-4" />
                Randevu
            </button>

            <AppointmentModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                phoneNumber={phoneNumber}
                contactName={contactName}
                onSuccess={() => {
                    setIsOpen(false)
                }}
            />
        </>
    )
}
