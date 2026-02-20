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

async function authorizeAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return false
  }
  return true
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const payload = await request.json()
    const validated = validateVideoPayload(payload)
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const updated = await prisma.video.update({
      where: { id },
      data: validated.data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await authorizeAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
