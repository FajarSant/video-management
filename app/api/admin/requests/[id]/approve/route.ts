import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const duration = Number.parseInt(String(body?.duration ?? '2'), 10)

    if (!Number.isInteger(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 })
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        videoId: true,
        status: true,
      },
    })

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (accessRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending request can be approved' },
        { status: 400 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.accessRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: now,
          duration,
          expiresAt,
        },
      }),
      prisma.videoAccess.upsert({
        where: {
          userId_videoId: {
            userId: accessRequest.userId,
            videoId: accessRequest.videoId,
          },
        },
        update: {
          expiresAt,
          isActive: true,
          grantedAt: now,
        },
        create: {
          userId: accessRequest.userId,
          videoId: accessRequest.videoId,
          expiresAt,
          isActive: true,
          grantedAt: now,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving request:', error)
    return NextResponse.json({ error: 'Failed to approve request' }, { status: 500 })
  }
}
