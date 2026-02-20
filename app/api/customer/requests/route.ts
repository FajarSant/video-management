import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    await prisma.accessRequest.updateMany({
      where: {
        userId: session.user.id,
        status: 'APPROVED',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    })

    const requests = await prisma.accessRequest.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { videoId } = await request.json()
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 })
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true },
    })
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const existingRequest = await prisma.accessRequest.findUnique({
      where: {
        userId_videoId_status: {
          userId: session.user.id,
          videoId,
          status: 'PENDING',
        },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Request already exists' },
        { status: 400 }
      )
    }

    const now = new Date()
    const activeAccess = await prisma.videoAccess.findFirst({
      where: {
        userId: session.user.id,
        videoId,
        isActive: true,
        expiresAt: { gt: now },
      },
      select: { id: true },
    })

    if (activeAccess) {
      return NextResponse.json(
        { error: 'You already have active access for this video' },
        { status: 400 }
      )
    }

    const request_ = await prisma.accessRequest.create({
      data: {
        userId: session.user.id,
        videoId,
        status: 'PENDING',
      },
    })

    return NextResponse.json(request_)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
