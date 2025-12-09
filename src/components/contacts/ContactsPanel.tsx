'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useNotification } from '@/components/notifications/NotificationProvider'
import { Plus, Search, Trash2, Edit2, Phone, User, Upload, Download, Smartphone } from 'lucide-react'
import { motion } from 'framer-motion'

interface Contact {
    id: string
    phone_number: string
    name: string
    notes: string | null
    created_at: string
}

export default function ContactsPanel() {
    const supabase = createBrowserClient()
    const { showToast, showConfirm, showPrompt } = useNotification()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)
    const [newContact, setNewContact] = useState({ phone_number: '', name: '', notes: '' })

    useEffect(() => {
        loadContacts()
    }, [])

    const loadContacts = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setContacts(data || [])
            setLoading(false)
        } catch (error) {
            console.error('Error loading contacts:', error)
            setLoading(false)
        }
    }

    const handleAddContact = async () => {
        if (!newContact.phone_number || !newContact.name) {
            showToast('Telefon numarası ve isim gerekli', 'error')
            return
        }

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const { error } = await supabase
                .from('contacts')
                .insert({
                    user_id: session.user.id,
                    phone_number: newContact.phone_number,
                    name: newContact.name,
                    notes: newContact.notes || null
                })

            if (error) throw error

            showToast('Kişi başarıyla eklendi!', 'success')
            setNewContact({ phone_number: '', name: '', notes: '' })
            setShowAddForm(false)
            loadContacts()
        } catch (error) {
            console.error('Error adding contact:', error)
            showToast('Kişi eklenirken hata oluştu', 'error')
        }
    }

    const handleEditContact = async (contact: Contact) => {
        const newName = await showPrompt({
            title: 'Kişiyi Düzenle',
            message: 'Yeni isim:',
            defaultValue: contact.name
        })

        if (!newName) return

        try {
            const { error } = await supabase
                .from('contacts')
                .update({ name: newName })
                .eq('id', contact.id)

            if (error) throw error

            showToast('Kişi güncellendi!', 'success')
            loadContacts()
        } catch (error) {
            console.error('Error updating contact:', error)
            showToast('Güncelleme hatası', 'error')
        }
    }

    const handleDeleteContact = async (contact: Contact) => {
        const confirmed = await showConfirm({
            title: 'Kişiyi Sil',
            message: `"${contact.name}" kişisini silmek istediğinizden emin misiniz?`,
            confirmText: 'Sil',
            type: 'danger'
        })

        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contact.id)

            if (error) throw error

            showToast('Kişi silindi', 'success')
            loadContacts()
        } catch (error) {
            console.error('Error deleting contact:', error)
            showToast('Silme hatası', 'error')
        }
    }

    const handleExportCSV = () => {
        if (contacts.length === 0) {
            showToast('İndirilecek kişi yok', 'error')
            return
        }

        const csvContent = [
            ['İsim', 'Telefon', 'Notlar'].join(','),
            ...contacts.map(c => [
                `"${c.name}"`,
                c.phone_number,
                `"${c.notes || ''}"`
            ].join(','))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `kisiler_${new Date().toISOString().split('T')[0]}.csv`
        link.click()

        showToast(`${contacts.length} kişi indirildi!`, 'success')
    }

    const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string
                const lines = text.split('\n').slice(1)
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return

                let successCount = 0
                for (const line of lines) {
                    if (!line.trim()) continue

                    const [name, phone, notes] = line.split(',').map(s => s.replace(/^"|"$/g, '').trim())
                    if (!name || !phone) continue

                    const { error } = await supabase
                        .from('contacts')
                        .insert({
                            user_id: session.user.id,
                            phone_number: phone,
                            name: name,
                            notes: notes || null
                        })

                    if (!error) successCount++
                }

                showToast(`${successCount} kişi başarıyla yüklendi!`, 'success')
                loadContacts()
            } catch (error) {
                console.error('Error importing CSV:', error)
                showToast('CSV yükleme hatası', 'error')
            }
        }
        reader.readAsText(file)
        event.target.value = ''
    }

    const syncToDevice = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data: devices } = await supabase
            .from('devices')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)

        if (!devices || devices.length === 0) {
            showToast('Aktif cihaz bulunamadı', 'error')
            return
        }

        // Show device selection dialog
        let selectedDeviceId: string | null = null

        if (devices.length === 1) {
            // Only one device, use it directly
            selectedDeviceId = devices[0].id
        } else {
            // Multiple devices, let user choose
            const deviceOptions = devices.map(d => `${d.device_name} (${d.platform})`).join('\n')
            const deviceIndex = await showPrompt({
                title: 'Cihaz Seçin',
                message: `Hangi cihaza aktarılsın?\n\n${devices.map((d, i) => `${i + 1}. ${d.device_name} (${d.platform})`).join('\n')}\n\nNumara girin (1-${devices.length}):`,
                defaultValue: '1'
            })

            if (!deviceIndex) return

            const index = parseInt(deviceIndex) - 1
            if (index < 0 || index >= devices.length) {
                showToast('Geçersiz cihaz numarası', 'error')
                return
            }

            selectedDeviceId = devices[index].id
        }

        const selectedDevice = devices.find(d => d.id === selectedDeviceId)
        if (!selectedDevice) return

        const confirmed = await showConfirm({
            title: 'Telefona Aktar',
            message: `${contacts.length} kişi "${selectedDevice.device_name}" cihazına aktarılacak. Devam edilsin mi?`,
            confirmText: 'Aktar',
            type: 'info'
        })

        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('user_preferences')
                .update({
                    sync_contacts_requested: true,
                    sync_target_device_id: selectedDeviceId
                })
                .eq('user_id', session.user.id)

            if (error) throw error

            showToast(`Kişiler "${selectedDevice.device_name}" cihazına gönderildi! Birkaç saniye içinde senkronize edilecek.`, 'success')
        } catch (error) {
            console.error('Error syncing to device:', error)
            showToast('Aktarma hatası', 'error')
        }
    }

    const importFromPhone = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Get active devices
            const { data: devices } = await supabase
                .from('devices')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_online', true)
                .eq('platform', 'android')

            if (!devices || devices.length === 0) {
                showToast('Aktif Android cihaz bulunamadı', 'error')
                return
            }

            // If multiple devices, let user choose
            let selectedDeviceId = devices[0].device_id
            if (devices.length > 1) {
                const deviceNames = devices.map(d => d.device_name).join(', ')
                const deviceInput = await showPrompt({
                    title: 'Cihaz Seçin',
                    message: `Hangi cihazdan içe aktarılsın? (${deviceNames})`,
                    placeholder: devices[0].device_name,
                    defaultValue: devices[0].device_name
                })

                if (!deviceInput) return

                const selectedDevice = devices.find(d => d.device_name === deviceInput)
                if (!selectedDevice) {
                    showToast('Geçersiz cihaz adı', 'error')
                    return
                }
                selectedDeviceId = selectedDevice.device_id
            }

            const selectedDevice = devices.find(d => d.device_id === selectedDeviceId)
            if (!selectedDevice) return

            const confirmed = await showConfirm({
                title: 'Telefondan İçe Aktar',
                message: `"${selectedDevice.device_name}" cihazındaki rehber web'e aktarılacak. Mevcut kişiler korunacak, sadece yeni kişiler eklenecek. Devam edilsin mi?`,
                confirmText: 'İçe Aktar',
                type: 'info'
            })

            if (!confirmed) return

            // Set flag for Android to sync phone contacts
            const { error } = await supabase
                .from('user_preferences')
                .update({
                    import_phone_contacts_requested: true,
                    import_source_device_id: selectedDeviceId
                })
                .eq('user_id', session.user.id)

            if (error) throw error

            showToast(`"${selectedDevice.device_name}" cihazından içe aktarma başlatıldı! Birkaç saniye içinde yeni kişiler eklenecek.`, 'success')

            // Reload contacts after a delay
            setTimeout(() => {
                loadContacts()
            }, 5000)
        } catch (error) {
            console.error('Error importing from phone:', error)
            showToast('İçe aktarma hatası', 'error')
        }
    }

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone_number.includes(searchQuery)
    )

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Kişiler ({contacts.length})
                    </h2>
                    <div className="flex items-center gap-2">
                        <label className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all cursor-pointer flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            <span className="hidden sm:inline">CSV Yükle</span>
                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                        </label>
                        <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">CSV İndir</span>
                        </button>
                        <button onClick={importFromPhone} className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            <span className="hidden sm:inline">Telefondan İçe Aktar</span>
                        </button>
                        <button onClick={syncToDevice} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all flex items-center gap-2">
                            <Smartphone className="w-5 h-5" />
                            <span className="hidden sm:inline">Telefona Aktar</span>
                        </button>
                        <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Yeni Kişi</span>
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="İsim veya numara ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {showAddForm && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Kişi Ekle</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Numarası</label>
                            <input
                                type="tel"
                                placeholder="+90 555 123 4567"
                                value={newContact.phone_number}
                                onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                            <input
                                type="text"
                                placeholder="Ahmet Yılmaz"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (Opsiyonel)</label>
                            <textarea
                                rows={3}
                                placeholder="Ek bilgiler..."
                                value={newContact.notes}
                                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddContact} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg transition-all">
                                Kaydet
                            </button>
                            <button onClick={() => setShowAddForm(false)} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                                İptal
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
                {filteredContacts.length === 0 ? (
                    <div className="text-center py-12">
                        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">{searchQuery ? 'Kişi bulunamadı' : 'Henüz kişi eklenmemiş'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredContacts.map((contact) => (
                            <motion.div key={contact.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                                        <p className="text-sm text-gray-600">{contact.phone_number}</p>
                                        {contact.notes && <p className="text-xs text-gray-500 mt-1">{contact.notes}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditContact(contact)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors group">
                                        <Edit2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                    </button>
                                    <button onClick={() => handleDeleteContact(contact)} className="p-2 hover:bg-red-100 rounded-lg transition-colors group">
                                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
