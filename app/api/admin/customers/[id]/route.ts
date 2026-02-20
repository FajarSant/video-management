// app/api/admin/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// GET: Ambil customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔍 GET /api/admin/customers/${id} - Start`)
    
    const session = await getServerSession(authOptions)
    
    // Cek session
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { error: 'Unauthorized - No session' }, 
        { status: 401 }
      )
    }

    // Cek role admin
    if (session.user?.role !== 'ADMIN') {
      console.log('❌ Not admin. Role:', session.user?.role)
      return NextResponse.json(
        { error: 'Unauthorized - Not admin' }, 
        { status: 401 }
      )
    }

    console.log('Looking for customer with ID:', id)

    // Validasi ID
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' }, 
        { status: 400 }
      )
    }

    // Cari customer
    const customer = await prisma.user.findUnique({
      where: { 
        id: id,
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!customer) {
      console.log('❌ Customer not found with ID:', id)
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    console.log('✅ Customer found:', customer.email)
    return NextResponse.json(customer)
    
  } catch (error: any) {
    console.error('❌ Error in GET /api/admin/customers/[id]:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message,
        type: error.name 
      }, 
      { status: 500 }
    )
  }
}

// PUT: Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔍 PUT /api/admin/customers/${id} - Start`)
    
    const session = await getServerSession(authOptions)
    
    // Cek session
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { error: 'Unauthorized - No session' }, 
        { status: 401 }
      )
    }

    // Cek role admin
    if (session.user?.role !== 'ADMIN') {
      console.log('❌ Not admin. Role:', session.user?.role)
      return NextResponse.json(
        { error: 'Unauthorized - Not admin' }, 
        { status: 401 }
      )
    }

    console.log('Updating customer with ID:', id)

    // Validasi ID
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' }, 
        { status: 400 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('Request body:', { ...body, password: body.password ? '***' : undefined })
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON body' }, 
        { status: 400 }
      )
    }

    const { name, email, password } = body

    // Validasi input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' }, 
        { status: 400 }
      )
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' }, 
        { status: 400 }
      )
    }

    // Validasi password jika diberikan
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' }, 
        { status: 400 }
      )
    }

    // Cek apakah customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { 
        id: id,
        role: 'CUSTOMER'
      }
    })

    if (!existingCustomer) {
      console.log('❌ Customer not found with ID:', id)
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    // Cek apakah email sudah digunakan oleh customer lain
    if (email !== existingCustomer.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' }, 
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      updatedAt: new Date()
    }

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update customer
    const updatedCustomer = await prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ Customer updated:', updatedCustomer.email)
    return NextResponse.json(updatedCustomer)
    
  } catch (error: any) {
    console.error('❌ Error in PUT /api/admin/customers/[id]:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message,
        type: error.name 
      }, 
      { status: 500 }
    )
  }
}

// DELETE: Hapus customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`🔍 DELETE /api/admin/customers/${id} - Start`)
    
    const session = await getServerSession(authOptions)
    
    // Cek session
    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { error: 'Unauthorized - No session' }, 
        { status: 401 }
      )
    }

    // Cek role admin
    if (session.user?.role !== 'ADMIN') {
      console.log('❌ Not admin. Role:', session.user?.role)
      return NextResponse.json(
        { error: 'Unauthorized - Not admin' }, 
        { status: 401 }
      )
    }

    console.log('Deleting customer with ID:', id)

    // Validasi ID
    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' }, 
        { status: 400 }
      )
    }

    // Cek apakah customer exists
    const existingCustomer = await prisma.user.findUnique({
      where: { 
        id: id,
        role: 'CUSTOMER'
      }
    })

    if (!existingCustomer) {
      console.log('❌ Customer not found with ID:', id)
      return NextResponse.json(
        { error: 'Customer not found' }, 
        { status: 404 }
      )
    }

    // Hapus customer (cascade akan menghapus relasi terkait)
    await prisma.user.delete({
      where: { id: id }
    })

    console.log('✅ Customer deleted:', existingCustomer.email)
    return NextResponse.json(
      { message: 'Customer deleted successfully' }, 
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/admin/customers/[id]:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message,
        type: error.name 
      }, 
      { status: 500 }
    )
  }
}