'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Plus, Loader2 } from 'lucide-react'

interface ContactFormData {
    phoneNumber: string
    name: string
    saveToDevice: boolean
    notes: string
}

/**
 * Component: ContactForm
 * Form for adding new contacts
 * Uses react-hook-form for validation
 */
export function ContactForm() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const supabase = createBrowserClient()

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ContactFormData>()

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true)
        setSuccess(false)

        try {
            const { error } = await supabase.from('contacts').insert({
                phone_number: data.phoneNumber,
                name: data.name,
                save_to_device: data.saveToDevice,
                notes: data.notes || null,
            })

            if (error) throw error

            setSuccess(true)
            reset()
            setTimeout(() => setSuccess(false), 3000)
        } catch (error) {
            console.error('Error adding contact:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100"
        >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-primary-500" />
                Yeni Numara Ekle
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon Numarası
                    </label>
                    <input
                        {...register('phoneNumber', {
                            required: 'Telefon numarası gerekli',
                            pattern: {
                                value: /^\+?[1-9]\d{1,14}$/,
                                message: 'Geçerli bir telefon numarası girin',
                            },
                        })}
                        type="tel"
                        placeholder="+90 555 123 4567"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        İsim
                    </label>
                    <input
                        {...register('name', { required: 'İsim gerekli' })}
                        type="text"
                        placeholder="Ahmet Yılmaz"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notlar (Opsiyonel)
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={3}
                        placeholder="Ek bilgiler..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg">
                    <input
                        {...register('saveToDevice')}
                        type="checkbox"
                        id="saveToDevice"
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <label htmlFor="saveToDevice" className="text-sm font-medium text-gray-700">
                        Telefona kaydet (Android cihaza push notification gönderilir)
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Ekleniyor...
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            Numara Ekle
                        </>
                    )}
                </button>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-center"
                    >
                        ✓ Numara başarıyla eklendi!
                    </motion.div>
                )}
            </form>
        </motion.div>
    )
}
