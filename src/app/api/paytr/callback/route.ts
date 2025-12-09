import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
            // merchant_oid'den plan bilgisini çıkar (SUB-timestamp formatında)
            // Gerçek uygulamada merchant_oid ile ilişkili sipariş bilgisini veritabanından çekmelisiniz

            // Örnek: Subscription oluştur/güncelle
            // Bu kısmı kendi iş mantığınıza göre düzenleyin

            console.log('Payment successful:', {
                merchant_oid,
                total_amount,
                status
            })

            // TODO: Subscription güncelleme
            // const { error } = await supabase
            //   .from('subscriptions')
            //   .update({
            //     status: 'active',
            //     expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            //   })
            //   .eq('user_id', userId)

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
