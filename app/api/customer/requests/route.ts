// app/api/customer/requests/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requests = await prisma.accessRequest.findMany({
      where: { userId: session.user.id },
      include: {
        video: {
          select: {
            id: true,
            title: true,
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
  const session = await getServerSession()
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { videoId } = await request.json()

    // Check if request already exists
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