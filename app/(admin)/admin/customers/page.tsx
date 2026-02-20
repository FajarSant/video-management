// app/admin/customers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Edit, Trash2, Plus, Search, RefreshCw, AlertCircle } from 'lucide-react'
import Swal from 'sweetalert2'

interface Customer {
  id: string
  name: string
  email: string
  createdAt: string
}

export default function AdminCustomersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
    }
    fetchCustomers()
  }, [session, status, router])

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [customers, searchTerm])

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/customers')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      setError('Gagal memuat pelanggan. Silakan coba lagi.')
      Swal.fire({
        title: 'Kesalahan!',
        text: 'Gagal memuat pelanggan. Silakan coba lagi.',
        icon: 'error',
        confirmButtonText: 'OK'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Nama wajib diisi'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email tidak valid'
    }

    if (!editingCustomer && !formData.password) {
      errors.password = 'Kata sandi wajib diisi'
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Kata sandi minimal 6 karakter'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi form
    if (!validateForm()) {
      return
    }

    try {
      const url = editingCustomer 
        ? `/api/admin/customers/${editingCustomer.id}`
        : '/api/admin/customers'
      
      const method = editingCustomer ? 'PUT' : 'POST'
      
      // Log data yang akan dikirim
      console.log('Sending data:', {
        url,
        method,
        data: {
          name: formData.name,
          email: formData.email,
          password: formData.password ? '***' : undefined
        }
      })

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password || undefined,
        }),
      })

      const data = await response.json()
      console.log('Response:', { status: response.status, data })

      if (response.ok) {
        setDialogOpen(false)
        resetForm()
        fetchCustomers()
        
        Swal.fire({
          title: 'Berhasil!',
          text: editingCustomer 
            ? 'Pelanggan telah diperbarui dengan sukses' 
            : 'Pelanggan baru telah dibuat dengan sukses',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        // Tampilkan error detail dari server
        Swal.fire({
          title: 'Kesalahan!',
          text: data.error || data.details || 'Gagal menyimpan pelanggan',
          icon: 'error',
          confirmButtonText: 'OK'
        })
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      Swal.fire({
        title: 'Kesalahan!',
        text: 'Terjadi kesalahan yang tidak terduga',
        icon: 'error',
        confirmButtonText: 'OK'
      })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus ${name}. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/customers/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchCustomers()
          Swal.fire({
            title: 'Dihapus!',
            text: 'Pelanggan telah dihapus dengan sukses',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          const data = await response.json()
          Swal.fire({
            title: 'Kesalahan!',
            text: data.error || 'Gagal menghapus pelanggan',
            icon: 'error',
            confirmButtonText: 'OK'
          })
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        Swal.fire({
          title: 'Kesalahan!',
          text: 'Terjadi kesalahan yang tidak terduga',
          icon: 'error',
          confirmButtonText: 'OK'
        })
      }
    }
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      password: '',
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      email: '',
      password: '',
    })
    setFormErrors({})
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat pelanggan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kesalahan</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pelanggan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pantau semua akun pelanggan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Segarkan
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan nama atau email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              Total: {customers.length} pelanggan
            </p>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Nama</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Tanggal Bergabung</TableHead>
                  <TableHead className="font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada pelanggan ditemukan</p>
                        <p className="text-sm">Coba sesuaikan pencarian Anda</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{formatDate(customer.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id, customer.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm()
        setDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer 
                ? 'Perbarui informasi pelanggan. Biarkan kata sandi kosong untuk mempertahankan kata sandi saat ini.'
                : 'Isi detail untuk membuat akun pelanggan baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={formErrors.email ? 'border-red-500' : ''}
                  required
                />
                {formErrors.email && (
                  <p className="text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingCustomer ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={formErrors.password ? 'border-red-500' : ''}
                  required={!editingCustomer}
                />
                {formErrors.password && (
                  <p className="text-xs text-red-500">{formErrors.password}</p>
                )}
                {editingCustomer && (
                  <p className="text-xs text-gray-500">
                    Biarkan kosong untuk mempertahankan kata sandi saat ini
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                resetForm()
                setDialogOpen(false)
              }}>
                Batal
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Perbarui' : 'Buat'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}