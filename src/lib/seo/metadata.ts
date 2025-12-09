import { createServerClient } from '@/lib/supabase/server'

export interface SEOSettings {
    title: string
    description: string
    keywords?: string[]
    author?: string
    canonical_url?: string
    og_title?: string
    og_description?: string
    og_image?: string
    og_type?: string
    og_url?: string
    twitter_card?: string
    twitter_title?: string
    twitter_description?: string
    twitter_image?: string
    twitter_site?: string
    structured_data?: any
}

export async function getSEOSettings(pageType: string = 'landing'): Promise<SEOSettings | null> {
    try {
        const supabase = createServerClient()

        const { data, error } = await supabase
            .from('seo_settings')
            .select('*')
            .eq('page_type', pageType)
            .eq('is_active', true)
            .single()

        if (error) {
            console.error('Error fetching SEO settings:', error)
            return getDefaultSEO(pageType)
        }

        return data
    } catch (err) {
        console.error('Error in getSEOSettings:', err)
        return getDefaultSEO(pageType)
    }
}

function getDefaultSEO(pageType: string): SEOSettings {
    const defaults: Record<string, SEOSettings> = {
        landing: {
            title: 'Çağrı Yönetimi - Profesyonel Çağrı Yönetim Sistemi',
            description: 'Modern çağrı yönetim sistemi ile tüm aramalarınızı takip edin, analiz edin ve ekibinizle paylaşın.',
            keywords: ['çağrı yönetimi', 'arama kaydı', 'telefon yönetimi'],
            author: 'Çağrı Yönetimi'
        },
        dashboard: {
            title: 'Dashboard - Çağrı Yönetimi',
            description: 'Çağrı yönetim paneliniz',
            author: 'Çağrı Yönetimi'
        }
    }

    return defaults[pageType] || defaults.landing
}

export function generateMetadata(seo: SEOSettings) {
    return {
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords?.join(', '),
        authors: seo.author ? [{ name: seo.author }] : undefined,
        openGraph: {
            title: seo.og_title || seo.title,
            description: seo.og_description || seo.description,
            images: seo.og_image ? [seo.og_image] : undefined,
            type: (seo.og_type as any) || 'website',
            url: seo.og_url || seo.canonical_url
        },
        twitter: {
            card: (seo.twitter_card as any) || 'summary_large_image',
            title: seo.twitter_title || seo.title,
            description: seo.twitter_description || seo.description,
            images: seo.twitter_image ? [seo.twitter_image] : undefined,
            site: seo.twitter_site
        },
        alternates: {
            canonical: seo.canonical_url
        }
    }
}
