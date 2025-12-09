'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Settings, Save, Eye, Code, Globe } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import SEOPreview from './SEOPreview'

interface SEOSettings {
    id?: string
    page_type: string
    title: string
    description: string
    keywords: string[]
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
    is_active?: boolean
}

const PAGE_TYPES = [
    { value: 'landing', label: 'Landing Page' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'login', label: 'Login' },
    { value: 'register', label: 'Register' }
]

export default function SEOSettingsPanel() {
    const [selectedPage, setSelectedPage] = useState('landing')
    const [settings, setSettings] = useState<SEOSettings>({
        page_type: 'landing',
        title: '',
        description: '',
        keywords: [],
        author: 'Çağrı Yönetimi'
    })
    const [loading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [keywordInput, setKeywordInput] = useState('')

    const supabase = createBrowserClient()

    useEffect(() => {
        loadSettings()
    }, [selectedPage])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seo_settings')
                .select('*')
                .eq('page_type', selectedPage)
                .single()

            if (error) {
                console.error('Error loading SEO settings:', error)
                // Initialize with defaults
                setSettings({
                    page_type: selectedPage,
                    title: '',
                    description: '',
                    keywords: [],
                    author: 'Çağrı Yönetimi'
                })
            } else {
                setSettings(data)
            }
        } catch (err) {
            console.error('Error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seo_settings')
                .upsert({
                    ...settings,
                    page_type: selectedPage,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single()

            if (error) throw error

            toast.success('SEO ayarları kaydedildi!')
            setSettings(data)
        } catch (err: any) {
            console.error('Error saving:', err)
            toast.error('Kaydetme hatası: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const addKeyword = () => {
        if (keywordInput.trim() && !settings.keywords.includes(keywordInput.trim())) {
            setSettings({
                ...settings,
                keywords: [...settings.keywords, keywordInput.trim()]
            })
            setKeywordInput('')
        }
    }

    const removeKeyword = (keyword: string) => {
        setSettings({
            ...settings,
            keywords: settings.keywords.filter(k => k !== keyword)
        })
    }

    return (
        <div className="space-y-6">
            <Toaster />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">SEO Ayarları</h2>
                        <p className="text-gray-600">Meta tags ve sosyal medya paylaşım ayarları</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        {showPreview ? 'Düzenlemeye Dön' : 'Önizleme'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        Kaydet
                    </button>
                </div>
            </div>

            {showPreview ? (
                <SEOPreview settings={settings} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - Page Selector */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4">Sayfa Seçimi</h3>
                            <div className="space-y-2">
                                {PAGE_TYPES.map(page => (
                                    <button
                                        key={page.value}
                                        onClick={() => setSelectedPage(page.value)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedPage === page.value
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {page.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content - SEO Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Meta Tags */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-600" />
                                Temel Meta Tags
                            </h3>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sayfa Başlığı
                                        <span className="text-gray-400 ml-2">
                                            ({settings.title.length}/60)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.title}
                                        onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                                        maxLength={60}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="Çağrı Yönetimi - Profesyonel Çağrı Yönetim Sistemi"
                                    />
                                    {settings.title.length > 55 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            ⚠️ Başlık 60 karakterden kısa olmalı
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Açıklama
                                        <span className="text-gray-400 ml-2">
                                            ({settings.description.length}/160)
                                        </span>
                                    </label>
                                    <textarea
                                        value={settings.description}
                                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                        maxLength={160}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="Modern çağrı yönetim sistemi ile tüm aramalarınızı takip edin..."
                                    />
                                    {settings.description.length > 155 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            ⚠️ Açıklama 160 karakterden kısa olmalı
                                        </p>
                                    )}
                                </div>

                                {/* Keywords */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Anahtar Kelimeler
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={keywordInput}
                                            onChange={(e) => setKeywordInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                            placeholder="Anahtar kelime ekle..."
                                        />
                                        <button
                                            onClick={addKeyword}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Ekle
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {settings.keywords.map(keyword => (
                                            <span
                                                key={keyword}
                                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                            >
                                                {keyword}
                                                <button
                                                    onClick={() => removeKeyword(keyword)}
                                                    className="hover:text-blue-900"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Canonical URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Canonical URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.canonical_url || ''}
                                        onChange={(e) => setSettings({ ...settings, canonical_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="https://yourdomain.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Open Graph Tags */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4">Open Graph (Facebook/LinkedIn)</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        OG Başlık
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.og_title || ''}
                                        onChange={(e) => setSettings({ ...settings, og_title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder={settings.title || 'Boş bırakılırsa sayfa başlığı kullanılır'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        OG Açıklama
                                    </label>
                                    <textarea
                                        value={settings.og_description || ''}
                                        onChange={(e) => setSettings({ ...settings, og_description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder={settings.description || 'Boş bırakılırsa sayfa açıklaması kullanılır'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        OG Görsel URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.og_image || ''}
                                        onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="https://yourdomain.com/og-image.png"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Önerilen boyut: 1200x630px
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Twitter Card */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4">Twitter Card</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter Başlık
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.twitter_title || ''}
                                        onChange={(e) => setSettings({ ...settings, twitter_title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder={settings.title || 'Boş bırakılırsa sayfa başlığı kullanılır'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter Açıklama
                                    </label>
                                    <textarea
                                        value={settings.twitter_description || ''}
                                        onChange={(e) => setSettings({ ...settings, twitter_description: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder={settings.description || 'Boş bırakılırsa sayfa açıklaması kullanılır'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter Görsel URL
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.twitter_image || ''}
                                        onChange={(e) => setSettings({ ...settings, twitter_image: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                        placeholder="https://yourdomain.com/twitter-image.png"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Önerilen boyut: 1200x600px
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Structured Data */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Code className="w-5 h-5 text-purple-600" />
                                Structured Data (Schema.org)
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    JSON-LD
                                </label>
                                <textarea
                                    value={settings.structured_data ? JSON.stringify(settings.structured_data, null, 2) : ''}
                                    onChange={(e) => {
                                        try {
                                            const parsed = JSON.parse(e.target.value)
                                            setSettings({ ...settings, structured_data: parsed })
                                        } catch (err) {
                                            // Invalid JSON, just update the text
                                        }
                                    }}
                                    rows={10}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
                                    placeholder={`{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Çağrı Yönetimi"
}`}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    <a
                                        href="https://schema.org/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        Schema.org
                                    </a>
                                    {' '}dokümantasyonuna göz atın
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
