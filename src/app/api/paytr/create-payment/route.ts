import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, name, plan, price, maxDevices, userId } = body

        // PayTR credentials (environment variables'dan alınacak)
        const merchant_id = process.env.PAYTR_MERCHANT_ID || 'YOUR_MERCHANT_ID'
        const merchant_key = process.env.PAYTR_MERCHANT_KEY || 'YOUR_MERCHANT_KEY'
        const merchant_salt = process.env.PAYTR_MERCHANT_SALT || 'YOUR_MERCHANT_SALT'

        // Sipariş bilgileri - Format: userId-plan-timestamp
        const merchant_oid = `${userId}-${plan}-${Date.now()}`
        const user_basket = JSON.stringify([
            [`${plan.charAt(0).toUpperCase() + plan.slice(1)} Paket`, price, 1]
        ])

        // Fiyat kuruş cinsinden (100 = 1 TL)
        const payment_amount = (parseFloat(price) * 100).toString()

        // Callback URLs
        const merchant_ok_url = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
        const merchant_fail_url = `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`

        // Test modu (1 = test, 0 = canlı)
        const test_mode = process.env.NODE_ENV === 'development' ? '1' : '0'

        // Kullanıcı bilgileri
        const user_name = name || 'Kullanıcı'
        const user_address = 'Türkiye'
        const user_phone = '5555555555'
        const user_ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
        const no_installment = '1'
        const max_installment = '0'
        const currency = 'TL'

        // Hash oluşturma
        const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${email}${payment_amount}${user_basket}${no_installment}${max_installment}${currency}${test_mode}`
        const paytr_token = crypto
            .createHmac('sha256', merchant_key)
            .update(hashSTR + merchant_salt)
            .digest('base64')

        // PayTR'ye istek gönder
        const paytrData = new URLSearchParams({
            merchant_id,
            user_ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
            merchant_oid,
            email,
            payment_amount,
            paytr_token,
            user_basket,
            debug_on: test_mode,
            no_installment: '1',
            max_installment: '0',
            user_name,
            user_address,
            user_phone,
            merchant_ok_url,
            merchant_fail_url,
            timeout_limit: '30',
            currency: 'TL',
            test_mode,
            lang: 'tr'
        })

        const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: paytrData.toString(),
        })

        const result = await paytrResponse.json()

        if (result.status === 'success') {
            return NextResponse.json({
                status: 'success',
                token: result.token,
                merchant_oid
            })
        } else {
            return NextResponse.json({
                status: 'error',
                reason: result.reason || 'PayTR hatası'
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Payment creation error:', error)
        return NextResponse.json({
            status: 'error',
            reason: 'Sunucu hatası'
        }, { status: 500 })
    }
}
