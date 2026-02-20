// app/api/cron/check-expired/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // You might want to add a secret key check here for security
  // const authHeader = request.headers.get('authorization')
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const now = new Date()

    // Update expired video accesses
    await prisma.videoAccess.updateMany({
      where: {
        expiresAt: { lt: now },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })

    // Update expired access requests
    await prisma.accessRequest.updateMany({
      where: {
        expiresAt: { lt: now },
        status: 'APPROVED',
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check expired accesses' }, { status: 500 })
  }
}