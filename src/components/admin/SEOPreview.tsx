'use client'

import { Search, Facebook, Twitter } from 'lucide-react'

interface SEOSettings {
    title: string
    description: string
    canonical_url?: string
    og_title?: string
    og_description?: string
    og_image?: string
    twitter_title?: string
    twitter_description?: string
    twitter_image?: string
}

interface SEOPreviewProps {
    settings: SEOSettings
}

export default function SEOPreview({ settings }: SEOPreviewProps) {
    const googleTitle = settings.title || 'Başlık girilmedi'
    const googleDesc = settings.description || 'Açıklama girilmedi'
    const googleUrl = settings.canonical_url || 'https://yourdomain.com'

    const ogTitle = settings.og_title || settings.title || 'Başlık girilmedi'
    const ogDesc = settings.og_description || settings.description || 'Açıklama girilmedi'
    const ogImage = settings.og_image || '/placeholder-og.png'

    const twitterTitle = settings.twitter_title || settings.title || 'Başlık girilmedi'
    const twitterDesc = settings.twitter_description || settings.description || 'Açıklama girilmedi'
    const twitterImage = settings.twitter_image || '/placeholder-twitter.png'

    return (
        <div className="space-y-8">
            {/* Google Search Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Google Arama Sonucu
                </h3>

                <div className="bg-gray-50 rounded-lg p-6">
                    <div className="max-w-2xl">
                        {/* URL */}
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                Ç
                            </div>
                            <span className="text-sm text-gray-600">{googleUrl}</span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xl text-blue-600 hover:underline cursor-pointer mb-2">
                            {googleTitle}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-gray-700 leading-relaxed">
                            {googleDesc}
                        </p>
                    </div>
                </div>
            </div>

            {/* Facebook Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    Facebook/LinkedIn Paylaşım
                </h3>

                <div className="bg-gray-50 rounded-lg p-6">
                    <div className="max-w-lg border border-gray-300 rounded-lg overflow-hidden bg-white">
                        {/* Image */}
                        <div className="aspect-[1.91/1] bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            {ogImage.startsWith('http') ? (
                                <img
                                    src={ogImage}
                                    alt="OG Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-gray-400 text-center">
                                    <div className="text-4xl mb-2">🖼️</div>
                                    <div className="text-sm">1200x630px</div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 border-t border-gray-200">
                            <div className="text-xs text-gray-500 uppercase mb-1">
                                {googleUrl.replace('https://', '').replace('http://', '')}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                                {ogTitle}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {ogDesc}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Twitter Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-blue-400" />
                    Twitter Kart
                </h3>

                <div className="bg-gray-50 rounded-lg p-6">
                    <div className="max-w-lg border border-gray-300 rounded-2xl overflow-hidden bg-white">
                        {/* Image */}
                        <div className="aspect-[2/1] bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                            {twitterImage.startsWith('http') ? (
                                <img
                                    src={twitterImage}
                                    alt="Twitter Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-gray-400 text-center">
                                    <div className="text-4xl mb-2">🖼️</div>
                                    <div className="text-sm">1200x600px</div>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 border-t border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                                {twitterTitle}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {twitterDesc}
                            </p>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                🔗 {googleUrl.replace('https://', '').replace('http://', '')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEO Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-bold mb-4 text-blue-900">💡 SEO İpuçları</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span><strong>Başlık:</strong> 50-60 karakter arası olmalı</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span><strong>Açıklama:</strong> 150-160 karakter arası olmalı</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span><strong>OG Görsel:</strong> 1200x630px boyutunda olmalı</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span><strong>Twitter Görsel:</strong> 1200x600px boyutunda olmalı</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span><strong>Anahtar Kelimeler:</strong> 5-10 adet hedeflenmiş kelime kullanın</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}
