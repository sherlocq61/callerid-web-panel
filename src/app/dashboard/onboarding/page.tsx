// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createBrowserClient()

    useEffect(() => {
        checkOnboardingStatus()
    }, [])

    const checkOnboardingStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        const { data } = await supabase
            .from('user_onboarding')
            .select('completed')
            .eq('user_id', user.id)
            .single()

        if (data?.completed) {
            router.push('/dashboard')
        }
    }

    return <OnboardingWizard />
}
