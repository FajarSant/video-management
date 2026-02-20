'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, RefreshCw } from 'lucide-react'
import Swal from 'sweetalert2'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AvailableVideo {
  id: string
  title: string
  thumbnailUrl: string | null
}

interface AccessRequest {
  id: string
  requestedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  duration: number | null
  expiresAt: string | null
  video: {
    id: string
    title: string
    thumbnailUrl: string | null
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID')
}

function getStatusBadge(status: AccessRequest['status']) {
  if (status === 'PENDING') {
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Menunggu</Badge>
  }
  if (status === 'APPROVED') {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Disetujui</Badge>
  }
  if (status === 'REJECTED') {
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>
  }
  return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Kadaluarsa</Badge>
}

export default function CustomerRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [videos, setVideos] = useState<AvailableVideo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role && session.user.role !== 'CUSTOMER') {
      router.push('/unauthorized')
    }
  }, [session, status, router])

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [requestsRes, videosRes] = await Promise.all([
        fetch('/api/customer/requests'),
        fetch('/api/customer/available-videos'),
      ])

      if (!requestsRes.ok || !videosRes.ok) {
        throw new Error('Gagal memuat data request customer')
      }

      const requestsData = await requestsRes.json()
      const videosData = await videosRes.json()

      setRequests(Array.isArray(requestsData) ? requestsData : [])
      setVideos(Array.isArray(videosData) ? videosData : [])
    } catch (error) {
      console.error('Error fetching customer data:', error)
      Swal.fire({
        title: 'Kesalahan!',
        text: error instanceof Error ? error.message : 'Gagal memuat data',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'PENDING').length,
    [requests]
  )

  const handleRequestAccess = async () => {
    if (!selectedVideoId) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/customer/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideoId }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Gagal mengirim request')
      }

      setSelectedVideoId('')
      await fetchData(true)

      Swal.fire({
        title: 'Berhasil!',
        text: 'Request akses video berhasil dikirim ke admin',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (error) {
      Swal.fire({
        title: 'Kesalahan!',
        text: error instanceof Error ? error.message : 'Gagal mengirim request',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-10">Memuat request customer...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Request Akses Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ajukan akses baru, pantau status, dan request ulang saat akses berakhir.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Segarkan
        </Button>
      </div>

      <Card>
        <CardContent className="py-4 text-sm text-gray-700">
          Request menunggu persetujuan admin: <span className="font-semibold">{pendingCount}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajukan Request Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih video yang ingin diakses" />
              </SelectTrigger>
              <SelectContent>
                {videos.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    Tidak ada video yang bisa direquest
                  </SelectItem>
                ) : (
                  videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={handleRequestAccess}
              disabled={!selectedVideoId || submitting}
              className="md:w-auto w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {submitting ? 'Mengirim...' : 'Kirim Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Waktu Request</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Kadaluarsa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                    Belum ada request.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.video.title}</TableCell>
                    <TableCell>{formatDateTime(request.requestedAt)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{request.duration ? `${request.duration} jam` : '-'}</TableCell>
                    <TableCell>{formatDateTime(request.expiresAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
