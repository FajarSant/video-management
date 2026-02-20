import { NextResponse } from 'next/server'
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

    const availableVideos = await prisma.video.findMany({
      where: {
        AND: [
          {
            accessRequests: {
              none: {
                userId: session.user.id,
                status: 'PENDING',
              },
            },
          },
          {
            videoAccesses: {
              none: {
                userId: session.user.id,
                isActive: true,
                expiresAt: { gt: now },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(availableVideos)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
