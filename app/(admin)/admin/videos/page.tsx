// app/admin/videos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Edit, Trash2, Plus, Eye, Search, RefreshCw, AlertCircle, Video as VideoIcon, Link as LinkIcon, Upload } from 'lucide-react'
import Swal from 'sweetalert2'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUploader } from '@/components/upload/FileUpload'

interface Video {
  id: string
  title: string
  description: string | null
  url: string
  duration: number | null
  thumbnailUrl: string | null
  createdAt: string
}

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  size: number
}

export default function AdminVideosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'link'>('upload')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    duration: '',
    thumbnailUrl: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Cek autentikasi
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    if (session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized')
    }
    fetchVideos()
  }, [session, status, router])

  // Filter video berdasarkan pencarian
  useEffect(() => {
    if (searchTerm) {
      const filtered = videos.filter(video => 
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredVideos(filtered)
    } else {
      setFilteredVideos(videos)
    }
  }, [videos, searchTerm])

  // Ambil data video
  const fetchVideos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/videos')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setVideos(data)
      } else {
        console.error('Data is not an array:', data)
        setVideos([])
        setError('Format data tidak valid')
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
      setError('Gagal memuat video. Silakan coba lagi.')
      Swal.fire({
        title: 'Kesalahan!',
        text: 'Gagal memuat video. Silakan coba lagi.',
        icon: 'error',
        confirmButtonText: 'OK'
      })
    } finally {
      setLoading(false)
    }
  }

  // Validasi form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = 'Judul wajib diisi'
    }

    if (uploadMethod === 'link' && !formData.url.trim()) {
      errors.url = 'URL video wajib diisi'
    }

    if (uploadMethod === 'upload' && !editingVideo && !selectedVideoFile) {
      errors.url = 'File video wajib dipilih'
    }

    if (formData.duration && isNaN(Number(formData.duration))) {
      errors.duration = 'Durasi harus berupa angka'
    } else if (formData.duration && Number(formData.duration) < 0) {
      errors.duration = 'Durasi tidak boleh negatif'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const uploadFile = async (type: 'video' | 'thumbnail', file: File): Promise<UploadedFile> => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('type', type)

    const uploadResponse = await fetch('/api/admin/upload-file', {
      method: 'POST',
      body: uploadFormData,
    })

    const uploadResult = await uploadResponse.json()
    if (!uploadResponse.ok) {
      throw new Error(uploadResult?.error || `Upload ${type} gagal`)
    }

    return {
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      originalName: uploadResult.originalName,
      size: uploadResult.size,
    }
  }

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      let finalVideoUrl = uploadMethod === 'link' ? formData.url.trim() : (editingVideo?.url || '')
      let finalThumbnailUrl = formData.thumbnailUrl.trim() || null

      if (selectedVideoFile) {
        const uploadedVideo = await uploadFile('video', selectedVideoFile)
        finalVideoUrl = uploadedVideo.url
      }

      if (uploadMethod === 'upload' && !finalVideoUrl) {
        throw new Error('File video wajib dipilih')
      }

      if (selectedThumbnailFile) {
        const uploadedThumbnail = await uploadFile('thumbnail', selectedThumbnailFile)
        finalThumbnailUrl = uploadedThumbnail.url
      } else if (editingVideo) {
        finalThumbnailUrl = finalThumbnailUrl || editingVideo.thumbnailUrl || null
      }

      const url = editingVideo ? `/api/admin/videos/${editingVideo.id}` : '/api/admin/videos'
      const method = editingVideo ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          url: finalVideoUrl,
          duration: formData.duration ? parseInt(formData.duration, 10) : null,
          thumbnailUrl: finalThumbnailUrl,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setDialogOpen(false)
        resetForm()
        fetchVideos()

        Swal.fire({
          title: 'Berhasil!',
          text: editingVideo
            ? 'Video telah diperbarui dengan sukses'
            : 'Video baru telah ditambahkan dengan sukses',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        })
      } else {
        Swal.fire({
          title: 'Kesalahan!',
          text: data.error || data.details || 'Gagal menyimpan video',
          icon: 'error',
          confirmButtonText: 'OK',
        })
      }
    } catch (error) {
      console.error('Error saving video:', error)
      Swal.fire({
        title: 'Kesalahan!',
        text: error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak terduga',
        icon: 'error',
        confirmButtonText: 'OK',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle hapus video
  const handleDelete = async (id: string, title: string) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: `Anda akan menghapus video "${title}". Tindakan ini tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/videos/${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchVideos()
          Swal.fire({
            title: 'Dihapus!',
            text: 'Video telah dihapus dengan sukses',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        } else {
          const data = await response.json()
          Swal.fire({
            title: 'Kesalahan!',
            text: data.error || 'Gagal menghapus video',
            icon: 'error',
            confirmButtonText: 'OK'
          })
        }
      } catch (error) {
        console.error('Error deleting video:', error)
        Swal.fire({
          title: 'Kesalahan!',
          text: 'Terjadi kesalahan yang tidak terduga',
          icon: 'error',
          confirmButtonText: 'OK'
        })
      }
    }
  }

  // Buka dialog edit
  const openEditDialog = (video: Video) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description || '',
      url: video.url,
      duration: video.duration?.toString() || '',
      thumbnailUrl: video.thumbnailUrl || '',
    })
    setFormErrors({})
    setDialogOpen(true)
    setSelectedVideoFile(null)
    setSelectedThumbnailFile(null)
  }

  // Reset form
  const resetForm = () => {
    setEditingVideo(null)
    setFormData({
      title: '',
      description: '',
      url: '',
      duration: '',
      thumbnailUrl: '',
    })
    setFormErrors({})
    setSelectedVideoFile(null)
    setSelectedThumbnailFile(null)
  }

  // Format durasi
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}j ${minutes}m ${remainingSeconds}d`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}d`
    } else {
      return `${seconds}d`
    }
  }

  // Format tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Ekstrak ID video dari URL YouTube
  const getYouTubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  // Tampilkan loading saat cek session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  // Tampilkan error jika bukan admin
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Akses Ditolak</h3>
          <p className="text-gray-500 mb-4">Anda tidak memiliki akses ke halaman ini.</p>
          <Button onClick={() => router.push('/')}>
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    )
  }

  // Tampilkan loading data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Memuat video...</p>
        </div>
      </div>
    )
  }

  // Tampilkan error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kesalahan</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchVideos}>
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
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Video</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola dan pantau semua konten video
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVideos}
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
            Tambah Video
          </Button>
        </div>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Konten tersedia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Durasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(videos.reduce((acc, v) => acc + (v.duration || 0), 0) / 3600)} jam
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Waktu tontonan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rata-rata Durasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.length > 0 
                ? Math.floor(videos.reduce((acc, v) => acc + (v.duration || 0), 0) / videos.length / 60) 
                : 0} menit
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per video
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dengan Thumbnail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {videos.filter(v => v.thumbnailUrl).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((videos.filter(v => v.thumbnailUrl).length / videos.length) * 100) || 0}% dari total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pencarian */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daftar Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari berdasarkan judul atau deskripsi..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              Total: {videos.length} video
            </p>
          </div>

          {/* Tabel Video */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Thumbnail</TableHead>
                  <TableHead className="font-semibold">Judul</TableHead>
                  <TableHead className="font-semibold">Durasi</TableHead>
                  <TableHead className="font-semibold">Tanggal Ditambahkan</TableHead>
                  <TableHead className="font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        <VideoIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada video ditemukan</p>
                        <p className="text-sm">Coba sesuaikan pencarian Anda</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVideos.map((video) => (
                    <TableRow key={video.id} className="hover:bg-gray-50">
                      <TableCell>
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={video.title}
                            className="w-20 h-12 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x48?text=Error'
                            }}
                          />
                        ) : (
                          <div className="w-20 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <VideoIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{video.title}</p>
                          {video.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDuration(video.duration)}</TableCell>
                      <TableCell>{formatDate(video.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getYouTubeEmbedUrl(video.url), '_blank')}
                          className="mr-1"
                          title="Tonton video"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(video)}
                          className="mr-1"
                          title="Edit video"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video.id, video.title)}
                          title="Hapus video"
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

      {/* Dialog Tambah/Edit Video */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) resetForm()
        setDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? 'Edit Video' : 'Tambah Video Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingVideo 
                ? 'Perbarui informasi video di bawah ini.'
                : 'Isi detail video untuk menambahkan konten baru. File akan diupload dan disimpan di server.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Judul */}
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Judul <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={formErrors.title ? 'border-red-500' : ''}
                  placeholder="Contoh: Tutorial Next.js untuk Pemula"
                />
                {formErrors.title && (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Jelaskan tentang video ini..."
                />
              </div>

              {/* Metode Upload Video */}
              <div className="grid gap-2">
                <Label>Metode Upload Video</Label>
                <Tabs defaultValue="upload" onValueChange={(v) => setUploadMethod(v as 'upload' | 'link')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="link">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <FileUploader
                      type="video"
                      onFileChange={setSelectedVideoFile}
                      maxSize={100}
                    />
</TabsContent>
                  <TabsContent value="link" className="mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="url">
                        URL Video <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className={formErrors.url ? 'border-red-500' : ''}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {formErrors.url && (
                        <p className="text-xs text-red-500">{formErrors.url}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        URL dari YouTube, Vimeo, atau platform video lainnya
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Upload Thumbnail */}
              <div className="grid gap-2">
                <FileUploader
                  type="thumbnail"
                  onFileChange={setSelectedThumbnailFile}
                  maxSize={5}
                />
</div>

              {/* Durasi */}
              <div className="grid gap-2">
                <Label htmlFor="duration">Durasi (detik)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className={formErrors.duration ? 'border-red-500' : ''}
                  placeholder="Contoh: 3600 (untuk 1 jam)"
                />
                {formErrors.duration && (
                  <p className="text-xs text-red-500">{formErrors.duration}</p>
                )}
              </div>

              {/* Preview jika menggunakan link */}
              {uploadMethod === 'link' && formData.url && (
                <div className="mt-2">
                  <Label>Preview Video</Label>
                  <div className="mt-1 border rounded-lg p-2 bg-gray-50">
                    <p className="text-sm text-gray-600 break-all">{formData.url}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Dialog */}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                resetForm()
                setDialogOpen(false)
              }}>
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={submitting || (uploadMethod === 'upload' && !selectedVideoFile && !editingVideo)}
              >
                {submitting ? 'Menyimpan...' : editingVideo ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

