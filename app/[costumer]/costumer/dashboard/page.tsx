// app/customer/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Clock, AlertCircle } from 'lucide-react'

interface VideoAccess {
  id: string
  video: {
    id: string
    title: string
    description: string
    thumbnailUrl: string
    url: string
  }
  grantedAt: string
  expiresAt: string
  isActive: boolean
}

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoAccess[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'CUSTOMER') {
      router.push('/')
    }
    fetchVideos()
  }, [session, status, router])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/customer/videos')
      const data = await response.json()
      setVideos(data)
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Kadaluarsa'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}j ${minutes}m tersisa`
  }

  if (loading) {
    return <div className="text-center py-10">Memuat...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Video Saya</h1>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada video tersedia</h3>
              <p className="mt-1 text-sm text-gray-500">
                Anda belum memiliki video untuk ditonton. Minta akses dari admin.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((access) => {
            const isExpired = new Date(access.expiresAt) < new Date()
            
            return (
              <Card key={access.id} className={isExpired ? 'opacity-60' : ''}>
                <CardHeader className="p-0">
                  {access.video.thumbnailUrl && (
                    <img
                      src={access.video.thumbnailUrl}
                      alt={access.video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2">{access.video.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 mb-4">
                    {access.video.description}
                  </CardDescription>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {getTimeRemaining(access.expiresAt)}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  {!isExpired ? (
                    <Button 
                      className="w-full"
                      onClick={() => window.open(access.video.url, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Tonton Sekarang
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/customer/requests')}
                    >
                      Minta Akses
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}