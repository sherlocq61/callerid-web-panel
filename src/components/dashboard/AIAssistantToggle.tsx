"use client"

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function AIAssistantToggle() {
    const [enabled, setEnabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('ai_assistant_settings')
                .select('enabled')
                .eq('user_id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading AI settings:', error)
                return
            }

            if (data) {
                setEnabled(data.enabled)
            } else {
                // Create default settings
                await supabase
                    .from('ai_assistant_settings')
                    .insert({
                        user_id: user.id,
                        enabled: false
                    })
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleAI() {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const newEnabled = !enabled

            const { error } = await supabase
                .from('ai_assistant_settings')
                .upsert({
                    user_id: user.id,
                    enabled: newEnabled,
                    updated_at: new Date().toISOString()
                })

            if (error) {
                console.error('Error updating AI settings:', error)
                return
            }

            setEnabled(newEnabled)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <div className={`
        relative overflow-hidden rounded-2xl p-6
        ${enabled
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800'
                }
        transition-all duration-500 ease-in-out
      `}>
                {/* Animated background */}
                {enabled && (
                    <motion.div
                        className="absolute inset-0 opacity-30"
                        animate={{
                            background: [
                                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                                'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                                'radial-gradient(circle at 0% 100%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                                'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                            ]
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                )}

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={enabled ? {
                                rotate: [0, 360],
                                scale: [1, 1.2, 1]
                            } : {}}
                            transition={{
                                duration: 2,
                                repeat: enabled ? Infinity : 0,
                                ease: "easeInOut"
                            }}
                        >
                            <Sparkles className={`w-8 h-8 ${enabled ? 'text-white' : 'text-gray-400'}`} />
                        </motion.div>

                        <div>
                            <h3 className={`text-lg font-bold ${enabled ? 'text-white' : 'text-gray-300'}`}>
                                AI Asistan
                            </h3>
                            <p className={`text-sm ${enabled ? 'text-white/80' : 'text-gray-400'}`}>
                                {enabled ? 'Aramalarınızı yanıtlıyor' : 'Kapalı'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={toggleAI}
                        disabled={loading}
                        className={`
              relative w-16 h-8 rounded-full transition-all duration-300
              ${enabled ? 'bg-white/30' : 'bg-gray-600'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        <motion.div
                            className={`
                absolute top-1 w-6 h-6 rounded-full shadow-lg
                ${enabled ? 'bg-white' : 'bg-gray-400'}
              `}
                            animate={{
                                left: enabled ? '36px' : '4px'
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                        />
                    </button>
                </div>

                {enabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/20"
                    >
                        <p className="text-sm text-white/90">
                            ✨ Bilinmeyen numaralardan gelen aramalar otomatik olarak AI asistanınız tarafından yanıtlanacak.
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
