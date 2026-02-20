// app/customer/requests/page.tsx
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface Video {
  id: string
  title: string
}

interface Request {
  id: string
  video: Video
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  requestedAt: string
  approvedAt?: string
  expiresAt?: string
  duration?: number
}

export default function CustomerRequests() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'CUSTOMER') {
      router.push('/')
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [requestsRes, videosRes] = await Promise.all([
        fetch('/api/customer/requests'),
        fetch('/api/customer/available-videos'),
      ])
      
      const requestsData = await requestsRes.json()
      const videosData = await videosRes.json()
      
      setRequests(requestsData)
      setVideos(videosData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAccess = async () => {
    if (!selectedVideo) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/customer/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedVideo }),
      })

      if (response.ok) {
        setSelectedVideo('')
        fetchData()
      }
    } catch (error) {
      console.error('Error requesting access:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div className="text-center py-10">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Access Requests</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Request New Access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a video" />
              </SelectTrigger>
              <SelectContent>
                {videos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRequestAccess} 
              disabled={!selectedVideo || submitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Access
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Expires At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.video.title}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}