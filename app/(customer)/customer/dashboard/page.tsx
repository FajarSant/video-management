'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertCircle, Clock, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface VideoAccess {
  id: string
  expiresAt: string
  video: {
    id: string
    title: string
    description: string | null
    thumbnailUrl: string | null
    url: string
  }
}

function formatRemainingTime(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Kadaluarsa'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}j ${minutes}m tersisa`
}

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role && session.user.role !== 'CUSTOMER') {
      router.push('/unauthorized')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchVideos = async () => {
      setError(null)
      try {
        const response = await fetch('/api/customer/videos')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Gagal memuat video')
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Format data video tidak valid')
        }
        setVideos(data as VideoAccess[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [router])

  const totalActive = useMemo(() => videos.length, [videos])

  if (loading) {
    return <div className="text-center py-10">Memuat video...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Video Saya</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tonton video yang sudah disetujui admin sesuai durasi akses.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-gray-700">
            Akses aktif saat ini: <span className="font-semibold">{totalActive}</span> video
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="font-medium text-gray-900">Belum ada video aktif</p>
            <p className="text-sm text-gray-500 mt-1">
              Ajukan request akses video terlebih dahulu.
            </p>
            <Button className="mt-4" onClick={() => router.push('/customer/requests')}>
              Buka Halaman Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {videos.map((access) => (
            <Card key={access.id}>
              <CardHeader className="p-0">
                {access.video.thumbnailUrl ? (
                  <img
                    src={access.video.thumbnailUrl}
                    alt={access.video.title}
                    className="w-full h-44 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-44 bg-gray-200 rounded-t-lg" />
                )}
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <CardTitle className="text-lg">{access.video.title}</CardTitle>
                <CardDescription>
                  {access.video.description || 'Tidak ada deskripsi video.'}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    AKTIF
                  </Badge>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRemainingTime(access.expiresAt)}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => router.push(`/customer/watch/${access.video.id}`)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Tonton Video
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
