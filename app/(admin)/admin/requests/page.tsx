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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock } from 'lucide-react'

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/')
    }
    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/requests')
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/admin/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: parseInt(duration) }),
      })

      if (response.ok) {
        setApproveDialog(false)
        setSelectedRequest(null)
        setDuration('2')
        fetchRequests()
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchRequests()
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
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
                          className="mr-2 text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(request.id)}
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
            <Button onClick={handleApprove}>Setujui</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}