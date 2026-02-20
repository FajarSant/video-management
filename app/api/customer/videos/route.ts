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

    // Keep status up to date so customer can request ulang after expiry.
    await prisma.videoAccess.updateMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { lte: now },
      },
      data: {
        isActive: false,
      },
    })

    await prisma.accessRequest.updateMany({
      where: {
        userId: session.user.id,
        status: 'APPROVED',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    const videoAccesses = await prisma.videoAccess.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { gt: now },
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
