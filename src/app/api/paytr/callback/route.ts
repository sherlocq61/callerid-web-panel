import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with runtime check to prevent build errors
const getSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables')
        return null
    }

    return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()

        const merchant_oid = formData.get('merchant_oid') as string
        const status = formData.get('status') as string
        const total_amount = formData.get('total_amount') as string
        const hash = formData.get('hash') as string
        const failed_reason_code = formData.get('failed_reason_code') as string
        const failed_reason_msg = formData.get('failed_reason_msg') as string

        // PayTR credentials
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'YOUR_MERCHANT_KEY'
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'YOUR_MERCHANT_SALT'

        // Hash doğrulama
        const hashSTR = merchant_oid + merchant_salt + status + total_amount
        const calculatedHash = crypto
            .createHmac('sha256', merchant_key)
            .update(hashSTR)
            .digest('base64')

        if (hash !== calculatedHash) {
            console.error('Hash mismatch!')
            return new NextResponse('OK', { status: 200 }) // PayTR'ye OK dönmek zorunlu
        }

        // Ödeme başarılı ise
        if (status === 'success') {
            console.log('Payment successful:', {
                merchant_oid,
                total_amount,
                status
            })

            // Get Supabase client
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.error('Supabase client initialization failed')
                return new NextResponse('OK', { status: 200 })
            }

            // merchant_oid'den user_id ve plan bilgisini çıkar
            // Format: userId-plan-timestamp
            const parts = merchant_oid.split('-')
            if (parts.length >= 2) {
                const userId = parts[0]
                const plan = parts[1]

                // Subscription'ı güncelle veya oluştur
                const expiresAt = new Date()
                expiresAt.setMonth(expiresAt.getMonth() + 1) // 1 ay ekle

                const maxDevices = plan === 'lite' ? 1 : plan === 'pro' ? 5 : 999

                const { error: subError } = await supabase
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        plan: plan,
                        status: 'active',
                        max_devices: maxDevices,
                        started_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString()
                    }, {
                        onConflict: 'user_id'
                    })

                if (subError) {
                    console.error('Subscription update error:', subError)
                } else {
                    console.log('Subscription updated successfully for user:', userId)
                }
            }
        } else {
            console.error('Payment failed:', {
                merchant_oid,
                failed_reason_code,
                failed_reason_msg
            })
        }

        // PayTR'ye OK dönmek zorunlu
        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Callback error:', error)
        return new NextResponse('OK', { status: 200 }) // Hata olsa bile OK dön
    }
}
