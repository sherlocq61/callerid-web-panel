'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Settings, Globe } from 'lucide-react'
import SEOSettingsPanel from '@/components/admin/SEOSettingsPanel'

export default function AdminSEOPage() {
    return (
        <AdminLayout>
            <div className="p-8">
                <SEOSettingsPanel />
            </div>
        </AdminLayout>
    )
}
