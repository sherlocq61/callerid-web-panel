'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Download } from 'lucide-react'

interface Download {
    id: string
    name: string
    version: string
    file_url: string
    platform: 'windows' | 'android'
    file_size: number
    created_at: string
}

export default function AdminDownloadsPage() {
    const [downloads, setDownloads] = useState<Download[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingDownload, setEditingDownload] = useState<Download | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        version: '',
        file_url: '',
        platform: 'windows' as 'windows' | 'android',
        file_size: 0
    })
    const supabase = createBrowserClient()

    useEffect(() => {
        fetchDownloads()
    }, [])

    const fetchDownloads = async () => {
        try {
            const { data } = await supabase
                .from('downloads')
                .select('*')
                .order('created_at', { ascending: false })

            setDownloads(data || [])
        } catch (error) {
            console.error('Error fetching downloads:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (editingDownload) {
                // Update
                await supabase
                    .from('downloads')
                    .update(formData)
                    .eq('id', editingDownload.id)
            } else {
                // Create
                await supabase
                    .from('downloads')
                    .insert([formData])
            }

            setShowModal(false)
            setEditingDownload(null)
            setFormData({ name: '', version: '', file_url: '', platform: 'windows', file_size: 0 })
            fetchDownloads()
        } catch (error) {
            console.error('Error saving download:', error)
            alert('Hata oluştu!')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu indirmeyi silmek istediğinizden emin misiniz?')) return

        try {
            await supabase
                .from('downloads')
                .delete()
                .eq('id', id)

            fetchDownloads()
        } catch (error) {
            console.error('Error deleting download:', error)
            alert('Hata oluştu!')
        }
    }

    const openEditModal = (download: Download) => {
        setEditingDownload(download)
        setFormData({
            name: download.name,
            version: download.version,
            file_url: download.file_url,
            platform: download.platform,
            file_size: download.file_size
        })
        setShowModal(true)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    if (loading) {
        return <div className="p-8">Yükleniyor...</div>
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">İndirmeler Yönetimi</h1>
                <button
                    onClick={() => {
                        setEditingDownload(null)
                        setFormData({ name: '', version: '', file_url: '', platform: 'windows', file_size: 0 })
                        setShowModal(true)
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Yeni İndirme
                </button>
            </div>

            {/* Downloads Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versiyon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boyut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosya URL</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {downloads.map((download) => (
                            <tr key={download.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {download.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {download.version}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded-full text-xs ${download.platform === 'windows' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {download.platform === 'windows' ? 'Windows' : 'Android'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatFileSize(download.file_size)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {download.file_url}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openEditModal(download)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(download.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingDownload ? 'İndirme Düzenle' : 'Yeni İndirme'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Versiyon
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosya URL
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.file_url}
                                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="/downloads/dosya.zip"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Platform
                                    </label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'windows' | 'android' })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="windows">Windows</option>
                                        <option value="android">Android</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dosya Boyutu (bytes)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.file_size}
                                        onChange={(e) => setFormData({ ...formData, file_size: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
