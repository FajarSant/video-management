// app/api/customer/available-videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get videos that the user hasn't requested yet
    const userRequests = await prisma.accessRequest.findMany({
      where: { userId: session.user.id },
      select: { videoId: true },
    })

    const requestedVideoIds = userRequests.map(r => r.videoId)

    const availableVideos = await prisma.video.findMany({
      where: {
        NOT: {
          id: { in: requestedVideoIds },
        },
      },
      select: {
        id: true,
        title: true,
      },
    })

    return NextResponse.json(availableVideos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}