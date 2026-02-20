import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (type !== 'video' && type !== 'thumbnail') {
      return NextResponse.json({ error: 'Invalid upload type' }, { status: 400 })
    }

    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Max size ${type === 'video' ? '100MB' : '5MB'}` },
        { status: 400 }
      )
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be a video' }, { status: 400 })
    }

    if (type === 'thumbnail' && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const folder = type === 'video' ? 'videos' : 'thumbnails'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    await mkdir(uploadDir, { recursive: true })

    const ext = path.extname(file.name)
    const baseName = path.basename(file.name, ext)
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const fileName = `${baseName}_${uniqueSuffix}${ext}`.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(uploadDir, fileName)

    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${folder}/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
