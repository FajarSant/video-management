import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function validateVideoPayload(payload: {
  title?: unknown
  url?: unknown
  description?: unknown
  duration?: unknown
  thumbnailUrl?: unknown
}) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const url = typeof payload.url === 'string' ? payload.url.trim() : ''
  const description =
    typeof payload.description === 'string' ? payload.description.trim() || null : null
  const thumbnailUrl =
    typeof payload.thumbnailUrl === 'string' ? payload.thumbnailUrl.trim() || null : null

  let duration: number | null = null
  if (payload.duration !== null && payload.duration !== undefined && payload.duration !== '') {
    const parsed = Number(payload.duration)
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: 'Duration must be a non-negative integer' as const }
    }
    duration = parsed
  }

  if (!title) {
    return { error: 'Title is required' as const }
  }

  if (!url) {
    return { error: 'URL is required' as const }
  }

  return {
    data: {
      title,
      url,
      description,
      duration,
      thumbnailUrl,
    },
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const validated = validateVideoPayload(payload)
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const video = await prisma.video.create({
      data: validated.data,
    })

    return NextResponse.json(video, { status: 201 })
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
  }
}
