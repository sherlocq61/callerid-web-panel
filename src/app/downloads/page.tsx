'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Download, Smartphone, Monitor, Calendar } from 'lucide-react'

interface Download {
    id: string
    name: string
    version: string
    file_url: string
    platform: 'windows' | 'android'
    file_size: number
    created_at: string
}

interface UpdateNote {
    id: string
    version: string
    title: string
    content: string
    published_at: string
}

export default function DownloadsPage() {
    const [downloads, setDownloads] = useState<Download[]>([])
    const [updateNotes, setUpdateNotes] = useState<UpdateNote[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch downloads
            const { data: downloadsData } = await supabase
                .from('downloads')
                .select('*')
                .order('created_at', { ascending: false })

            // Fetch published update notes
            const { data: notesData } = await supabase
                .from('update_notes')
                .select('*')
                .eq('published', true)
                .order('published_at', { ascending: false })
                .limit(5)

            setDownloads(downloadsData || [])
            setUpdateNotes(notesData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    const windowsDownload = downloads.find(d => d.platform === 'windows')
    const androidDownload = downloads.find(d => d.platform === 'android')

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">CallerID İndir</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Windows ve Android için uygulamalarımızı indirin
                            </p>
                        </div>
                        <a
                            href="/"
                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            ← Ana Sayfa
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Downloads Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">İndirmeler</h2>

                        {/* Windows Download */}
                        {windowsDownload && (
                            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <Monitor className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {windowsDownload.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Versiyon {windowsDownload.version} • {formatFileSize(windowsDownload.file_size)}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={windowsDownload.file_url}
                                        download
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        İndir
                                    </a>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <strong>Kurulum:</strong> ZIP dosyasını çıkartın ve CallerID.exe dosyasını çalıştırın.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Android Download */}
                        {androidDownload && (
                            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-green-100 rounded-lg">
                                            <Smartphone className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {androidDownload.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Versiyon {androidDownload.version} • {formatFileSize(androidDownload.file_size)}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={androidDownload.file_url}
                                        download
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="w-5 h-5 mr-2" />
                                        İndir
                                    </a>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        <strong>Kurulum:</strong> APK dosyasını indirin ve cihazınıza kurun. Bilinmeyen kaynaklardan kuruluma izin vermeniz gerekebilir.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Update Notes Section */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Güncelleme Notları</h2>

                        {updateNotes.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <p className="text-gray-500 text-center">Henüz güncelleme notu yok</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {updateNotes.map((note) => (
                                    <div key={note.id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(note.published_at).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            v{note.version} - {note.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm whitespace-pre-line">
                                            {note.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
