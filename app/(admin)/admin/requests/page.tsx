// app/admin/requests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock } from 'lucide-react'
import Swal from 'sweetalert2'

interface AccessRequest {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  video: {
    id: string
    title: string
  }
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  requestedAt: string
  duration?: number
  expiresAt?: string
}

export default function AdminRequests() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [approveDialog, setApproveDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [duration, setDuration] = useState('2') // default 2 hours
  const [error, setError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [submittingApprove, setSubmittingApprove] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
    }
    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    setError(null)
    try {
      const response = await fetch('/api/admin/requests')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Gagal memuat data request')
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Format response tidak valid')
      }
      setRequests(data as AccessRequest[])
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    const parsedDuration = parseInt(duration, 10)
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      Swal.fire({
        title: 'Kesalahan!',
        text: 'Durasi tidak valid',
        icon: 'error',
        confirmButtonText: 'OK',
      })
      return
    }

    setSubmittingApprove(true)
    try {
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: parsedDuration }),
      })

      const data = await response.json()
      if (response.ok) {
        setApproveDialog(false)
        setSelectedRequest(null)
        setDuration('2')
        await fetchRequests()
        Swal.fire({
          title: 'Berhasil!',
          text: 'Permintaan berhasil disetujui',
          icon: 'success',
          timer: 1800,
          showConfirmButton: false,
        })
      } else {
        throw new Error(data?.error || 'Gagal menyetujui request')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      Swal.fire({
        title: 'Kesalahan!',
        text: error instanceof Error ? error.message : 'Gagal menyetujui request',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      setSubmittingApprove(false)
    }
  }

  const handleReject = async (requestId: string) => {
    setActionLoadingId(requestId)
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
      })

      const data = await response.json()
      if (response.ok) {
        await fetchRequests()
      } else {
        throw new Error(data?.error || 'Gagal menolak request')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      Swal.fire({
        title: 'Kesalahan!',
        text: error instanceof Error ? error.message : 'Gagal menolak request',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Tertunda</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Disetujui</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Ditolak</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Kadaluarsa</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div className="text-center py-10">Memuat...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Permintaan Akses</h1>

      <Card>
        <CardHeader>
          <CardTitle>Permintaan Akses Video</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Diminta Pada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Kadaluarsa</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Belum ada request akses.
                  </TableCell>
                </TableRow>
              )}
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user.name}</div>
                      <div className="text-sm text-gray-500">{request.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.video.title}</TableCell>
                  <TableCell>{new Date(request.requestedAt).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.duration ? `${request.duration} hours` : '-'}
                  </TableCell>
                  <TableCell>
                    {request.expiresAt 
                      ? new Date(request.expiresAt).toLocaleString() 
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setApproveDialog(true)
                          }}
                          disabled={actionLoadingId === request.id}
                          className="mr-2 text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoadingId === request.id}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {request.status === 'APPROVED' && (
                      <Clock className="h-4 w-4 text-green-600" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Permintaan Akses</DialogTitle>
            <DialogDescription>
              Tetapkan durasi untuk akses video. Pelanggan akan dapat menonton video selama durasi ini.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Durasi Akses (jam)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 jam</SelectItem>
                  <SelectItem value="2">2 jam</SelectItem>
                  <SelectItem value="4">4 jam</SelectItem>
                  <SelectItem value="8">8 jam</SelectItem>
                  <SelectItem value="24">24 jam</SelectItem>
                  <SelectItem value="48">48 jam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={submittingApprove}>
              {submittingApprove ? 'Menyetujui...' : 'Setujui'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
