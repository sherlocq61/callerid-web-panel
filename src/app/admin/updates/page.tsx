'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'

interface UpdateNote {
    id: string
    version: string
    title: string
    content: string
    published: boolean
    published_at: string | null
    created_at: string
}

export default function AdminUpdatesPage() {
    const [updateNotes, setUpdateNotes] = useState<UpdateNote[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingNote, setEditingNote] = useState<UpdateNote | null>(null)
    const [formData, setFormData] = useState({
        version: '',
        title: '',
        content: '',
        published: false
    })
    const supabase = createBrowserClient()

    useEffect(() => {
        fetchUpdateNotes()
    }, [])

    const fetchUpdateNotes = async () => {
        try {
            const { data } = await supabase
                .from('update_notes')
                .select('*')
                .order('created_at', { ascending: false })

            setUpdateNotes(data || [])
        } catch (error) {
            console.error('Error fetching update notes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const dataToSave = {
                ...formData,
                published_at: formData.published ? new Date().toISOString() : null
            }

            if (editingNote) {
                // Update
                await supabase
                    .from('update_notes')
                    .update(dataToSave)
                    .eq('id', editingNote.id)
            } else {
                // Create
                await supabase
                    .from('update_notes')
                    .insert([dataToSave])
            }

            setShowModal(false)
            setEditingNote(null)
            setFormData({ version: '', title: '', content: '', published: false })
            fetchUpdateNotes()
        } catch (error) {
            console.error('Error saving update note:', error)
            alert('Hata oluştu!')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu güncelleme notunu silmek istediğinizden emin misiniz?')) return

        try {
            await supabase
                .from('update_notes')
                .delete()
                .eq('id', id)

            fetchUpdateNotes()
        } catch (error) {
            console.error('Error deleting update note:', error)
            alert('Hata oluştu!')
        }
    }

    const togglePublish = async (note: UpdateNote) => {
        try {
            await supabase
                .from('update_notes')
                .update({
                    published: !note.published,
                    published_at: !note.published ? new Date().toISOString() : null
                })
                .eq('id', note.id)

            fetchUpdateNotes()
        } catch (error) {
            console.error('Error toggling publish:', error)
            alert('Hata oluştu!')
        }
    }

    const openEditModal = (note: UpdateNote) => {
        setEditingNote(note)
        setFormData({
            version: note.version,
            title: note.title,
            content: note.content,
            published: note.published
        })
        setShowModal(true)
    }

    if (loading) {
        return <div className="p-8">Yükleniyor...</div>
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Güncelleme Notları Yönetimi</h1>
                <button
                    onClick={() => {
                        setEditingNote(null)
                        setFormData({ version: '', title: '', content: '', published: false })
                        setShowModal(true)
                    }}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Yeni Not
                </button>
            </div>

            {/* Update Notes Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Versiyon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İçerik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {updateNotes.map((note) => (
                            <tr key={note.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    v{note.version}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {note.title}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                                    {note.content}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs ${note.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {note.published ? 'Yayında' : 'Taslak'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {note.published_at ? new Date(note.published_at).toLocaleDateString('tr-TR') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => togglePublish(note)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                        title={note.published ? 'Yayından Kaldır' : 'Yayınla'}
                                    >
                                        {note.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(note)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
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
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingNote ? 'Güncelleme Notu Düzenle' : 'Yeni Güncelleme Notu'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Versiyon
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.version}
                                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="1.0.0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Başlık
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="Yeni Özellikler Eklendi"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        İçerik
                                    </label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        rows={6}
                                        placeholder="Güncelleme detayları..."
                                        required
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="published"
                                        checked={formData.published}
                                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                    <label htmlFor="published" className="ml-2 text-sm text-gray-700">
                                        Hemen yayınla
                                    </label>
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
