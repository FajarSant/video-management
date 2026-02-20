// prisma/seed.ts
import { PrismaClient, Role, RequestStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

// Check database connection string
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('❌ DATABASE_URL is not set in .env file')
}

// Setup connection pool and adapter
const pool = new pg.Pool({ 
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Test database connection before proceeding
async function testConnection() {
  try {
    const client = await pool.connect()
    console.log('✅ Database pool connected successfully')
    client.release()
    return true
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    return false
  }
}

// Initialize Prisma with adapter
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Test connection first
  const isConnected = await testConnection()
  if (!isConnected) {
    throw new Error('Cannot proceed with seeding due to connection issues')
  }

  try {
    // Create admin user
    console.log('📝 Creating admin user...')
    const hashedAdminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: Role.ADMIN,
      },
    })
    console.log('✅ Admin created:', admin.email)

    // Create sample customers
    console.log('📝 Creating customer users...')
    const hashedCustomerPassword = await bcrypt.hash('customer123', 10)
    
    const customer1 = await prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: hashedCustomerPassword,
        role: Role.CUSTOMER,
      },
    })
    console.log('✅ Customer 1 created:', customer1.email)

    const customer2 = await prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: hashedCustomerPassword,
        role: Role.CUSTOMER,
      },
    })
    console.log('✅ Customer 2 created:', customer2.email)

    const customer3 = await prisma.user.upsert({
      where: { email: 'bob.wilson@example.com' },
      update: {},
      create: {
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        password: hashedCustomerPassword,
        role: Role.CUSTOMER,
      },
    })
    console.log('✅ Customer 3 created:', customer3.email)

    // Create sample videos
    console.log('📝 Creating videos...')
    
    const video1 = await prisma.video.upsert({
      where: { id: 'video1' },
      update: {},
      create: {
        title: 'Introduction to Next.js 14',
        description: 'Learn the fundamentals of Next.js 14 including App Router, Server Components, and modern React patterns.',
        url: 'https://www.youtube.com/embed/Y6aYx_KKM7A',
        duration: 634, // 10:34 minutes in seconds
        thumbnailUrl: 'https://img.youtube.com/vi/Y6aYx_KKM7A/maxresdefault.jpg',
      },
    })
    console.log('✅ Video 1 created:', video1.title)

    const video2 = await prisma.video.upsert({
      where: { id: 'video2' },
      update: {},
      create: {
        title: 'Advanced React Patterns',
        description: 'Master advanced React concepts including custom hooks, context API, render props, and performance optimization.',
        url: 'https://www.youtube.com/embed/0ZJgIjIuY7U',
        duration: 720, // 12 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/0ZJgIjIuY7U/maxresdefault.jpg',
      },
    })
    console.log('✅ Video 2 created:', video2.title)

    const video3 = await prisma.video.upsert({
      where: { id: 'video3' },
      update: {},
      create: {
        title: 'Database Design Fundamentals',
        description: 'Learn how to design efficient and scalable database schemas, normalization, indexing, and best practices.',
        url: 'https://www.youtube.com/embed/ztHopE5Wnpc',
        duration: 845, // 14:05 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/ztHopE5Wnpc/maxresdefault.jpg',
      },
    })
    console.log('✅ Video 3 created:', video3.title)

    const video4 = await prisma.video.upsert({
      where: { id: 'video4' },
      update: {},
      create: {
        title: 'TypeScript Masterclass',
        description: 'Complete TypeScript course covering types, interfaces, generics, decorators, and advanced type manipulations.',
        url: 'https://www.youtube.com/embed/BwuLxPH8IDs',
        duration: 960, // 16 minutes
        thumbnailUrl: 'https://img.youtube.com/vi/BwuLxPH8IDs/maxresdefault.jpg',
      },
    })
    console.log('✅ Video 4 created:', video4.title)

    // Create access requests
    console.log('📝 Creating access requests...')

    // Approved request with active access
    const expiresAt1 = new Date()
    expiresAt1.setHours(expiresAt1.getHours() + 2) // 2 hours from now

    const request1 = await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer1.id,
          videoId: video1.id,
          status: RequestStatus.APPROVED
        }
      },
      update: {},
      create: {
        userId: customer1.id,
        videoId: video1.id,
        status: RequestStatus.APPROVED,
        requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        approvedAt: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        expiresAt: expiresAt1,
        duration: 2,
      },
    })
    console.log('✅ Approved request created for customer1 (video1)')

    // Create video access for approved request
    await prisma.videoAccess.upsert({
      where: {
        userId_videoId: {
          userId: customer1.id,
          videoId: video1.id,
        }
      },
      update: {},
      create: {
        userId: customer1.id,
        videoId: video1.id,
        grantedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        expiresAt: expiresAt1,
        isActive: true,
      },
    })
    console.log('✅ Active video access created for customer1')

    // Pending request
    const request2 = await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer1.id,
          videoId: video2.id,
          status: RequestStatus.PENDING
        }
      },
      update: {},
      create: {
        userId: customer1.id,
        videoId: video2.id,
        status: RequestStatus.PENDING,
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        duration: null,
      },
    })
    console.log('✅ Pending request created for customer1 (video2)')

    // Rejected request
    const request3 = await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer2.id,
          videoId: video3.id,
          status: RequestStatus.REJECTED
        }
      },
      update: {},
      create: {
        userId: customer2.id,
        videoId: video3.id,
        status: RequestStatus.REJECTED,
        requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
        approvedAt: new Date(Date.now() - 47 * 60 * 60 * 1000), // 1 hour after request
        duration: null,
      },
    })
    console.log('✅ Rejected request created for customer2 (video3)')

    // Expired request (for testing expiration)
    const expiredDate = new Date()
    expiredDate.setHours(expiredDate.getHours() - 1) // 1 hour ago

    const request4 = await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer2.id,
          videoId: video4.id,
          status: RequestStatus.EXPIRED
        }
      },
      update: {},
      create: {
        userId: customer2.id,
        videoId: video4.id,
        status: RequestStatus.APPROVED, // Start as approved
        requestedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
        approvedAt: new Date(Date.now() - 71 * 60 * 60 * 1000), // 1 hour after request
        expiresAt: expiredDate,
        duration: 1, // 1 hour access
      },
    })

    // Update status to expired
    await prisma.accessRequest.update({
      where: { id: request4.id },
      data: { status: RequestStatus.EXPIRED }
    })
    console.log('✅ Expired request created for customer2 (video4)')

    // Create multiple requests for customer3
    const expiresAt3 = new Date()
    expiresAt3.setHours(expiresAt3.getHours() + 4) // 4 hours from now

    // Approved request with active access
    await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer3.id,
          videoId: video2.id,
          status: RequestStatus.APPROVED
        }
      },
      update: {},
      create: {
        userId: customer3.id,
        videoId: video2.id,
        status: RequestStatus.APPROVED,
        requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
        expiresAt: expiresAt3,
        duration: 4,
      },
    })

    await prisma.videoAccess.upsert({
      where: {
        userId_videoId: {
          userId: customer3.id,
          videoId: video2.id,
        }
      },
      update: {},
      create: {
        userId: customer3.id,
        videoId: video2.id,
        grantedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
        expiresAt: expiresAt3,
        isActive: true,
      },
    })

    // Pending request for customer3
    await prisma.accessRequest.upsert({
      where: {
        userId_videoId_status: {
          userId: customer3.id,
          videoId: video1.id,
          status: RequestStatus.PENDING
        }
      },
      update: {},
      create: {
        userId: customer3.id,
        videoId: video1.id,
        status: RequestStatus.PENDING,
        requestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    })

    console.log('✅ Additional requests created for customer3')

    // Summary
    console.log('\n📊 Seeding Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`👥 Users created: 4 total`)
    console.log(`   - Admin: ${admin.email}`)
    console.log(`   - Customers: ${customer1.email}, ${customer2.email}, ${customer3.email}`)
    console.log(`\n🎥 Videos created: 4 total`)
    console.log(`   - ${video1.title}`)
    console.log(`   - ${video2.title}`)
    console.log(`   - ${video3.title}`)
    console.log(`   - ${video4.title}`)
    console.log(`\n📋 Access Requests: 5 total`)
    console.log(`   - ✅ Approved: 2`)
    console.log(`   - ⏳ Pending: 2`)
    console.log(`   - ❌ Rejected: 1`)
    console.log(`   - ⌛ Expired: 1`)
    console.log(`\n🔐 Video Accesses: 2 active`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n✨ Database seeded successfully!')
    console.log('\n📧 Demo credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Admin:    admin@example.com / admin123')
    console.log('Customer1: john.doe@example.com / customer123')
    console.log('Customer2: jane.smith@example.com / customer123')
    console.log('Customer3: bob.wilson@example.com / customer123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await pool.end()
    console.log('👋 Database connection closed')
  }
}

// Run the seeding function
main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })