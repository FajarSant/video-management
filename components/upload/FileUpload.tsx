// components/upload/FileUploader.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, FileVideo, Image, Loader2, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'

interface UploadedFile {
  url: string
  fileName: string
  originalName: string
  size: number
}

interface FileUploaderProps {
  type: 'video' | 'thumbnail'
  onUploadSuccess: (fileData: UploadedFile) => void
  onUploadError?: (error: string) => void
  maxSize?: number
}

export function FileUploader({ 
  type, 
  onUploadSuccess, 
  onUploadError,
  maxSize = type === 'video' ? 100 : 5,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi ukuran
    if (file.size > maxSize * 1024 * 1024) {
      Swal.fire({
        title: 'Error!',
        text: `File terlalu besar. Maksimal ${maxSize}MB`,
        icon: 'error',
        confirmButtonText: 'OK'
      })
      return
    }

    // Preview untuk thumbnail
    if (type === 'thumbnail') {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      console.log('Uploading to /api/admin/upload-file...')

      const response = await fetch('/api/admin/upload-file', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status}`
        try {
          const errorResult = await response.json()
          if (errorResult?.error) {
            errorMessage = errorResult.error
          }
        } catch {
          // Keep fallback error message when response is not JSON.
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Upload success:', result)

      setUploadedFile({
        url: result.url,
        fileName: result.fileName,
        originalName: result.originalName,
        size: result.size
      })

      onUploadSuccess({
        url: result.url,
        fileName: result.fileName,
        originalName: result.originalName,
        size: result.size
      })

      Swal.fire({
        title: 'Berhasil!',
        text: 'File berhasil diupload',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })

    } catch (error) {
      console.error('Upload error:', error)
      setPreview(null)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
      
      Swal.fire({
        title: 'Error!',
        text: 'Gagal mengupload file',
        icon: 'error',
        confirmButtonText: 'OK'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setUploadedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <Label>{type === 'video' ? 'Upload Video' : 'Upload Thumbnail'}</Label>
      
      <Input
        ref={fileInputRef}
        type="file"
        accept={type === 'video' ? 'video/*' : 'image/*'}
        onChange={handleFileSelect}
        disabled={uploading || !!uploadedFile}
        className="hidden"
      />

      <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
        {!uploadedFile && !uploading && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer text-center"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Klik untuk pilih file</p>
            <p className="text-xs text-gray-500 mt-1">
              {type === 'video' ? 'Max 100MB' : 'Max 5MB'}
            </p>
          </div>
        )}

        {uploading && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-sm">Mengupload...</p>
          </div>
        )}

        {uploadedFile && !uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {type === 'video' ? (
                <FileVideo className="h-5 w-5 text-blue-500" />
              ) : (
                <Image className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm truncate flex-1">{uploadedFile.originalName}</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            {type === 'thumbnail' && preview && (
              <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Ganti File
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
