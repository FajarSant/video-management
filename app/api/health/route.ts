import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      service: 'video-management',
      database: 'connected',
      timestamp,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'video-management',
        database: 'disconnected',
        timestamp,
      },
      { status: 500 }
    )
  }
}
