// app/api/customer/videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  if (!session || session.user?.role !== 'CUSTOMER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const videoAccesses = await prisma.videoAccess.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        video: true,
      },
      orderBy: { grantedAt: 'desc' },
    })

    return NextResponse.json(videoAccesses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}