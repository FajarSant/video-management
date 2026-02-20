'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { AlertCircle, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoAccess {
  id: string
  expiresAt: string
  video: {
    id: string
    title: string
    description: string | null
    url: string
  }
}

function getEmbedUrl(url: string) {
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }
  return null
}

function formatRemainingTime(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Kadaluarsa'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}j ${minutes}m tersisa`
}

export default function CustomerWatchPage() {
  const params = useParams<{ videoId: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [access, setAccess] = useState<VideoAccess | null>(null)
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
    const fetchAccess = async () => {
      try {
        setError(null)
        const response = await fetch('/api/customer/videos')
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Gagal memuat data video')
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Format data video tidak valid')
        }

        const matched = (data as VideoAccess[]).find((item) => item.video.id === params.videoId)
        if (!matched) {
          throw new Error('Akses video tidak tersedia atau sudah berakhir')
        }

        setAccess(matched)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    if (params.videoId) {
      fetchAccess()
    }
  }, [params.videoId, router])

  const embedUrl = useMemo(() => (access ? getEmbedUrl(access.video.url) : null), [access])

  if (loading) {
    return <div className="text-center py-10">Memuat video...</div>
  }

  if (error || !access) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 mb-4">{error || 'Video tidak ditemukan'}</p>
          <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{access.video.title}</CardTitle>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatRemainingTime(access.expiresAt)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {embedUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: '56.25%' }}>
              <iframe
                src={embedUrl}
                title={access.video.title}
                className="absolute top-0 left-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              className="w-full rounded-lg bg-black"
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              src={access.video.url}
              preload="metadata"
            >
              Browser Anda tidak mendukung pemutaran video.
            </video>
          )}

          <p className="text-sm text-gray-600">
            {access.video.description || 'Tidak ada deskripsi video.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
