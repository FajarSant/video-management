'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, FileVideo, Image, CheckCircle } from 'lucide-react'
import Swal from 'sweetalert2'

interface FileUploaderProps {
  type: 'video' | 'thumbnail'
  onFileChange: (file: File | null) => void
  maxSize?: number
}

export function FileUploader({
  type,
  onFileChange,
  maxSize = type === 'video' ? 100 : 5,
}: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize * 1024 * 1024) {
      Swal.fire({
        title: 'Error!',
        text: `File terlalu besar. Maksimal ${maxSize}MB`,
        icon: 'error',
        confirmButtonText: 'OK',
      })
      return
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      Swal.fire({
        title: 'Error!',
        text: 'File harus berupa video',
        icon: 'error',
        confirmButtonText: 'OK',
      })
      return
    }

    if (type === 'thumbnail' && !file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Error!',
        text: 'File harus berupa gambar',
        icon: 'error',
        confirmButtonText: 'OK',
      })
      return
    }

    if (type === 'thumbnail') {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    setSelectedFile(file)
    onFileChange(file)
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreview(null)
    onFileChange(null)
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
        disabled={!!selectedFile}
        className="hidden"
      />

      <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
        {!selectedFile && (
          <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Klik untuk pilih file</p>
            <p className="text-xs text-gray-500 mt-1">
              {type === 'video' ? 'Max 100MB' : 'Max 5MB'} - diupload saat klik Simpan
            </p>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {type === 'video' ? (
                <FileVideo className="h-5 w-5 text-blue-500" />
              ) : (
                <Image className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm truncate flex-1">{selectedFile.name}</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            {type === 'thumbnail' && preview && (
              <img src={preview} alt="Preview" className="w-20 h-20 object-cover rounded" />
            )}

            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
              File belum diupload. Upload akan dilakukan saat Anda klik Simpan/Perbarui.
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Ganti File
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
