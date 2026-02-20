// app/api/admin/requests/[id]/reject/route.ts
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

    const requestData = await prisma.accessRequest.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (requestData.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending request can be rejected' },
        { status: 400 }
      )
    }

    await prisma.accessRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedAt: null,
        duration: null,
        expiresAt: null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject request' }, { status: 500 })
  }
}
